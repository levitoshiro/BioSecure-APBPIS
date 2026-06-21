from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import numpy as np
import json

# Import your encryption logic
from encryption import process_and_encrypt

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'temp_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ✅ ALLOW SVG FILES!
ALLOWED_EXTENSIONS = {'svg', 'png', 'jpg', 'jpeg'} 

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_simulated_biometric_key():
    """
    Since the uploaded file is the SVG, we extract the biometrics from the 
    Doctor/Patient Face and Iris. For the server pipeline, we use the fused 
    vector logic from your notebook to act as the master key.
    """
    np.random.seed(42) 
    face_vector = np.random.rand(1024).astype(np.float32) 
    iris_vector = np.random.rand(1024).astype(np.float32) 
    fused_vector = np.concatenate((face_vector, iris_vector))
    return fused_vector.tolist()

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({"status": "BioSecure ML Backend is Online"}), 200

@app.route('/api/extract-biometrics', methods=['POST'])
def process_scan():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    filename = secure_filename(file.filename)
    if filename == '':
        return jsonify({"error": "Invalid filename detected."}), 400

    if not allowed_file(filename):
        return jsonify({"error": "Invalid file type. Please upload your interactive SVG."}), 400

    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    try:
        # 1. Get the Biometric Master Key 
        print(f"\n[1/2] Generating Biometric Master Key for {file.filename}...")
        features = get_simulated_biometric_key()
        
        # 2. HYPERCHAOTIC ENCRYPTION (Works directly on SVG bytes!)
        print("[2/2] Applying 4D Hyperchaotic DNA Encryption to SVG bytes...")
        encrypted_filepath = process_and_encrypt(filepath, features)
        
        # 3. ZERO-TRUST CLEANUP
        os.remove(filepath) 
        print(f"✅ Success! SVG encrypted into visual PNG vault at: {encrypted_filepath}")
        
        return jsonify({
            "message": "Interactive SVG processed and encrypted successfully", 
            "features": features,
            "lesions": [], # We leave this empty because your SVG already handles the interactive UI!
            "encrypted_file_saved_at": encrypted_filepath
        }), 200
        
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        print(f"❌ Server Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

STATE_FILE = os.path.join(BASE_DIR, 'global_network_state.json')

@app.route('/api/state', methods=['GET'])
def get_state():
    """Any computer opening the app will fetch the global network state from here."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f)), 200
    return jsonify({"users": [], "records": []}), 200

@app.route('/api/state', methods=['POST'])
def save_state():
    """Whenever a patient uploads or admin adds a user, it syncs globally here."""
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON payload."}), 400

    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    return jsonify({"message": "Global state synced successfully"}), 200

if __name__ == '__main__':
    print("\n🚀 Starting BioSecure Zero-Trust Server on http://127.0.0.1:5000...")
    app.run(debug=True, host='0.0.0.0', port=5000)