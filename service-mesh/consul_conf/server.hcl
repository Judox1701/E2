datacenter  = "esii-estudo"
data_dir    = "/consul/data"
client_addr = "0.0.0.0"
bind_addr   = "0.0.0.0"

server           = true
bootstrap_expect = 1

ui_config {
  enabled = true
}

# xDS (Envoy config) is served over gRPC on this port.
ports {
  grpc = 8502
}

# Enables Connect: builds in a CA, issues mTLS leaf certs to sidecars, and
# turns on intentions-based authorization between meshed services.
connect {
  enabled = true
}

# Loaded once at first boot (bootstrap = non-destructive: it only creates
# entries that don't already exist, so it's safe across restarts).
#
# Zero-trust default: nothing may call anything unless explicitly allowed.
# Today the only real traffic is kitchen-service -> inventory-service
# (HTTP, decreaseStock). orders-service is meshed too (registered below)
# but has no upstream yet - add an intention here if/when it needs one.
config_entries {
  bootstrap = [
    {
      kind = "service-intentions"
      name = "*"
      sources = [
        {
          name   = "*"
          action = "deny"
        }
      ]
    },
    {
      kind = "service-intentions"
      name = "inventory-service"
      sources = [
        {
          name   = "kitchen-service"
          action = "allow"
        }
      ]
    }
  ]
}
