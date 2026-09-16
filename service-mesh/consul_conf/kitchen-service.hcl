# "address" is the kitchen-service container's fixed IP (see ipv4_address in
# kitchen-service/docker-compose.yaml) - required for Envoy's public listener
# bind and for other sidecars to dial this service's proxy.
service {
  name    = "kitchen-service"
  id      = "kitchen-service"
  address = "10.42.0.12"
  port    = 3031

  check {
    name     = "kitchen-service HTTP health"
    http     = "http://kitchen-service:3031/health"
    interval = "10s"
    timeout  = "2s"
  }

  connect {
    sidecar_service {
      proxy {
        # kitchen-service's app code calls http://127.0.0.1:20032 (see
        # kitchen-service/clients/inventory.client.ts). This sidecar listens
        # there and forwards mTLS-encrypted to inventory-service's sidecar,
        # authorized by the intention in server.hcl.
        upstreams = [
          {
            destination_name   = "inventory-service"
            local_bind_address = "127.0.0.1"
            local_bind_port    = 20032
          }
        ]
      }
    }
  }
}
