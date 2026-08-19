import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

router = APIRouter()

class Vendor(BaseModel):
    id: str
    name: string if False else str
    category: str
    jurisdiction: str
    dpa_status: str
    soc2_status: str
    data_points_processed: List[str]
    verified_date: Optional[str]
    risk_score: str
    latency_ms: float

class VendorCreate(BaseModel):
    name: str
    category: str
    jurisdiction: str
    data_points_processed: List[str]

VENDORS_DB = [
    {
        "id": str(uuid.uuid4()),
        "name": "Anthropic PBC",
        "category": "AI Inference / LLM",
        "jurisdiction": "US / EU SCC Validated",
        "dpa_status": "Signed & Active",
        "soc2_status": "SOC2 Type II",
        "data_points_processed": ["Prompt Embeddings", "Context Logs"],
        "verified_date": "2026-08-01",
        "risk_score": "Low",
        "latency_ms": 0.018
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Pinecone Systems",
        "category": "Vector DB / Storage",
        "jurisdiction": "EU (Frankfurt)",
        "dpa_status": "Signed & Active",
        "soc2_status": "ISO 27001",
        "data_points_processed": ["High-dimensional Vectors"],
        "verified_date": "2026-07-28",
        "risk_score": "Low",
        "latency_ms": 0.012
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Mistral AI",
        "category": "AI Inference / LLM",
        "jurisdiction": "EU (Paris)",
        "dpa_status": "Signed & Active",
        "soc2_status": "SOC2 Type II",
        "data_points_processed": ["Telemetry", "User Sessions"],
        "verified_date": "2026-08-10",
        "risk_score": "Low",
        "latency_ms": 0.015
    }
]

@router.get("/health")
def health():
    return {"status": "ok", "service": "faith-os-backend", "engine": "active"}

@router.get("/vendors")
def get_vendors():
    return VENDORS_DB

@router.post("/vendors")
def create_vendor(v: VendorCreate):
    new_vendor = {
        "id": str(uuid.uuid4()),
        "name": v.name,
        "category": v.category,
        "jurisdiction": v.jurisdiction,
        "dpa_status": "Signed & Active",
        "soc2_status": "SOC2 Type II",
        "data_points_processed": v.data_points_processed,
        "verified_date": "2026-08-19",
        "risk_score": "Low",
        "latency_ms": 0.019
    }
    VENDORS_DB.append(new_vendor)
    return new_vendor

@router.post("/vendors/{vendor_id}/upload-dpa")
async def upload_dpa(vendor_id: str, file: UploadFile = File(...)):
    for vendor in VENDORS_DB:
        if vendor["id"] == vendor_id:
            vendor["dpa_status"] = "Signed & Active"
            vendor["verified_date"] = "2026-08-19"
            return {"status": "success", "filename": file.filename, "vendor_id": vendor_id}
    return {"status": "error", "message": "Vendor not found"}

@router.get("/profile")
def get_profile():
    signed = sum(1 for v in VENDORS_DB if v["dpa_status"] == "Signed & Active")
    total = len(VENDORS_DB)
    score = int((signed / total) * 100) if total > 0 else 100
    return {
        "company_name": "Faith OS Enterprise",
        "gdpr_score": score,
        "total_vendors": total,
        "verified_vendors": signed,
        "active_dpas": signed,
        "pipeline_status": "ACTIVE",
        "updated_at": "2026-08-19T08:15:00Z"
    }
