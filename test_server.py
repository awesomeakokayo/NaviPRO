import requests
import json

def test_server():
    base_url = "http://127.0.0.1:8000"
    
    print("Testing NaviPRO Backend Server...")
    print("=" * 50)
    
    # Test 1: Root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    # Test 2: Health check
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    
    # Test 3: Generate roadmap endpoint
    try:
        test_data = {
            "goal": "Product Designer",
            "target_role": "Product Designer",
            "timeframe": "3_months",
            "hours_per_week": "4_to_6_hours",
            "learning_style": "watching_videos",
            "learning_speed": "average",
            "skill_level": "beginner"
        }
        
        response = requests.post(
            f"{base_url}/api/generate_roadmap",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Generate roadmap: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   User ID: {data.get('user_id', 'N/A')}")
            print(f"   Success: {data.get('success', 'N/A')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Generate roadmap failed: {e}")
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    test_server() 