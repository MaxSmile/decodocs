#!/usr/bin/env bash
set -euo pipefail

# Rotate MinIO app secret without persisting plaintext in repo files.
# Usage:
#   ./rotate-minio-app-key.sh

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required" >&2
  exit 1
fi

NEW_SECRET="$(openssl rand -base64 48 | tr -d '\n' | tr '+/' 'AZ' | cut -c1-48)"

echo "Rotating MinIO app secret via setup-minio-app-user.yml ..."
ansible-playbook setup-minio-app-user.yml --extra-vars "minio_app_secret_key=${NEW_SECRET}"

echo
echo "Rotation complete."
echo "Update your secure secret store with the new minio_app_secret_key value."
