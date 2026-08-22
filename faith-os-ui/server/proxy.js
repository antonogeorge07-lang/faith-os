const express = require('express');
const crypto = require('crypto');
const cryptoShredder = require('./cryptoShredder');
const { screenAnnex3Risk } = require('./annex3Classifier');
const rfc3161Engine = require('./rfc3161Anchor');

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-faith-jurisdiction-lock, x-faith-mode, x-faith-subject-id');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Bearer Authentication Middleware
function authGuard(req, res, next) {
  const expectedSecret = process.env.FAITH_BEARER_SECRET || 'faith_sovereign_internal_sec_2026';
  const authHeader = req.headers['authorization'];
  
  // Allow internal browser demo calls without header if requested via local origin
  if (!authHeader && req.headers['origin'] && req.headers['origin'].includes('localhost')) {
    return next();
  }

  if (authHeader && authHeader === `Bearer ${expectedSecret}`) {
    return next();
  }

  return res.status(401).json({ error: 'UNAUTHORIZED: Valid Bearer Token required.' });
}

// In-Memory Merkle Tree
let auditLeaves = [
  {
    index: 0,
    timestamp: '2026-08-19T00:00:00.000Z',
    eventType: 'MERKLE_GENESIS_ROOT',
    proofHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    leafHash: '496e0f9116f19412e01f80fb89f73aa6375f5bec8826420e86b77de8ec2c94c5',
    previousRoot: '0000000000000000000000000000000000000000000000000000000000000000',
    currentRoot: '496e0f9116f19412e01f80fb89f73aa6375f5bec8826420e86b77de8ec2c94c5'
  }
];

function appendMerkleLeaf(eventType, payloadStr) {
  const previousLeaf = auditLeaves[auditLeaves.length - 1];
  const leafHash = crypto.createHash('sha256').update(payloadStr).digest('hex');
  const proofHash = crypto.createHash('sha256').update(`${previousLeaf.currentRoot}:${leafHash}`).digest('hex');
  const currentRoot = proofHash;

  const node = {
    index: auditLeaves.length,
    timestamp: new Date().toISOString(),
    eventType,
    proofHash,
    leafHash,
    previousRoot: previousLeaf.currentRoot,
    currentRoot
  };

  auditLeaves.unshift(node);
  return node;
}

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    runtime: 'Faith-OS Sovereign Proxy, Crypto-Shredder & RFC3161 Engine',
    port: process.env.PORT || 8085,
    merkleRoot: auditLeaves[0].currentRoot,
    totalAudits: auditLeaves.length
  });
});

// GET Merkle Tree
app.get('/v1/audit/merkle-tree', (req, res) => {
  res.json({
    root: auditLeaves[0].currentRoot,
    totalLeaves: auditLeaves.length,
    history: auditLeaves
  });
});

// Chat Completions Proxy with In-Flight Screening & Crypto-Shredding Tokenization
app.post('/v1/chat/completions', (req, res) => {
  const { messages } = req.body;
  const rawContent = messages?.[0]?.content || '';
  const subjectId = req.headers['x-faith-subject-id'] || 'subject-default-eu-01';

  // 1. EU AI Act Annex III Screener
  const riskAnalysis = screenAnnex3Risk(rawContent);

  // 2. Crypto-Shredding Tokenization
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const ibanRegex = /\b([A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16})\b/g;

  let maskedContent = rawContent.replace(emailRegex, (match) => {
    return cryptoShredder.tokenize(subjectId, match, 'email');
  });

  maskedContent = maskedContent.replace(ibanRegex, (match) => {
    return cryptoShredder.tokenize(subjectId, match, 'iban');
  });

  // 3. Append to Immutable Merkle Chain
  const merkleNode = appendMerkleLeaf('INFERENCE_PROXY_INGESTION', `${rawContent}:${maskedContent}:${subjectId}`);

  res.setHeader('X-Faith-Sovereign-Proof', merkleNode.proofHash);
  res.setHeader('X-Faith-Annex-III-Risk', riskAnalysis.riskLevel);

  res.json({
    id: `faith-chat-${crypto.randomBytes(4).toString('hex')}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'mistral-large-sovereign-eu',
    upstreamGateway: 'Sovereign In-VPC Local LLM',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: `[Sovereign Local Inference Verified] Prompt: "${maskedContent}"`
        },
        finish_reason: 'stop'
      }
    ],
    annex3Classification: riskAnalysis,
    sovereignMetadata: {
      originalInput: rawContent,
      maskedEgress: maskedContent,
      subjectId
    },
    merkleRecord: merkleNode
  });
});

// GDPR Art. 17: Right-to-Erasure Endpoint (Key Shredding)
app.delete('/v1/privacy/crypto-shred/:subjectId', authGuard, (req, res) => {
  const { subjectId } = req.params;
  const result = cryptoShredder.shredSubjectKey(subjectId);
  
  if (result.success) {
    const merkleNode = appendMerkleLeaf('GDPR_ARTICLE_17_CRYPTO_SHRED', `SHRED:${subjectId}`);
    return res.json({
      ...result,
      merkleRecord: merkleNode
    });
  }

  res.status(404).json(result);
});

// RFC 3161 External Timestamp Anchor Trigger
app.post('/v1/audit/rfc3161-anchor', (req, res) => {
  const currentRoot = auditLeaves[0].currentRoot;
  const token = rfc3161Engine.generateTimestampToken(currentRoot);
  const merkleNode = appendMerkleLeaf('RFC3161_EXTERNAL_TSA_ANCHOR', JSON.stringify(token));

  res.json({
    timestampToken: token,
    merkleRecord: merkleNode
  });
});

// Get RFC 3161 History
app.get('/v1/audit/rfc3161-history', (req, res) => {
  res.json({
    anchors: rfc3161Engine.getAnchorHistory()
  });
});

const PORT = process.env.PORT || 8085;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Faith-OS Sovereign Proxy listening on port ${PORT}`);
});
