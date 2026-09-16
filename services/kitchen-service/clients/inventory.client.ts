// inventory-service's own HTTP API. In-container, docker-compose.yaml points
// this at 127.0.0.1:20032 - this service's Envoy sidecar, which proxies the
// call through the Consul Connect mesh (mTLS + intentions) to
// inventory-service's sidecar rather than dialing it directly.
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3032';

// Thrown for the 404/409 cases below - a permanent failure (no such
// product, or not enough of it) that retrying can never fix. Callers should
// treat this differently from a network/5xx error, which might.
export class StockUnavailableError extends Error {}

// Throws StockUnavailableError if the product doesn't exist or there isn't
// enough stock - callers should let this fail the order rather than swallow
// it. Any other failure (network, 5xx) throws a plain Error instead.
export async function decreaseStock(productId: number, quantity: number): Promise<void> {
    const response = await fetch(`${INVENTORY_SERVICE_URL}/inventory/decrease`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
    });

    if (response.ok) {
        return;
    }

    const body = await response.json().catch(() => ({}));
    const message = body.message || `Failed to decrease stock for product ${productId}`;

    if (response.status === 404 || response.status === 409) {
        throw new StockUnavailableError(message);
    }

    throw new Error(message);
}
