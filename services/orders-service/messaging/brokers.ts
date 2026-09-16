// This service's own broker (docker-compose.yaml here) - hosts the "orders" pubsub exchange.
// In-container, docker-compose.yaml sets this to the "orders-rabbitmq" service name.
// Credentials match RABBITMQ_DEFAULT_USER/PASS in docker-compose.yaml.
export const ORDERS_BROKER_URL = process.env.ORDERS_BROKER_URL || 'amqp://admin:securepassword123@localhost:5673';

// kitchen-service's broker (its own docker-compose.yaml) - hosts "kitchen_queue".
// In-container, docker-compose.yaml sets this to the "kitchen-rabbitmq" service
// name (both services share the "service-mesh" network via the root include).
export const KITCHEN_BROKER_URL = process.env.KITCHEN_BROKER_URL || 'amqp://admin:securepassword123@localhost:5672';
