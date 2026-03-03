from fastapi import FastAPI

app = FastAPI(title="SynKrasis Backend API", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "SynKrasis Backend is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
