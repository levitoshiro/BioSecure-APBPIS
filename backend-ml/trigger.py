import requests

# This script pretends to be the React frontend and sends a dummy file to your server
url = 'http://127.0.0.1:5000/api/extract-biometrics'
files = {'file': ('patient_scan_01.svg', '<svg></svg>', 'image/svg+xml')}

print("Sending dummy scan to server...")
response = requests.post(url, files=files)
print("Response:", response.text)