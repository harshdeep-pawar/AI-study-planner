from datetime import datetime, timedelta, date
from typing import List, Dict, Optional
import networkx as nx
from .models import StudentProfile, Topic, StudySession, DailyMission, AnalyticsDashboard
import random

class UltraAIEngine:
    def __init__(self, profile: StudentProfile, topics: List[Topic]):
        self.profile = profile
        self.topics = topics
        self.tasks_map = {t.id: t for t in topics}
        self.G = self._build_knowledge_graph()
        self.schedule = []
        self.analytics = AnalyticsDashboard(
            consistency_score=85,  # Dummy start
            predicted_confidence=0.7,
            risk_subjects=[],
            top_productive_hour="10:00 AM",
            dependency_graph={}
        )

    def _build_knowledge_graph(self):
        """Module 5: Smart Topic Dependency Graph using NetworkX"""
        G = nx.DiGraph()
        for t in self.topics:
            G.add_node(t.id, difficulty=t.difficulty_level)
            for prereq in t.prerequisites:
                if prereq in self.tasks_map:
                    G.add_edge(prereq, t.id)
        
        # Detect cycles early or validate DAG
        if not nx.is_directed_acyclic_graph(G):
            # Fallback: Break cycles arbitrarily for MVP reliability
            pass 
        return G

    def adapt_difficulty(self):
        """Module 1: AI Auto Subject Difficulty Detection"""
        for t in self.topics:
            # If fail freq is high or quiz score low -> Hard
            if t.failure_frequency > 2 or t.avg_quiz_score < 40:
                t.difficulty_level = "Hard"
            elif t.avg_quiz_score > 80:
                t.difficulty_level = "Easy"
            # Else remains Medium/Manual set

    def calculate_priority(self, topic: Topic, day_offset: int) -> float:
        """Original Formula + New AI Weights"""
        # Base logic
        base_priority = 0.5 
        if topic.difficulty_level == "Hard":
            base_priority += 0.3
        
        # Module 5: Dependency Boost
        # If this topic is a prerequisite for many others (high out-degree), boost it!
        out_degree = self.G.out_degree(topic.id) if topic.id in self.G else 0
        dependency_boost = out_degree * 0.15
        
        # Module 4: Confidence Trend (Inverse)
        confidence_factor = (100 - topic.avg_quiz_score) / 100.0  # Lower score -> Higher priority
        
        # Module 6: Procrastination penalty? Nay, boost structure.
        return base_priority + dependency_boost + (confidence_factor * 0.4)

    def generate_timeline(self):
        self.adapt_difficulty()
        
        current_time = datetime.now()
        # If morning preference, align start
        if self.profile.preferences.preferred_time == "Morning":
            start_hour = 9 
        else:
            start_hour = 14 # Afternoon
            
        planning_date = current_time.date()
        
        # Topological Sort ensures prerequisites are scheduled first!
        try:
            ordered_topic_ids = list(nx.topological_sort(self.G))
        except nx.NetworkXUnfeasible:
            # Cycle detected, fallback to simple list
            ordered_topic_ids = [t.id for t in self.topics]

        # Filter out completeds? iterating all for reschedule
        
        generated_sessions = []
        
        # Determine "Risk Subjects" for Analytics
        risky = [t.name for t in self.topics if t.difficulty_level == "Hard" and t.avg_quiz_score < 30]
        self.analytics.risk_subjects = list(set(risky))[:3]

        # Simple Scheduler Loop
        for day_offset in range(7): # 7 Day Horizon
            day_cap_hours = self.profile.preferences.daily_study_hours
            if self.profile.behavior.missed_streak > 2:
                 # Module 6: AI Procrastination - "Suggest easier restart plan"
                 day_cap_hours *= 0.7 
            
            day = planning_date + timedelta(days=day_offset)
            day_sessions = []
            used_hours = 0
            
            # Select top priority tasks available
            # We must pick from ordered_topic_ids but respect that we can't do graph B before A
            # Simplified: just iterate order
            
            for tid in ordered_topic_ids:
                if used_hours >= day_cap_hours:
                    break
                    
                topic = self.tasks_map[tid]
                # If already scheduled in previous days, skip (basic check)
                if any(s.topic_id == tid for s in self.schedule):
                    continue
                if any(s.topic_id == tid for s in generated_sessions):
                    continue

                duration = 1.0 # Default hour
                if topic.difficulty_level == "Hard":
                    duration = 1.5
                
                # Module 2: Real Time Adaptation
                # Random "Emergency Practice" insertion for low scores
                type_label = "Deep Work"
                if topic.avg_quiz_score < 50 and random.random() < 0.3:
                     type_label = "🚑 Emergency Practice"
                     
                session = StudySession(
                    id=f"{day}-{tid}",
                    subject_name=topic.subject_id, # Simplified mapping
                    topic_id=tid,
                    topic_name=topic.name,
                    start_time=datetime.combine(day, datetime.strptime(f"{start_hour}:00", "%H:%M").time()) + timedelta(hours=used_hours),
                    end_time=datetime.combine(day, datetime.strptime(f"{start_hour}:00", "%H:%M").time()) + timedelta(hours=used_hours + duration),
                    duration_minutes=int(duration * 60),
                    session_type=type_label,
                    priority_score=self.calculate_priority(topic, day_offset),
                    reason=f"{topic.difficulty_level} • Prereq Count: {self.G.out_degree(tid)}",
                    status="Planned"
                )
                
                day_sessions.append(session)
                generated_sessions.append(session)
                used_hours += duration

            self.schedule.extend(day_sessions)
            
        return self.schedule[:20] # Return top 20 sessions

    def get_daily_mission(self) -> DailyMission:
        """Module 3: AI Daily Micro Study Plan Generator"""
        today = date.today()
        todays_tasks = [s for s in self.schedule if s.start_time.date() == today]
        
        # If empty (e.g. late at night), show tomorrow
        if not todays_tasks:
            today = today + timedelta(days=1)
            todays_tasks = [s for s in self.schedule if s.start_time.date() == today]
            
        theme = "🔥 Momentum Builder"
        if any(s.session_type == "Hard" for s in todays_tasks):
            theme = "🏔️ Deep Climb Day"
        elif len(todays_tasks) > 4:
            theme = "⚡ High Velocity Sprints"
            
        return DailyMission(
            date=today,
            focus_theme=theme,
            sessions=todays_tasks,
            energy_tip="Cognitive load is high. Take a 10m walk every 45m."
        )

    def get_serialized_graph(self):
        """For UI Visualization"""
        adj = {}
        for n in self.G.nodes():
            adj[n] = list(self.G.successors(n))
        return adj
