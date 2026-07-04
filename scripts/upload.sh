#!/usr/bin/env bash
set -e

# Source the env file
export $(grep -v '^#' /home/ixi_flower/ecode/.env | xargs)

UPLOAD_VIDEO() {
  local FILE="$1"
  local PUBLIC_ID="$2"
  local FILE_SIZE=$(stat -c%s "$FILE")
  echo "Uploading $(basename $FILE) ($(( FILE_SIZE / 1048576 ))MB) as $PUBLIC_ID ..."

  # Use cloudinary upload API via curl
  local RESPONSE=$(curl -s -X POST "https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload" \
    -F "file=@${FILE}" \
    -F "public_id=${PUBLIC_ID}" \
    -F "upload_preset=" \
    -F "api_key=${CLOUDINARY_API_KEY}" \
    --max-time 300)

  local URL=$(echo "$RESPONSE" | grep -o '"secure_url":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$URL" ]; then
    echo "  ✅ $PUBLIC_ID → $URL"
  else
    echo "  ❌ $PUBLIC_ID failed: $(echo "$RESPONSE" | head -c 200)"
  fi
}

CLOUD_NAME=$(grep CLOUDINARY_CLOUD_NAME /home/ixi_flower/ecode/.env | cut -d'=' -f2 | tr -d '"')
echo "Using Cloudinary cloud: $CLOUD_NAME"

UPLOAD_VIDEO "/home/ixi_flower/Ecode.new.mp4" "ecode/ecode_new"
UPLOAD_VIDEO "/home/ixi_flower/Ecode1_3 (1).mp4" "ecode/ecode1_3"
UPLOAD_VIDEO "/home/ixi_flower/Ecode_adjusted_final.mp4" "ecode/ecode_adjusted_final"

echo ""
echo "All uploads complete!"
