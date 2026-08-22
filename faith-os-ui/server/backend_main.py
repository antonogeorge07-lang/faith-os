import os
import sys
import re
import io
import math
import shutil
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pypdf

# Ensure /app/server is in Python path for module imports
sys.path.insert(0, os.path.dirname(__file__))
try:
    from notifier import notifier
except ImportError:
    from server.notifier import notifier

# Safe OCR & binary initialization
OCR_AVAILABLE = False
try:
    import pytesseract
    from pdf2image import convert_from_bytes
    tess_bin = shutil.which("tesseract") or "/usr/bin/tesseract"
    if os.path.exists(tess_bin):
        pytesseract.pytesseract.tesseract_cmd = tess_bin
        OCR_AVAILABLE = True
except Exception as e:
    print(f"[OCR Init Warning] {e}")
    OCR_AVAILABLE = False

app = FastAPI(title="Faith-OS Sovereign Document Intelligence & Vector Vault", version="3.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TENANT_LEGAL_NAME = os.getenv("TENANT_LEGAL_NAME", "Faith OS Enterprise")

# ==========================================
# In-Memory Vector Store & Semantic Index
# ==========================================
class SimpleVectorVault:
    def __init__(self):
        self.documents = []
        self._seed_default_vault()

    def _seed_default_vault(self):
        self.add_document(
            doc_id="dpa-mistral-01",
            filename="Mistral_AI_Enterprise_DPA_2026.pdf",
            doc_type="Data Processing Addendum (DPA)",
            lob="Legal & Data Protection (DPO)",
            vendor="Mistral AI (Paris)",
            text="Mistral AI commits to European hosting in Paris region (europe-west1). Zero data retention for inference payloads. Full GDPR Article 28 compliance and technical measures including encryption at rest and in transit."
        )
        self.add_document(
            doc_id="dpa-anthropic-02",
            filename="Anthropic_EU_Standard_Contractual_Clauses.pdf",
            doc_type="Data Processing Addendum (DPA)",
            lob="Legal & Data Protection (DPO)",
            vendor="Anthropic PBC",
            text="Anthropic Standard Contractual Clauses (SCCs) governing international data transfers with supplementary technical safeguards, AES-256 tokenization, and strict 30-day zero persistence log commitments."
        )

    def _tokenize_text(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r"\w+", text) if len(w) > 2]

    def _compute_vector(self, tokens: List[str]) -> dict:
        tf = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        return tf

    def add_document(self, doc_id: str, filename: str, doc_type: str, lob: str, vendor: str, text: str):
        tokens = self._tokenize_text(text)
        vector = self._compute_vector(tokens)
        entry = {
            "id": doc_id,
            "filename": filename,
            "docType": doc_type,
            "lob": lob,
            "vendor": vendor,
            "text": text,
            "summary": text[:200] + "..." if len(text) > 200 else text,
            "vector": vector,
            "tokenCount": len(tokens)
        }
        self.documents.append(entry)
        return entry

    def semantic_search(self, query: str, top_k: int = 5):
        q_tokens = self._tokenize_text(query)
        if not q_tokens:
            return []
        
        q_vector = self._compute_vector(q_tokens)
        results = []

        for doc in self.documents:
            d_vector = doc["vector"]
            dot_product = sum(q_vector.get(k, 0) * d_vector.get(k, 0) for k in q_vector)
            q_norm = math.sqrt(sum(v ** 2 for v in q_vector.values()))
            d_norm = math.sqrt(sum(v ** 2 for v in d_vector.values()))

            score = (dot_product / (q_norm * d_norm)) if (q_norm > 0 and d_norm > 0) else 0.0

            if score > 0.05:
                results.append({
                    "id": doc["id"],
                    "filename": doc["filename"],
                    "docType": doc["docType"],
                    "lob": doc["lob"],
                    "vendor": doc["vendor"],
                    "similarityScore": round(float(score), 4),
                    "matchedSnippet": doc["summary"]
                })

        results.sort(key=lambda x: x["similarityScore"], reverse=True)
        return results[:top_k]

vault_store = SimpleVectorVault()

# ==========================================
# Document Classification Models
# ==========================================
class DocumentMetadata(BaseModel):
    docType: str
    isGovernanceDoc: bool
    dataCategories: str
    dataSubjects: str
    safeguard: str
    retentionPeriod: str
    targetLob: str

class SemanticSearchQuery(BaseModel):
    query: str
    topK: Optional[int] = 5

class ScreeningResponse(BaseModel):
    id: str
    filename: str
    docType: str
    extractedVendor: str
    extractedEntity: str
    flagReason: Optional[str] = None
    confidenceScore: float
    quarantinePath: Optional[str] = None
    matchedLob: Optional[str] = None
    detectedDate: str
    severity: str
    status: str
    extractedTextPreview: str
    ocrEngineUsed: str
    isGovernanceDoc: bool
    dataCategories: str
    dataSubjects: str
    safeguard: str
    retentionPeriod: str

def classify_document(text: str, filename: str) -> DocumentMetadata:
    t = (text + " " + filename).lower()

    if any(s in t for s in ["project management professional", "pmp", "pmi", "certified", "credential"]) or "cert" in filename.lower():
        return DocumentMetadata(
            docType="Professional Credential / Certification",
            isGovernanceDoc=False,
            dataCategories="Professional Credentials, Verification IDs",
            dataSubjects="Employees / Personnel",
            safeguard="Direct Subject Consent (Art. 6(1)(a))",
            retentionPeriod="Active Employment + 5 Years",
            targetLob="HR & Personnel Credentials"
        )

    if any(s in t for s in ["university", "bachelor", "master", "degree", "transcript", "educational"]) or "educational" in filename.lower():
        return DocumentMetadata(
            docType="Academic Degree / Educational Transcript",
            isGovernanceDoc=False,
            dataCategories="Educational History, Transcripts",
            dataSubjects="Candidates / Personnel",
            safeguard="Direct Subject Consent (Art. 6(1)(a))",
            retentionPeriod="Employment Lifecycle",
            targetLob="HR & Educational Vault"
        )

    if any(s in t for s in ["axis bank", "bank statement", "account summary", "statement of account", "ledger balance"]) or "bank" in filename.lower() or "axis" in filename.lower():
        return DocumentMetadata(
            docType="Banking Statement / Financial Record",
            isGovernanceDoc=False,
            dataCategories="Banking Metadata, Account Balances",
            dataSubjects="Authorized Officers",
            safeguard="Legal & Fiscal Obligation (Art. 6(1)(c))",
            retentionPeriod="7 Years (Financial Audit)",
            targetLob="Finance & Fiscal Accounting"
        )

    if any(s in t for s in ["curriculum vitae", "resume", "work experience", "employment history"]) or "cv" in filename.lower():
        return DocumentMetadata(
            docType="Resume / Candidate CV",
            isGovernanceDoc=False,
            dataCategories="Candidate PII, Employment History",
            dataSubjects="Applicants / Candidates",
            safeguard="Pre-contractual Review (Art. 6(1)(b))",
            retentionPeriod="12 Months",
            targetLob="Human Resources & Talent (HR)"
        )

    dpa_signals = ["data processing agreement", "data processing addendum", "dpa", "sub-processor", "standard contractual clauses", "gdpr", "technical and organizational measures"]
    if sum(1 for s in dpa_signals if s in t) >= 2 or "dpa" in filename.lower():
        return DocumentMetadata(
            docType="Data Processing Addendum (DPA)",
            isGovernanceDoc=True,
            dataCategories="Prompt Vectors, Masked Context, Telemetry",
            dataSubjects="Enterprise Platform Users",
            safeguard="Standard Contractual Clauses (Art. 46) / Direct GDPR",
            retentionPeriod="Active Term + 30 Days",
            targetLob="Legal & Data Protection (DPO)"
        )

    return DocumentMetadata(
        docType="Master Service Agreement (MSA)",
        isGovernanceDoc=True,
        dataCategories="Account Metadata, Contract Logs",
        dataSubjects="Enterprise Accounts",
        safeguard="Standard Commercial Terms",
        retentionPeriod="Contract Term Duration",
        targetLob="Procurement & Vendor Contracts"
    )

def extract_text_with_ocr_fallback(pdf_bytes: bytes) -> tuple[str, str]:
    engine_used = "pypdf (Digital Text Layer)"
    extracted_text = ""
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        pages_text = [page.extract_text() or "" for page in reader.pages[:6]]
        extracted_text = "\n".join(pages_text).strip()
    except Exception as e:
        print(f"pypdf extraction error: {e}")

    if len(extracted_text) < 40 and OCR_AVAILABLE:
        try:
            images = convert_from_bytes(pdf_bytes, first_page=1, last_page=3)
            ocr_results = [pytesseract.image_to_string(img) for img in images]
            extracted_text = "\n".join(ocr_results).strip()
            engine_used = "Tesseract OCR (Image Extraction)"
        except Exception as e:
            engine_used = "OCR Error / Fallback Failed"

    return extracted_text, engine_used

# ==========================================
# API Endpoints
# ==========================================
@app.get("/health")
def health():
    return {
        "status": "HEALTHY",
        "service": "Faith-OS Document Intelligence & Vector Vault",
        "port": 8999,
        "tesseract_ocr_ready": OCR_AVAILABLE,
        "indexedVaultDocuments": len(vault_store.documents)
    }

@app.get("/api/v1/vault/documents")
def list_vault_documents():
    return {"documents": vault_store.documents}

@app.post("/api/v1/vault/semantic-search")
def search_vault(search_req: SemanticSearchQuery):
    results = vault_store.semantic_search(search_req.query, search_req.topK or 5)
    return {
        "query": search_req.query,
        "totalMatches": len(results),
        "results": results
    }

@app.post("/api/v1/documents/screen", response_model=ScreeningResponse)
async def screen_document(file: UploadFile = File(...), lobHint: Optional[str] = Form(None)):
    try:
        contents = await file.read()
        full_text, engine_used = extract_text_with_ocr_fallback(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to screen PDF: {str(e)}")

    doc_meta = classify_document(full_text, file.filename)
    text_lower = (full_text + " " + file.filename).lower()
    text_preview = full_text[:400].replace("\n", " ").strip() if full_text else "No extractable text found."
    doc_id = f"doc-{os.urandom(3).hex()}"

    if not doc_meta.isGovernanceDoc:
        vault_store.add_document(doc_id, file.filename, doc_meta.docType, doc_meta.targetLob, "Internal Subject", full_text)
        return ScreeningResponse(
            id=doc_id, filename=file.filename, docType=doc_meta.docType,
            extractedVendor="N/A (Direct Operational Subject)", extractedEntity="Internal Subject",
            flagReason=None, confidenceScore=0.96, quarantinePath=None, matchedLob=doc_meta.targetLob,
            detectedDate="2026-08-19 18:00", severity="Low", status="Screened & Synced",
            extractedTextPreview=text_preview, ocrEngineUsed=engine_used, isGovernanceDoc=False,
            dataCategories=doc_meta.dataCategories, dataSubjects=doc_meta.dataSubjects,
            safeguard=doc_meta.safeguard, retentionPeriod=doc_meta.retentionPeriod
        )

    vendor = "Unknown Third Party"
    if "anthropic" in text_lower: vendor = "Anthropic PBC"
    elif "mistral" in text_lower: vendor = "Mistral AI"
    elif "pinecone" in text_lower: vendor = "Pinecone Systems"
    elif "cohere" in text_lower: vendor = "Cohere Corp"
    elif "openai" in text_lower: vendor = "OpenAI LLC"
    elif "globalscrape" in text_lower: vendor = "GlobalScrape Corp"

    entity = "Unknown Entity"
    entity_match = re.search(r"(?:between|by and between|client|tenant|customer)\s+([A-Za-z0-9\s,\.]{3,50})(?:and|\n|,)", full_text, re.IGNORECASE)
    if entity_match:
        entity = entity_match.group(1).strip()
    elif "faith os" in text_lower or "faith-os" in text_lower:
        entity = TENANT_LEGAL_NAME

    is_mismatch = (TENANT_LEGAL_NAME.lower() not in entity.lower()) and ("faith os" not in text_lower)
    is_unregistered = vendor == "Unknown Third Party"

    if is_mismatch:
        reason = "Mismatched Contracting Entity"
        notifier.broadcast_alert(file.filename, reason, vendor, entity, "Critical", 0.22)
        return ScreeningResponse(
            id=doc_id, filename=file.filename, docType=doc_meta.docType, extractedVendor=vendor,
            extractedEntity=entity, flagReason=reason, confidenceScore=0.22,
            quarantinePath=f"/vault/quarantine/mismatched/{file.filename}", matchedLob="Quarantine Vault",
            detectedDate="2026-08-19 18:00", severity="Critical", status="Quarantined",
            extractedTextPreview=text_preview, ocrEngineUsed=engine_used, isGovernanceDoc=True,
            dataCategories=doc_meta.dataCategories, dataSubjects=doc_meta.dataSubjects,
            safeguard=doc_meta.safeguard, retentionPeriod=doc_meta.retentionPeriod
        )

    if is_unregistered:
        reason = "Unregistered Vendor / Sub-processor"
        notifier.broadcast_alert(file.filename, reason, vendor, entity, "High", 0.45)
        return ScreeningResponse(
            id=doc_id, filename=file.filename, docType=doc_meta.docType, extractedVendor=vendor,
            extractedEntity=entity, flagReason=reason, confidenceScore=0.45,
            quarantinePath=f"/vault/quarantine/unregistered/{file.filename}", matchedLob="Pending DPO Review",
            detectedDate="2026-08-19 18:00", severity="High", status="Quarantined",
            extractedTextPreview=text_preview, ocrEngineUsed=engine_used, isGovernanceDoc=True,
            dataCategories=doc_meta.dataCategories, dataSubjects=doc_meta.dataSubjects,
            safeguard=doc_meta.safeguard, retentionPeriod=doc_meta.retentionPeriod
        )

    vault_store.add_document(doc_id, file.filename, doc_meta.docType, doc_meta.targetLob, vendor, full_text)

    return ScreeningResponse(
        id=doc_id, filename=file.filename, docType=doc_meta.docType, extractedVendor=vendor,
        extractedEntity=entity, flagReason=None, confidenceScore=0.98,
        quarantinePath=None, matchedLob=doc_meta.targetLob, detectedDate="2026-08-19 18:00",
        severity="Low", status="Screened & Synced", extractedTextPreview=text_preview,
        ocrEngineUsed=engine_used, isGovernanceDoc=True, dataCategories=doc_meta.dataCategories,
        dataSubjects=doc_meta.dataSubjects, safeguard=doc_meta.safeguard, retentionPeriod=doc_meta.retentionPeriod
    )
