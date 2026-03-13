import subprocess
import json
import os

data = {
    "action": "all",
    "date": "07-02-1998",
    "time": "12:00",
    "lat": 28.6139,
    "lon": 77.2090,
    "tzone": 5.5
}

script_path = os.path.join(os.getcwd(), 'src/ai-astrologers/scripts/astronomy_bridge.py')
cmd = ["python", script_path, json.dumps(data)]

try:
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    stdout, stderr = process.communicate(timeout=30)
    print("STDOUT:")
    print(stdout)
    print("STDERR:")
    print(stderr)
except Exception as e:
    print(f"Error: {e}")
