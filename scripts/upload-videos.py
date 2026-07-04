#!/usr/bin/env python3
"""Upload Ecode videos to Cloudinary via REST API (signed upload)."""
import json
import os
import re
import requests
import hashlib
import time

# Read .env file directly
env_path = '/home/ixi_flower/ecode/.env'
env = {}
with open(env_path, 'r') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        match = re.match(r'(\w+)\s*=\s*"([^"]*)"', line)
        if match:
            env[match.group(1)] = match.group(2)
        else:
            match = re.match(r'(\w+)\s*=\s*([^\s#]+)', line)
            if match:
                env[match.group(1)] = match.group(2)

CLOUD = env.get('CLOUDINARY_CLOUD_NAME', '')
KEY = env.get('CLOUDINARY_API_KEY', '')
SEC = env.get('CLOUDINARY_API_SECRET', '')

print(f"Cloud name: {CLOUD}")
print(f"API key length: {len(KEY)}")
print(f"API secret length: {len(SEC)}")

def upload_video(filepath, pub_id):
    ts = int(time.time())
    params_to_sign = f'public_id={pub_id}&timestamp={ts}'
    sig = hashlib.sha1((params_to_sign + SEC).encode()).hexdigest()
    
    filesize = os.path.getsize(filepath)
    filename = os.path.basename(filepath)
    print(f"\n📤 Uploading {filename} ({filesize // 1048576} MB) as {pub_id} ...")
    
    url = f"https://api.cloudinary.com/v1_1/{CLOUD}/video/upload"
    
    with open(filepath, 'rb') as f:
        file_data = f.read()
    
    try:
        resp = requests.post(url, data={
            'public_id': pub_id,
            'api_key': KEY,
            'timestamp': ts,
            'signature': sig,
        }, files={'file': file_data}, timeout=600)
        
        result = resp.json()
        if resp.status_code == 200:
            secure_url = result.get('secure_url', '')
            print(f"  ✅ {pub_id} -> {secure_url}")
            return secure_url
        else:
            print(f"  ❌ Status {resp.status_code}: {resp.text[:500]}")
            return None
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None

videos = [
    ('/home/ixi_flower/Ecode.new.mp4', 'ecode/ecode_new'),
    ('/home/ixi_flower/Ecode1_3 (1).mp4', 'ecode/ecode1_3'),
    ('/home/ixi_flower/Ecode_adjusted_final.mp4', 'ecode/ecode_adjusted_final'),
]

results = {}
for filepath, pub_id in videos:
    url = upload_video(filepath, pub_id)
    results[pub_id] = url

print("\n\n=== UPLOAD RESULTS ===")
print(json.dumps(results, indent=2, ensure_ascii=False))
