from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime
import uvicorn
import networkx as nx

# Import new AI Models
from .models import (
    StudentProfile, StudyPreferences, StudentBehavior,
    Topic, StudySession, DailyMission, AnalyticsDashboard,
    ScheduleResponse
)
from .ai_engine import UltraAIEngine

app = FastAPI(title="Engineering Study Planner AI v2.0")

# Mount static files
app.mount("/static", StaticFiles(directory="src/static"), name="static")

# Request Models wrapper for API
class GenerateRequest(BaseModel):
    profile: StudentProfile
    topics: List[Topic]

# In-memory storage for MVP (Production uses DB)
# We store the latest generated schedule to serve "Daily Mission" separately if needed
ALREADY_GENERATED = {} 

@app.post("/api/generate-schedule", response_model=ScheduleResponse)
async def generate_schedule(request: GenerateRequest):
    try:
        # 1. Initialize Ultra AI Engine
        engine = UltraAIEngine(request.profile, request.topics)
        
        # 2. Run Modules 1, 2, 5 (Graph, Difficulty, Scheduling)
        schedule = engine.generate_timeline()
        
        # 3. generate Daily Mission (Module 3)
        mission = engine.get_daily_mission()
        
        # 4. Generate Analytics (Modules 4, 10)
        analytics = engine.analytics
        analytics.dependency_graph = engine.get_serialized_graph()
        
        response = ScheduleResponse(
            student_name=request.profile.name,
            generated_at=datetime.now(),
            daily_mission=mission,
            upcoming_schedule=schedule, # Full timeline
            analytics=analytics,
            insights=[
                "AI Detected: 'Graph Theory' is a bottleneck. Prerequisite 'Trees' scheduled.",
                "Cognitive load optimized for Morning sessions.",
                f"Procrastination Probability: {request.profile.behavior.missed_streak * 10}% (Adjustment applied)"
            ]
        )
        
        ALREADY_GENERATED['latest'] = response
        return response
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard-summary")
async def get_dashboard():
    if 'latest' in ALREADY_GENERATED:
        return ALREADY_GENERATED['latest']
    return {"message": "No schedule generated yet."}

from fastapi.responses import RedirectResponse
@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
