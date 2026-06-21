import os
import math
import cv2
import numpy as np
import hashlib
import hmac

# ==========================================
# CONFIGURATION
# ==========================================
SYSTEM_KEY = "Hospital_Private_Master_Key_2026"
ENCRYPTED_VAULT_DIR = "encrypted_vault"
os.makedirs(ENCRYPTED_VAULT_DIR, exist_ok=True)

# ==========================================
# 4D HYPERCHAOTIC ENGINE
# ==========================================
def generate_initial_conditions(biometric_vector, system_key):
    """Safely hashes the 1024-D vector to create chaos seeds (x0, y0, z0, w0)"""
    # Convert list to numpy array for byte hashing
    vector_np = np.array(biometric_vector, dtype=np.float32)
    msg = vector_np.tobytes()
    key = system_key.encode('utf-8')
    h = hmac.new(key, msg, hashlib.sha512).digest()
    
    ints = np.frombuffer(h[:32], dtype=np.uint64)
    max_uint64 = 18446744073709551615.0 
    
    x0 = (ints[0] / max_uint64) * 2.0 - 1.0
    y0 = (ints[1] / max_uint64) * 2.0 - 1.0
    z0 = (ints[2] / max_uint64) * 2.0 - 1.0
    w0 = (ints[3] / max_uint64) * 2.0 - 1.0
    return x0, y0, z0, w0

def run_4d_hyperchaos(x0, y0, z0, w0, data_length):
    """Generates the keystream using your exact notebook mathematics"""
    a, b, c, k = 35.0, 3.0, 35.0, 5.0 
    dt = 0.001
    total_iters = 2048 + data_length 
    
    x, y, z, w = x0, y0, z0, w0
    sequence_x = np.zeros(data_length)
    sequence_key = np.zeros(data_length, dtype=np.uint8)
    
    for i in range(total_iters):
        dx = a * (y - x) + w
        dy = c * x - x * z + y
        dz = x * y - b * z
        dw = -k * w + y * z
        
        x += dx * dt; y += dy * dt; z += dz * dt; w += dw * dt
        
        if i >= 2048:
            idx = i - 2048
            sequence_x[idx] = x
            sequence_key[idx] = int(abs(y) * 10**5) % 256 
            
    return sequence_x, sequence_key

def encrypt_bytes(raw_bytes, seq_x, seq_key):
    """Phase 1: Confusion (Scramble) -> Phase 2: Diffusion (DNA XOR)"""
    # Scramble
    scramble_index = np.argsort(seq_x)
    confused_bytes = raw_bytes[scramble_index]
    
    # XOR Diffusion
    encrypted_bytes = np.zeros_like(confused_bytes, dtype=np.uint8)
    encrypted_bytes[0] = confused_bytes[0] ^ seq_key[0]
    
    for i in range(1, len(confused_bytes)):
        encrypted_bytes[i] = confused_bytes[i] ^ seq_key[i] ^ encrypted_bytes[i-1]
        
    return encrypted_bytes

# ==========================================
# MAIN ENCRYPTION PIPELINE
# ==========================================
def process_and_encrypt(file_path, biometric_vector):
    """Encrypts raw bytes (like an SVG) and saves them as a Square PNG Vault"""
    # 1. Read SVG as raw bytes
    with open(file_path, "rb") as f:
        file_bytes = np.frombuffer(f.read(), dtype=np.uint8)
    
    file_size = len(file_bytes)
    base_filename = os.path.basename(file_path).split('.')[0]
    
    # 2. Run Mathematics
    x0, y0, z0, w0 = generate_initial_conditions(np.array(biometric_vector, dtype=np.float32), SYSTEM_KEY)
    seq_x, seq_key = run_4d_hyperchaos(x0, y0, z0, w0, file_size)
    
    # 3. Encrypt
    encrypted_bytes = encrypt_bytes(file_bytes, seq_x, seq_key)
    
    # 4. Format into a Square Visual Image (The PNG Vault)
    import math
    side_length = math.ceil(math.sqrt(file_size))
    padding_size = (side_length * side_length) - file_size
    padded_bytes = np.pad(encrypted_bytes, (0, padding_size), mode='constant')
    encrypted_image_matrix = padded_bytes.reshape((side_length, side_length))
    
    # 5. Save the final visual cipher-image
    output_filename = f"{base_filename}_secure_size{file_size}.png"
    output_path = os.path.join(ENCRYPTED_VAULT_DIR, output_filename)
    cv2.imwrite(output_path, encrypted_image_matrix)
    
    return output_path