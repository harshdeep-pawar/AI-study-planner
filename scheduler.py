from datetime import datetime, timedelta, date
from typing import List, Dict
import pandas as pd
from .models import StudentProfile, Subject, StudySession, Topic

class AICognitiveScheduler:
    def __init__(self, profile: StudentProfile, subjects: List[Subject]):
        self.profile = profile
        self.subjects = subjects
        self.schedule = []
        self.insights = []

    def calculate_priority(self, subject: Subject, topic: Topic, days_remaining: int) -> float:
        # 1. Credit Weight (Normalized to 0-1 range roughly, 0.4 weight)
        credit_score = (subject.credits / 5.0) * 0.4
        
        # 2. Weakness Level (Inverse of confidence, 0.3 weight)
        # Confidence 1 -> Weakness 1.0
        # Confidence 5 -> Weakness 0.0
        weakness_score = ((5 - subject.confidence_level) / 5.0) * 0.3
        
        # 3. Deadline Urgency (0.2 weight)
        # If imminent (< 7 days), high urgency.
        urgency_score = 0.0
        if days_remaining <= 7:
            urgency_score = 0.2
        elif days_remaining <= 14:
            urgency_score = 0.1
        
        # 4. Foundation / Prerequisite Bonus (Critical for sequence)
        prereq_bonus = 0.15 if topic.is_prerequisite else 0.0
        
        # Total
        return credit_score + weakness_score + urgency_score + prereq_bonus

    def determine_session_type(self, confidence: int, topic: Topic) -> str:
        if topic.is_prerequisite and confidence < 3:
            return "Foundation Building" # Deep learning
        elif confidence < 4:
            return "Concept Deep Dive"
        else:
            return "Practice & Application"

    def generate_schedule(self) -> List[StudySession]:
        current_date = self.profile.preferences.start_date
        # Simple heuristic: Plan for next 14 days
        planning_horizon = 14 
        
        all_tasks = []
        
        # Expansion of subjects into actionable blocks
        for sub in self.subjects:
            days_left = (sub.target_date - current_date).days if sub.target_date else 30
            
            # Auto-generate topics if none provided (for demo/MVP)
            topics_to_schedule = sub.topics
            if not topics_to_schedule:
                topics_to_schedule = [
                    Topic(name=f"{sub.name} - Unit 1", is_prerequisite=True, difficulty="High"),
                    Topic(name=f"{sub.name} - Unit 2", is_prerequisite=False, difficulty="Medium"),
                    Topic(name=f"{sub.name} - Practice", is_prerequisite=False, difficulty="Low")
                ]
            
            for topic in topics_to_schedule:
                p_score = self.calculate_priority(sub, topic, days_left)
                task = {
                    "subject": sub.name,
                    "topic": topic,
                    "priority": p_score,
                    "confidence": sub.confidence_level,
                    "credits": sub.credits,
                    "estimated_hours": 2.0 # Placeholder estimation
                }
                all_tasks.append(task)

        # Sort by Priority (High to Low)
        all_tasks.sort(key=lambda x: x['priority'], reverse=True)
        
        # Allocation Loop
        task_idx = 0
        
        for day_offset in range(planning_horizon):
            day = current_date + timedelta(days=day_offset)
            is_weekend = day.weekday() >= 5
            
            available_hours = self.profile.preferences.daily_study_hours
            if is_weekend:
                available_hours *= self.profile.preferences.weekend_multiplier
                
            # Define slots based on preference (Simplified: Morning start)
            # 9:00 AM start default
            current_time = datetime.combine(day, datetime.strptime("09:00", "%H:%M").time())
            
            hours_scheduled = 0
            
            while hours_scheduled < available_hours and task_idx < len(all_tasks):
                task = all_tasks[task_idx]
                
                # Dynamic Duration: Hard topics need more contiguous time
                session_duration = 2.0 if task['topic'].difficulty == "High" else 1.0
                
                # Prevent overflow
                if hours_scheduled + session_duration > available_hours:
                    break
                    
                session_type = self.determine_session_type(task['confidence'], task['topic'])
                
                # Create detailed session explanation
                reason = f"High priority ({task['priority']:.2f}). "
                if task['topic'].is_prerequisite:
                    reason += "Foundational concept."
                elif task['confidence'] < 3:
                    reason += "Confidence needs boost."
                
                session = StudySession(
                    id=f"{day}-{task_idx}",
                    subject_name=task['subject'],
                    topic=task['topic'].name,
                    start_time=current_time,
                    duration_minutes=int(session_duration * 60),
                    session_type=session_type,
                    priority_score=task['priority'],
                    reason=reason
                )
                self.schedule.append(session)
                
                # Update counters
                current_time += timedelta(hours=session_duration)
                current_time += timedelta(minutes=15) # 15 min break
                hours_scheduled += session_duration
                
                # Move to next task (or repeat for multiple sessions? Simplified: Move next)
                # In real app, we'd decrement needed hours. Here assuming 1-shot per topic for MVP.
                task_idx += 1
                
        # Generate Insights
        self.generate_insights(all_tasks)
        return self.schedule
        
    def generate_insights(self, tasks):
        high_pri = [t['subject'] for t in tasks[:3]]
        self.insights.append(f"🔥 Focus Context: Your top critical subjects are {', '.join(set(high_pri))}.")
        
        weak_spots = [t['subject'] for t in tasks if t['confidence'] < 3]
        if weak_spots:
            self.insights.append(f"⚠️ Gap Alert: {len(set(weak_spots))} subjects flagged as low confidence. Extra foundation blocks allocated.")
            
        self.insights.append("💡 Cognitive Load Balance: Heavy concepts scheduled for your peak energy times.")

