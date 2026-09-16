#!/bin/sh
set -eu

ADMIN_URL="http://apisix:9180/apisix/admin"
# Matches the "admin" key in apisix_conf/config.yaml.
ADMIN_KEY="edd1c9f034335f136f87ad84b625c8f1"

echo "Waiting for APISIX admin API..."
until curl -sf -o /dev/null -H "X-API-KEY: $ADMIN_KEY" "$ADMIN_URL/routes"; do
    sleep 2
done

put_route() {
    id="$1"
    body="$2"
    echo "Registering route: $id"
    curl -sf -X PUT "$ADMIN_URL/routes/$id" \
        -H "X-API-KEY: $ADMIN_KEY" \
        -H "Content-Type: application/json" \
        -d "$body" \
        -o /dev/null
}

# Each app's health check lives unprefixed at "/health" (see routes.ts in
# each service), so it has to be rewritten - everything else forwards as-is,
# since the apps already expect their own prefix on the wire.

put_route orders-service-health '{
  "uri": "/orders/health",
  "priority": 10,
  "plugins": { "proxy-rewrite": { "uri": "/health" } },
  "upstream": { "type": "roundrobin", "nodes": { "orders-service:3030": 1 } }
}'

put_route orders-service '{
  "uris": ["/orders", "/orders/*"],
  "upstream": { "type": "roundrobin", "nodes": { "orders-service:3030": 1 } }
}'

put_route kitchen-service-health '{
  "uri": "/kitchen/health",
  "priority": 10,
  "plugins": { "proxy-rewrite": { "uri": "/health" } },
  "upstream": { "type": "roundrobin", "nodes": { "kitchen-service:3031": 1 } }
}'

put_route kitchen-service '{
  "uris": ["/kitchen", "/kitchen/*"],
  "upstream": { "type": "roundrobin", "nodes": { "kitchen-service:3031": 1 } }
}'

put_route inventory-service-health '{
  "uri": "/inventory/health",
  "priority": 10,
  "plugins": { "proxy-rewrite": { "uri": "/health" } },
  "upstream": { "type": "roundrobin", "nodes": { "inventory-service:3032": 1 } }
}'

put_route inventory-service '{
  "uris": ["/inventory", "/inventory/*"],
  "upstream": { "type": "roundrobin", "nodes": { "inventory-service:3032": 1 } }
}'

echo "Routes registered."
