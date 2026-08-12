#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

npm run build >/dev/null
exec node --experimental-loader "${SITES_PROJECT_ROOT}/tests/cloudflare-workers-loader.mjs" --test \
  "${SITES_PROJECT_ROOT}/tests/auth-contract.test.mjs" \
  "${SITES_PROJECT_ROOT}/tests/password-hashing.test.mjs" \
  "${SITES_PROJECT_ROOT}/tests/rendered-html.test.mjs"
