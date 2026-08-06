#!/bin/sh
set -eu

version="${KIMONO_VERSION:-dev}"
output_dir="${KIMONO_DIST_DIR:-dist}"

mkdir -p "$output_dir"

CGO_ENABLED=0 go build \
  -buildvcs=false \
  -trimpath \
  -ldflags="-s -w -X main.version=${version}" \
  -o "$output_dir/kimono" \
  ./cli/cmd/kimono

for target in linux/amd64 linux/arm64; do
  os=${target%/*}
  arch=${target#*/}
  name="kimono_${os}_${arch}"
  CGO_ENABLED=0 GOOS="$os" GOARCH="$arch" go build \
    -buildvcs=false \
    -trimpath \
    -ldflags="-s -w -X main.version=${version}" \
    -o "$output_dir/$name" \
    ./cli/cmd/kimono
done

(cd "$output_dir" && sha256sum kimono_linux_* > SHA256SUMS)
