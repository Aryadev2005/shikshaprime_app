import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging import logger
from app.api.v1.endpoints import attendance

# Initialize App
app = FastAPI(
    title="ShikshaPrime OCR API", 
    version="1.0",
    root_path="/ai-docs"  # Fixes Swagger UI blank screen behind NGINX proxy
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(attendance.router, prefix="/api/v1", tags=["Attendance"])

@app.get("/")
def health_check():
    logger.debug("Health check requested.")
    return {"status": 1, "service": "OCR Pipeline", "version": "1.0"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
