# "address" is the orders-service container's fixed IP (see ipv4_address in
# orders-service/docker-compose.yaml). Envoy binds its public listener
# directly to this address, which fails on a hostname ("malformed IP
# address") - and other services' sidecars discover this same address to
# dial this service's proxy for mesh traffic.
service {
  name    = "orders-service"
  id      = "orders-service"
  address = "10.42.0.11"
  port    = 3030

  check {
    name     = "orders-service HTTP health"
    http     = "http://orders-service:3030/health"
    interval = "10s"
    timeout  = "2s"
  }

  # No upstreams: orders-service doesn't call another meshed service today.
  connect {
    sidecar_service {}
  }
}
