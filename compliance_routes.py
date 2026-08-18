import io
import json
import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, Field
import pdfplumber

router = APIRouter()

# ==========================================
# 1. DOMAIN SCHEMAS
# ==========================================
class ComplianceStatus(str, Enum):
    VERIFIED = "Signed & Active"
    MISSING_DPA = "Missing DPA"
    RENEWAL_QUEUED = "Renewal Queued"

class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    CRITICAL = "Critical"

class Vendor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    jurisdiction: str
    dpa_status: ComplianceStatus = ComplianceStatus.MISSING_DPA
    soc2_status: str = "Unverified"
    data_points_processed: List[str] = Field(default_factory=list)
    verified_date: Optional[str] = None
    risk_score: RiskLevel = RiskLevel.MEDIUM
    latency_ms: float = 0.019

class VendorCreate(BaseModel):
    name: str
    category: str
    jurisdiction: str
    data_points_processed: List[str] = []

class TrustProfile(BaseModel):
    company_name: str
    gdpr_score: float
    total_vendors: int
    verified_vendors: int
    active_dpas: int
    pipeline_status: str
    updated_at: str

# In-memory store
DATABASE: Dict[str, Vendor] = {
    "v-1": Vendor(
        id="v-1",
        name="AWS Cloud Infrastructure",
        category="Compute & Storage",
        jurisdiction="EU (Frankfurt)",
        dpa_status=ComplianceStatus.VERIFIED,
        soc2_status="Type II Verified",
        data_points_processed=["User Auth", "Encrypted Blobs"],
        verified_date="Aug 14, 2026",
        risk_score=RiskLevel.LOW,
        latency_ms=0.012
    ),
    "v-2": Vendor(
        id="v-2",
        name="Stripe Payments Europe",
        category="Billing Core",
        jurisdiction="EU (Dublin)",
        dpa_status=ComplianceStatus.MISSING_DPA,
        soc2_status="Type II Verified",
        data_points_processed=["Billing Address", "Card Metadata"],
        verified_date=None,
        risk_score=RiskLevel.CRITICAL,
        latency_ms=0.045
    )
}

# ==========================================
# 2. WEBSOCKET PIPELINE MANAGER
# ==========================================
class PipelineManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event: str, payload: dict):
        message = json.dumps({"event": event, "data": payload, "timestamp": datetime.utcnow().isoformat()})
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

pipeline_manager = PipelineManager()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    extracted_text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages[:5]:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
    return extracted_text

async def process_dpa_audit(vendor_id: str, file_bytes: bytes):
    raw_text = extract_text_from_pdf(file_bytes)
    has_gdpr = "GDPR" in raw_text or "General Data Protection Regulation" in raw_text or "Standard Contractual Clauses" in raw_text
    has_soc = "SOC 2" in raw_text or "Type II" in raw_text or "AICPA" in raw_text
    
    if vendor_id in DATABASE:
        vendor = DATABASE[vendor_id]
        if has_gdpr:
            vendor.dpa_status = ComplianceStatus.VERIFIED
            vendor.risk_score = RiskLevel.LOW
            vendor.verified_date = datetime.utcnow().strftime("%b %d, %Y")
        else:
            vendor.dpa_status = ComplianceStatus.RENEWAL_QUEUED
            vendor.risk_score = RiskLevel.MEDIUM
            
        if has_soc:
            vendor.soc2_status = "Type II Verified"
            
        DATABASE[vendor_id] = vendor
        await pipeline_manager.broadcast("VENDOR_AUDIT_COMPLETED", vendor.model_dump())

# ==========================================
# 3. ROUTER ENDPOINTS
# ==========================================
@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "engine": "Faith-OS Manifest Core",
        "vector_port": 8999,
        "latency_ms": 0.019
    }

@router.get("/profile", response_model=TrustProfile)
async def get_trust_profile():
    vendors = list(DATABASE.values())
    total = len(vendors)
    verified = sum(1 for v in vendors if v.dpa_status == ComplianceStatus.VERIFIED)
    score = (verified / total * 100.0) if total > 0 else 100.0
    return TrustProfile(
        company_name="Faith-OS Production Node",
        gdpr_score=round(score, 1),
        total_vendors=total,
        verified_vendors=verified,
        active_dpas=verified,
        pipeline_status="OPERATIONAL",
        updated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    )

@router.get("/vendors", response_model=List[Vendor])
async def list_vendors():
    return list(DATABASE.values())

@router.post("/vendors", response_model=Vendor)
async def create_vendor(payload: VendorCreate):
    vendor = Vendor(**payload.model_dump())
    DATABASE[vendor.id] = vendor
    await pipeline_manager.broadcast("VENDOR_CREATED", vendor.model_dump())
    return vendor

@router.post("/vendors/{vendor_id}/upload-dpa")
async def upload_dpa(vendor_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if vendor_id not in DATABASE:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF compliance files supported")
    content = await file.read()
    background_tasks.add_task(process_dpa_audit, vendor_id, content)
    return {"status": "PROCESSING", "vendor_id": vendor_id, "filename": file.filename}

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await pipeline_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pipeline_manager.disconnect(websocket)
