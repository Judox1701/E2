# "address" is the inventory-service container's fixed IP (see ipv4_address
# in inventory-service/docker-compose.yaml) - required for Envoy's public
# listener bind and for other sidecars to dial this service's proxy.
service {
  name    = "inventory-service"
  id      = "inventory-service"
  address = "10.42.0.13"
  port    = 3032

  check {
    name     = "inventory-service HTTP health"
    http     = "http://inventory-service:3032/health"
    interval = "10s"
    timeout  = "2s"
  }

  # No upstreams: inventory-service is only ever called, never the caller.
  connect {
    sidecar_service {}
  }
}
