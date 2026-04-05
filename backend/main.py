from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time

app = FastAPI(title="EmotionSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmotionData(BaseModel):
    engagement: float
    confusion: float
    boredom: float
    frustration: float
    surprise: float
    happiness: float
    timestamp: float

class SessionUpdate(BaseModel):
    session_id: str
    emotions: EmotionData

@app.get("/")
async def root():
    return {"message": "EmotionSense API is running"}

@app.post("/session/update")
async def update_session(data: SessionUpdate):
    # Logic for adaptive content would go here
    # For now, just log and return success
    print(f"Received data for session {data.session_id}: {data.emotions}")
    
    # Example logic: if confusion is high, return a hint recommendation
    intervention = None
    if data.emotions.confusion > 0.7:
        intervention = {
            "type": "hint",
            "message": "It looks like this might be tricky. Need a hint?",
            "action": "show_hint"
        }
    elif data.emotions.boredom > 0.8:
        intervention = {
            "type": "break",
            "message": "You've been studying for a while. How about a 2-minute stretch?",
            "action": "suggest_break"
        }
        
    return {
        "status": "success",
        "intervention": intervention
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
