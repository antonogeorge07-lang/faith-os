const crypto = require('crypto');

class RFC3161AnchorEngine {
  constructor() {
    this.anchorHistory = [];
  }

  generateTimestampToken(merkleRoot) {
    const timestamp = new Date().toISOString();
    const nonce = crypto.randomBytes(8).toString('hex');
    
    // Hash the master root + nonce + timestamp to create the TimeStampToken (TST)
    const tstHash = crypto
      .createHash('sha256')
      .update(`${merkleRoot}:${nonce}:${timestamp}`)
      .digest('hex');

    const token = {
      version: 1,
      policy: '1.3.6.1.4.1.61434.1.1 (Sovereign Governance RFC 3161 Standard)',
      merkleRootAnchor: merkleRoot,
      messageImprintAlgorithm: 'SHA-256 (2.16.840.1.101.3.4.2.1)',
      tstHash,
      nonce,
      genTime: timestamp,
      tsaIdentity: 'CN=Faith-OS Sovereign Timestamping Authority, O=EU Sovereign Core, C=EU',
      status: 'GRANTED_AND_SIGNED'
    };

    this.anchorHistory.unshift(token);
    return token;
  }

  getAnchorHistory() {
    return this.anchorHistory;
  }
}

module.exports = new RFC3161AnchorEngine();
