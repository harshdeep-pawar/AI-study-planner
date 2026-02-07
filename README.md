# AI Study Planner for Engineers 🎓

This is an intelligent, full-stack study planning application designed to help engineering students balance their cognitive load and ace their exams.

## Features
- **Smart Scheduling**: Allocates time based on subject difficulty, credits, and your confidence level.
- **Cognitive Load Balancing**: Schedules heavy concepts when you are fresh.
- **Adaptive Insights**: Explains WHY specific topics are prioritized.
- **Visual Dashboard**: Daily schedule and progress tracking.

## Prerequisites
- Python 3.8+

## Quick Start (Windows)

1. **Double click** the `run_app.bat` file.
   - This will install dependencies and start the server.
2. Open your browser to **http://localhost:8000/static/index.html**

## Manual Start
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the server:
   ```bash
   python -m uvicorn src.main:app --reload
   ```
3. Visit http://localhost:8000/static/index.html

## Tech Stack
- **Frontend**: HTML5, Tailwind CSS, Vanilla JS
- **Backend**: Python (FastAPI)
- **AI/Logic**: Custom Weighted Priority Algorithm (in `src/scheduler.py`)
