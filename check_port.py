import socket
import subprocess
import sys
import os

def check_port(port):
    """Check if a port is available"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return result == 0
    except:
        sock.close()
        return False

def find_process_using_port(port):
    """Find what process is using a specific port (Windows)"""
    try:
        # Use netstat to find process using the port
        result = subprocess.run(
            ['netstat', '-ano'], 
            capture_output=True, 
            text=True, 
            shell=True
        )
        
        lines = result.stdout.split('\n')
        for line in lines:
            if f':{port}' in line and 'LISTENING' in line:
                parts = line.split()
                if len(parts) >= 5:
                    pid = parts[-1]
                    try:
                        # Get process name from PID
                        process_info = subprocess.run(
                            ['tasklist', '/FI', f'PID eq {pid}'], 
                            capture_output=True, 
                            text=True, 
                            shell=True
                        )
                        process_lines = process_info.stdout.split('\n')
                        if len(process_lines) >= 3:
                            process_name = process_lines[2].split()[0]
                            return f"PID {pid}: {process_name}"
                    except:
                        return f"PID {pid}: Unknown process"
        return "Unknown process"
    except:
        return "Could not determine"

def main():
    port = 8000
    print(f"Checking port {port}...")
    print("=" * 40)
    
    if check_port(port):
        print(f"❌ Port {port} is already in use!")
        process = find_process_using_port(port)
        print(f"   Process using port: {process}")
        print("\nTo fix this:")
        print("1. Stop the process using the port")
        print("2. Or change the port in agent_orchestra.py")
        print("3. Or kill the process with: taskkill /PID <PID> /F")
    else:
        print(f"✅ Port {port} is available!")
        print("\nYou can start the server with:")
        print("cd backend")
        print("python agent_orchestra.py")
    
    print("\n" + "=" * 40)
    
    # Check if Python is available
    try:
        result = subprocess.run(['python', '--version'], capture_output=True, text=True)
        print(f"✅ Python: {result.stdout.strip()}")
    except:
        try:
            result = subprocess.run(['python3', '--version'], capture_output=True, text=True)
            print(f"✅ Python3: {result.stdout.strip()}")
        except:
            print("❌ Python not found!")
    
    # Check if backend directory exists
    if os.path.exists('backend'):
        print("✅ Backend directory found")
        if os.path.exists('backend/agent_orchestra.py'):
            print("✅ agent_orchestra.py found")
        else:
            print("❌ agent_orchestra.py not found")
    else:
        print("❌ Backend directory not found")

if __name__ == "__main__":
    main() 