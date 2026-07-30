#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cert_dir="${project_dir}/certs"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is required. Install it with: brew install mkcert" >&2
  exit 1
fi

mkdir -p "${cert_dir}"
TRUST_STORES=system mkcert -install
TRUST_STORES=system mkcert \
  -cert-file "${cert_dir}/localhost.pem" \
  -key-file "${cert_dir}/localhost-key.pem" \
  localhost 127.0.0.1 ::1

echo "Local HTTPS certificate created in ${cert_dir}"
