#!/bin/sh
set -eu

repository="${KIMONO_REPOSITORY:-kimonoapps/kimono}"
download_base="${KIMONO_DOWNLOAD_BASE:-https://github.com/${repository}/releases/latest/download}"
install_path="${KIMONO_INSTALL_PATH:-/usr/local/bin/kimono}"

if [ "$(uname -s)" != "Linux" ]; then
  echo "Kimono currently supports Linux servers and nodes only." >&2
  exit 1
fi

case "$(uname -m)" in
  x86_64|amd64) architecture="amd64" ;;
  aarch64|arm64) architecture="arm64" ;;
  *)
    echo "Unsupported CPU architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this installer as root (for example: curl ... | sudo sh)." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to install Kimono." >&2
  exit 1
fi

temporary_directory=$(mktemp -d)
trap 'rm -rf "$temporary_directory"' EXIT HUP INT TERM

asset="kimono_linux_${architecture}"
curl -fL --retry 3 --proto '=https' --tlsv1.2 \
  "${download_base}/${asset}" \
  -o "${temporary_directory}/${asset}"
curl -fL --retry 3 --proto '=https' --tlsv1.2 \
  "${download_base}/SHA256SUMS" \
  -o "${temporary_directory}/SHA256SUMS"

expected=$(awk -v name="$asset" '$2 == name { print $1 }' "${temporary_directory}/SHA256SUMS")
if [ -z "$expected" ]; then
  echo "The release checksum does not contain ${asset}." >&2
  exit 1
fi
actual=$(sha256sum "${temporary_directory}/${asset}" | awk '{ print $1 }')
if [ "$actual" != "$expected" ]; then
  echo "Kimono download checksum verification failed." >&2
  exit 1
fi

install -m 0755 "${temporary_directory}/${asset}" "$install_path"
echo "Installed $($install_path version) at ${install_path}."

if [ "${1:-}" = "server" ]; then
  shift
  exec "$install_path" server install "$@"
fi

if [ "${1:-}" = "node" ]; then
  shift
  exec "$install_path" node install "$@"
fi

echo "Next: sudo kimono server install --domain example.com --email you@example.com"
