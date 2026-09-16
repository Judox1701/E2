import { getChannel } from './connection';
import { KITCHEN_BROKER_URL } from './brokers';
import Order from '../models/order.model';
import { StockUnavailableError } from '../clients/inventory.client';

const QUEUE = 'kitchen_queue';

// Point-to-point: this service owns the queue, on its own broker, and is
// the one consumer draining it. Messages sent while we were offline are
// still here waiting.
export async function listenToKitchenQueue(onOrder: (order: Order) => Promise<void>): Promise<void> {
    const channel = await getChannel(KITCHEN_BROKER_URL);
    await channel.assertQueue(QUEUE, { durable: true });
    console.log(`[queue] listening on "${QUEUE}"`);

    channel.consume(QUEUE, async (msg) => {
        if (!msg) return;
        try {
            await onOrder(JSON.parse(msg.content.toString()));
            channel.ack(msg);
        } catch (error) {
            if (error instanceof StockUnavailableError) {
                // Permanent failure (no such product, or not enough of it) -
                // requeuing would just spin forever redelivering the same
                // failure. Drop it, but ack so it's not silently invisible.
                console.error('[queue] order cannot be fulfilled, dropping', error);
                channel.ack(msg);
                return;
            }
            console.error('[queue] failed to persist order, requeueing', error);
            channel.nack(msg, false, true);
        }
    });
}
