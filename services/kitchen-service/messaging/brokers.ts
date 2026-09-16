// orders-service's broker (its own docker-compose.yaml) - hosts the "orders" pubsub exchange.
// In-container, docker-compose.yaml sets this to the "orders-rabbitmq" service
// name (both services share the "service-mesh" network via the root include).
// Credentials match RABBITMQ_DEFAULT_USER/PASS in orders-service/docker-compose.yaml.
export const ORDERS_BROKER_URL = process.env.ORDERS_BROKER_URL || 'amqp://admin:securepassword123@localhost:5673';

// This service's own broker (docker-compose.yaml here) - hosts "kitchen_queue".
// In-container, docker-compose.yaml sets this to the "kitchen-rabbitmq" service name.
export const KITCHEN_BROKER_URL = process.env.KITCHEN_BROKER_URL || 'amqp://admin:securepassword123@localhost:5672';
