# NaviPRO Roadmap Integration

This document explains how the roadmap generator has been integrated with your Career roadmap UI.

## Overview

The system now connects your onboarding form to the backend AI-powered roadmap generator, which creates personalized learning roadmaps that are dynamically rendered in your Career roadmap UI.

## How It Works

### 1. Onboarding Flow
- Users complete the 7-step onboarding form
- Form data is collected and sent to the backend API
- Backend generates a personalized roadmap using AI
- User is redirected to the Career roadmap page

### 2. Backend Integration
- **API Endpoint**: `POST /api/generate_roadmap`
- **AI Model**: Uses Groq API (deepseek-r1-distill-llama-70b)
- **Fallback**: If AI generation fails, creates a basic roadmap structure

### 3. Frontend Rendering
- Career roadmap page dynamically loads roadmap data from localStorage
- Roadmap is rendered using the existing UI template
- Users can mark tasks as complete by clicking on them
- Progress is tracked and updated in real-time

## File Structure

```
backend/
├── agent_orchestra.py          # Main backend API with roadmap generation
├── requirements.txt            # Python dependencies

front-end/
├── onboarding/
│   ├── index.html             # 7-step onboarding form
│   ├── script.js              # Form handling and API calls
│   └── style.css              # Onboarding styles
├── Career path/
│   ├── index.html             # Roadmap display page
│   ├── script.js              # Dynamic roadmap rendering
│   └── style.css              # Roadmap styles
```

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the backend directory:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 3. Start Backend Server
```bash
cd backend
python agent_orchestra.py
```
Server will run on `http://127.0.0.1:8000`

### 4. Test the Integration
Open `test_roadmap.html` in your browser to test the API connection.

## API Endpoints

### Generate Roadmap
- **POST** `/api/generate_roadmap`
- **Body**: 
```json
{
    "goal": "Product Designer",
    "target_role": "Product Designer", 
    "timeframe": "3_months",
    "hours_per_week": "4_to_6_hours",
    "learning_style": "watching_videos",
    "learning_speed": "average",
    "skill_level": "beginner"
}
```

### Get Daily Task
- **GET** `/api/daily_task/{user_id}`

### Complete Task
- **POST** `/api/complete_task/{user_id}`

### Get User Progress
- **GET** `/api/user_progress/{user_id}`

### Get Week Videos
- **GET** `/api/week_videos/{user_id}`

### Chat with AI
- **POST** `/api/chat/{user_id}`

## Roadmap JSON Structure

The backend generates roadmaps in this format:

```json
{
    "goal": "Product Designer",
    "target_role": "Product Designer",
    "timeframe": "3 months",
    "learning_speed": "average",
    "skill_level": "beginner",
    "roadmap": [
        {
            "month": 1,
            "month_title": "Foundation & Skills Building",
            "weeks": [
                {
                    "week": 1,
                    "week_number": 1,
                    "focus": "Design Fundamentals",
                    "daily_tasks": [
                        {
                            "day": 1,
                            "title": "Complete design course",
                            "description": "Start with basic design principles"
                        }
                        // ... 5 more tasks
                    ]
                }
                // ... 3 more weeks
            ]
        }
        // ... more months
    ]
}
```

## Features

### ✅ Completed
- Onboarding form data collection
- Backend API integration
- AI-powered roadmap generation
- Dynamic roadmap rendering
- Task completion tracking
- Progress visualization
- Fallback roadmap generation

### 🔄 In Progress
- YouTube video recommendations
- AI chat assistant
- Advanced progress analytics

### 📋 Planned
- User authentication
- Data persistence
- Mobile optimization
- Export functionality

## Troubleshooting

### Common Issues

1. **Backend not starting**
   - Check Python dependencies: `pip install -r requirements.txt`
   - Verify environment variables are set

2. **API calls failing**
   - Ensure backend is running on port 8000
   - Check CORS settings
   - Verify API endpoint URLs

3. **Roadmap not rendering**
   - Check browser console for JavaScript errors
   - Verify localStorage has roadmap data
   - Check that script.js is properly loaded

4. **AI generation failing**
   - Verify GROQ_API_KEY is set
   - Check internet connection
   - Fallback roadmap will be generated automatically

### Debug Mode

Enable debug logging by setting environment variable:
```env
DEBUG=true
```

## Testing

1. **Test Backend**: Use `test_roadmap.html`
2. **Test Full Flow**: Complete onboarding → Generate roadmap → View Career path
3. **Test Task Completion**: Click on tasks to mark them complete
4. **Test Progress**: Verify progress bar and percentage updates

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend server is running
3. Check API endpoint responses
4. Review this documentation

## Next Steps

1. **Deploy Backend**: Move to production server
2. **Add Authentication**: Implement user login system
3. **Database Integration**: Replace in-memory storage
4. **Mobile App**: Create React Native or Flutter app
5. **Analytics**: Add learning analytics and insights 