# "address" is the users-service container's fixed IP (see ipv4_address
# in users-service/docker-compose.yaml) - required for Envoy's public
# listener bind and for other sidecars to dial this service's proxy.
service {
  name    = "users-service"
  id      = "users-service"
  address = "10.42.0.14"
  port    = 3033

  check {
    name     = "users-service HTTP health"
    http     = "http://users-service:3033/health"
    interval = "10s"
    timeout  = "2s"
  }

  # No upstreams: users-service is only ever called, never the caller.
  connect {
    sidecar_service {}
  }
}
