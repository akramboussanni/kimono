#!/bin/sh
set -eu

required="MESH_DOMAIN MAGIC_DNS_DOMAIN KIMONO_HEADSCALE_OIDC_ISSUER KIMONO_HEADSCALE_OIDC_CLIENT_ID HEADSCALE_NODE_EXPIRY"
for name in $required; do
  eval "value=\${$name:-}"
  if [ -z "$value" ]; then
    echo "Missing required setting: $name" >&2
    exit 1
  fi
  case "$value" in
    *"&"*|*"|"*|*"\\"*)
      echo "Unsupported character in $name" >&2
      exit 1
      ;;
  esac
done

case "$MESH_DOMAIN" in
  http://*|https://*)
    echo "MESH_DOMAIN must be a hostname without a URL scheme" >&2
    exit 1
    ;;
esac

sed \
  -e "s|__MESH_DOMAIN__|$MESH_DOMAIN|g" \
  -e "s|__MAGIC_DNS_DOMAIN__|$MAGIC_DNS_DOMAIN|g" \
  -e "s|__OIDC_ISSUER__|$KIMONO_HEADSCALE_OIDC_ISSUER|g" \
  -e "s|__OIDC_CLIENT_ID__|$KIMONO_HEADSCALE_OIDC_CLIENT_ID|g" \
  -e "s|__NODE_EXPIRY__|$HEADSCALE_NODE_EXPIRY|g" \
  /opt/kimono/config.yaml.tmpl > /output/config.yaml

cp /opt/kimono/policy.hujson /output/policy.hujson
chmod 0644 /output/config.yaml /output/policy.hujson
