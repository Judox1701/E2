#!/bin/sh
set -eu

ADMIN_URL="http://host.docker.internal:9180/apisix/admin"
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
    curl -sS --fail-with-body -X PUT "$ADMIN_URL/routes/$id" \
        -H "X-API-KEY: $ADMIN_KEY" \
        -H "Content-Type: application/json" \
        -d "$body"
}

put_consumer() {
    username="$1"
    echo "Registering consumer: $username"
    jq -nc --arg username "$username" '{username: $username}' | curl -sS --fail-with-body -X PUT "$ADMIN_URL/consumers" \
        -H "X-API-KEY: $ADMIN_KEY" \
        -H "Content-Type: application/json" \
        --data-binary @-
}

put_credential() {
    consumer_name="$1"
    credential_id="$2"
    consumer_key="$3"

    jq -n \
        --arg key "$consumer_key" \
        --arg algorithm "RS256" \
        --rawfile public_key /jwt_key/jwt-rsa256-public.pem \
        '{
            plugins: {
                "jwt-auth": {
                    key: $key,
                    algorithm: $algorithm,
                    public_key: $public_key
                }
          }
      }' | curl -sS --fail-with-body -X PUT "$ADMIN_URL/consumers/$consumer_name/credentials/$credential_id" \
        -H "X-API-KEY: $ADMIN_KEY" \
        -H "Content-Type: application/json" \
        --data-binary @-
}

# Each app's health check lives unprefixed at "/health" (see routes.ts in
# each service), so it has to be rewritten - everything else forwards as-is,
# since the apps already expect their own prefix on the wire.

put_consumer demo-client
put_credential demo-client demo-client-jwt credential-demo-client

put_route orders-service-health '{
  "uri": "/orders/health",
  "priority": 10,
  "plugins": { "proxy-rewrite": { "uri": "/health" } },
  "upstream": { "type": "roundrobin", "nodes": { "orders-service:3030": 1 } }
}'

put_route orders-service '{
  "uris": ["/orders", "/orders/*"],
  "plugins": { "jwt-auth": { "header": "Authorization", "query": "jwt", "cookie": "jwt", "hide_credentials": true } },
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
  "plugins": { "jwt-auth": { "header": "Authorization", "query": "jwt", "cookie": "jwt", "hide_credentials": true } },
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
  "plugins": { "jwt-auth": { "header": "Authorization", "query": "jwt", "cookie": "jwt", "hide_credentials": true } },
  "upstream": { "type": "roundrobin", "nodes": { "inventory-service:3032": 1 } }
}'

put_route users-service-health '{
  "uri": "/users/health",
  "priority": 10,
  "plugins": { "proxy-rewrite": { "uri": "/health" } },
  "upstream": { "type": "roundrobin", "nodes": { "users-service:3033": 1 } }
}'

put_route users-service-create '{
  "uri": "/users",
  "methods": ["POST"],
  "upstream": { "type": "roundrobin", "nodes": { "users-service:3033": 1 } }
}'

put_route users-service '{
  "uris": ["/users", "/users/*"],
  "methods": ["GET", "DELETE"],
  "plugins": { "jwt-auth": { "header": "Authorization", "query": "jwt", "cookie": "jwt", "hide_credentials": true } },
  "upstream": { "type": "roundrobin", "nodes": { "users-service:3033": 1 } }
}'

echo "Routes registered."
