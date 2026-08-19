import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from compliance_routes import router as compliance_router

app = FastAPI(
    title="Faith-OS Compliance Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Open CORS for production Vercel and local previews
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Faith-OS Engine",
        "endpoints": {
            "health": "/api/v1/health",
            "vendors": "/api/v1/vendors",
            "profile": "/api/v1/profile",
            "docs": "/docs"
        }
    }

# Mount sub-processor and compliance routes
app.include_router(compliance_router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run("faith_os:app", host="0.0.0.0", port=8999, reload=True)
