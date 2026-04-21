import requests
import time

print("--- TESTING POST /api/report ---")
url = "http://127.0.0.1:8000/api/report"
image_path = r"C:\Users\ASUS\Documents\civicsense-ai\backend\residential-garbage-dumpster-overflowing.jpg"
files = {'image': open(image_path, 'rb')}
data = {'latitude': '34.0522', 'longitude': '-118.2437'} # Los Angeles coordinates

try:
    response = requests.post(url, files=files, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Failed to post: {e}")

time.sleep(1)

print("\n--- TESTING GET /api/reports ---")
url_get = "http://127.0.0.1:8000/api/reports"
try:
    response_get = requests.get(url_get)
    print(f"Status Code: {response_get.status_code}")
    print(f"Reports returned: len={len(response_get.json())}")
    if len(response_get.json()) > 0:
        latest = response_get.json()[0]
        print(f"Latest Report ID: {latest['id']}")
        print(f"Explanation: {latest['explanation']}")
        print(f"Severity: {latest['severity']}")
        print(f"Labels: {latest['labels']}")
except Exception as e:
    print(f"Failed to get: {e}")

time.sleep(1)

print("\n--- TESTING GET /api/reports ---")
url_get = "http://127.0.0.1:8000/api/reports"
try:
    response_get = requests.get(url_get)
    print(f"Status Code: {response_get.status_code}")
    print(f"Reports returned: len={len(response_get.json())}")
    if len(response_get.json()) > 0:
        latest = response_get.json()[0]
        print(f"Latest Report ID: {latest['id']}")
        print(f"Explanation: {latest['explanation']}")
        print(f"Severity: {latest['severity']}")
        print(f"Labels: {latest['labels']}")
except Exception as e:
    print(f"Failed to get: {e}")

# Cleanup
try:
    os.remove("real_test_image.jpg")
except:
    pass
