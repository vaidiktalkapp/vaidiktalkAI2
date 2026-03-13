import subprocess
import json

payload = {
    "action": "all",
    "date": "1998-02-07",
    "time": "20:05",
    "lat": 28.6139,
    "lon": 77.2090,
    "tzone": 5.5
}

python_path = "python"
script_path = "src/ai-astrologers/scripts/astronomy_bridge.py"

result = subprocess.run([python_path, script_path, json.dumps(payload)], capture_output=True, text=True)
data = json.loads(result.stdout)

# Run sub-actions to see errors
for action in ["kundli", "dasha", "panchang"]:
    p = payload.copy()
    p["action"] = action
    res = subprocess.run([python_path, script_path, json.dumps(p)], capture_output=True, text=True)
    print(f"\n--- ACTION: {action} ---")
    print(res.stdout)
