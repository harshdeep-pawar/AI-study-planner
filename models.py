from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, date

class Topic(BaseModel):
    id: str  # Unique ID
    name: str
    subject_id: str
    # AI Learned Stats
    difficulty_level: str = "Medium" # Easy, Medium, Hard (AI adjust)
    avg_quiz_score: float = 0.0      # 0-100%
    revisions_completed: int = 0
    failure_frequency: int = 0
    # Dependencies
    prerequisites: List[str] = [] # List of Topic IDs required before this one

class StudySession(BaseModel):
    id: str
    subject_name: str
    topic_id: str
    topic_name: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    session_type: str # Learn, Practice, Revision, Foundation, Emergency_Practice
    priority_score: float
    reason: str 
    status: str = "Planned" # Planned, Completed, Missed, Rescheduled

class StudentBehavior(BaseModel):
    # Procrastination Tracking
    last_session_delay_minutes: int = 0
    missed_streak: int = 0
    completion_rate_7d: float = 0.8
    productive_time_preferences: Dict[str, float] = {} # e.g. {"Morning": 0.9, "Night": 0.4}

class StudyPreferences(BaseModel):
    daily_study_hours: float = 4.0
    preferred_time: str = "Morning"
    weekend_multiplier: float = 1.5
    exam_date: Optional[date] = None

class StudentProfile(BaseModel):
    name: str
    branch: Optional[str] = None
    preferences: StudyPreferences
    behavior: StudentBehavior = Field(default_factory=StudentBehavior)

class DailyMission(BaseModel):
    date: date
    focus_theme: str # "Deep Dive Day", "Revision Sprint", etc.
    sessions: List[StudySession]
    energy_tip: str # AI energy advice

class AnalyticsDashboard(BaseModel):
    consistency_score: int # 0-100
    predicted_confidence: float # Projected confidence next week
    risk_subjects: List[str]
    top_productive_hour: str
    dependency_graph: Dict[str, List[str]] # Adjacency list for UI visualization

class ScheduleResponse(BaseModel):
    student_name: str
    generated_at: datetime
    daily_mission: DailyMission
    upcoming_schedule: List[StudySession]
    analytics: AnalyticsDashboard
    insights: List[str]
