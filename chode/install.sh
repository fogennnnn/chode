#!/bin/sh
set -eu
command -v node >/dev/null 2>&1 || { echo 'Install Node.js 18+ with npm first.' >&2; exit 1; }
command -v git >/dev/null 2>&1 || { echo 'Install Git first.' >&2; exit 1; }
chode_installer_dir=$(mktemp -d)
trap 'rm -f "$chode_installer_dir/install.cjs"; rmdir "$chode_installer_dir"' EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
curl --fail --silent --show-error --location --header 'Cache-Control: no-cache' https://chode.borken.app/install.cjs --output "$chode_installer_dir/install.cjs"
node "$chode_installer_dir/install.cjs"
