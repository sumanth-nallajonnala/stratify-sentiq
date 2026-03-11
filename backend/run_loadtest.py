import subprocess
import json
import time
import os


# Test configurations
tests = [
    {"users": 10,  "spawn_rate": 2,  "duration": "30s", "label": "Low Load    (10 users)"},
    {"users": 50,  "spawn_rate": 5,  "duration": "30s", "label": "Medium Load (50 users)"},
    {"users": 100, "spawn_rate": 10, "duration": "30s", "label": "High Load   (100 users)"},
]

results = []

for test in tests:
    print(f"\n▶ Running: {test['label']}...")

    cmd = [
        "locust",
        "-f", "locustfile.py",
        "--headless",
        "--host", "http://127.0.0.1:8000",
        "--users", str(test["users"]),
        "--spawn-rate", str(test["spawn_rate"]),
        "--run-time", test["duration"],
        "--csv", f"loadtest_{test['users']}users",
        "--only-summary",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, cwd=os.path.dirname(__file__))
    output = result.stdout + result.stderr

    # Parse key metrics from output
    lines = output.split('\n')
    for line in lines:
        if 'Aggregated' in line or 'requests' in line.lower():
            print(f"  {line.strip()}")

    results.append({
        "test": test["label"],
        "output": output
    })
    time.sleep(3)

print("\n" + "=" * 55)
print("  LOAD TEST COMPLETE")
