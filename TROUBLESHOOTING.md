# NaviPRO Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. 404 Not Found Error on `/api/generate_roadmap`

**Problem**: Getting `404 Not Found` when calling the roadmap generation endpoint.

**Solutions**:

#### A. Check Server Status
```bash
# Run the port checker
python check_port.py

# Or manually check if port 8000 is available
netstat -ano | findstr :8000
```

#### B. Verify Server is Running
1. Make sure you're in the correct directory
2. Start the server:
   ```bash
   cd backend
   python agent_orchestra.py
   ```
3. Look for these messages:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000
   INFO:     Application startup complete
   ```

#### C. Test Basic Endpoints
```bash
# Test root endpoint
curl http://127.0.0.1:8000/

# Test health endpoint
curl http://127.0.0.1:8000/api/health
```

#### D. Check for Port Conflicts
If port 8000 is busy:
1. Find what's using it:
   ```bash
   netstat -ano | findstr :8000
   ```
2. Kill the process:
   ```bash
   taskkill /PID <PID> /F
   ```
3. Or change the port in `agent_orchestra.py`:
   ```python
   uvicorn.run("agent_orchestra:app", host="127.0.0.1", port=8001, reload=True)
   ```

### 2. Server Won't Start

**Problem**: Backend server fails to start.

**Solutions**:

#### A. Check Python Installation
```bash
python --version
# or
python3 --version
```

#### B. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### C. Check Environment Variables
Create `.env` file in backend directory:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
YOUTUBE_API_KEY=your_youtube_api_key_here
```

#### D. Check for Syntax Errors
```bash
python -m py_compile agent_orchestra.py
```

### 3. API Calls Failing

**Problem**: Frontend can't connect to backend.

**Solutions**:

#### A. Check CORS Settings
The backend has CORS enabled, but verify:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### B. Check Network/Firewall
- Ensure no firewall blocking port 8000
- Check if antivirus is blocking connections
- Try different port if needed

#### C. Test with Simple Script
Use the test script:
```bash
python test_server.py
```

### 4. Roadmap Generation Failing

**Problem**: AI roadmap generation not working.

**Solutions**:

#### A. Check API Keys
```bash
# In backend directory
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('GROQ_KEY:', bool(os.getenv('GROQ_API_KEY')))"
```

#### B. Test API Connection
```bash
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-r1-distill-llama-70b","messages":[{"role":"user","content":"Hello"}]}'
```

#### C. Check Fallback Roadmap
If AI fails, fallback roadmap should generate. Check logs for:
```
Creating fallback roadmap
```

### 5. Frontend Issues

**Problem**: Roadmap not displaying correctly.

**Solutions**:

#### A. Check Browser Console
Open Developer Tools (F12) and look for JavaScript errors.

#### B. Verify localStorage
```javascript
// In browser console
console.log('Roadmap data:', localStorage.getItem('roadmapData'));
console.log('User ID:', localStorage.getItem('userId'));
```

#### C. Check File Paths
Ensure all files are in correct locations:
```
front-end/
├── onboarding/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── Career path/
│   ├── index.html
│   ├── script.js
│   └── style.css
```

## 🔧 Debug Mode

Enable debug logging by adding to your `.env` file:
```env
DEBUG=true
LOG_LEVEL=DEBUG
```

## 📋 Step-by-Step Debugging

### Step 1: Verify Environment
```bash
python check_port.py
```

### Step 2: Start Server
```bash
cd backend
python agent_orchestra.py
```

### Step 3: Test Basic Endpoints
```bash
python test_server.py
```

### Step 4: Test Frontend
1. Open `test_roadmap.html` in browser
2. Fill out form and submit
3. Check browser console for errors
4. Check backend console for logs

### Step 5: Test Full Flow
1. Complete onboarding form
2. Check if redirected to Career path
3. Verify roadmap displays correctly

## 🆘 Getting Help

### Check Logs
- Backend console output
- Browser console (F12)
- Network tab in Developer Tools

### Common Error Messages

#### "Module not found"
```bash
pip install -r requirements.txt
```

#### "Port already in use"
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

#### "GROQ_API_KEY not configured"
Create `.env` file with your API key.

#### "Connection refused"
Server not running. Start with:
```bash
cd backend
python agent_orchestra.py
```

## ✅ Success Checklist

- [ ] Backend server starts without errors
- [ ] Port 8000 is available
- [ ] Environment variables are set
- [ ] Dependencies are installed
- [ ] Root endpoint responds (`/`)
- [ ] Health endpoint responds (`/api/health`)
- [ ] Roadmap generation works (`/api/generate_roadmap`)
- [ ] Frontend can connect to backend
- [ ] Roadmap displays correctly
- [ ] Tasks can be marked complete

## 🚀 Quick Start Commands

```bash
# 1. Check environment
python check_port.py

# 2. Start backend
cd backend
python agent_orchestra.py

# 3. Test API (in new terminal)
python test_server.py

# 4. Open test page
start test_roadmap.html
```

If you're still having issues, please share:
1. The exact error message
2. Backend console output
3. Browser console output
4. Steps you followed 