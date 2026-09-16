import { getChannel } from './connection';
import { ORDERS_BROKER_URL } from './brokers';
import Order from '../models/order.model';
import { StockUnavailableError } from '../clients/inventory.client';

const EXCHANGE = 'orders';

// Broadcast: orders-service owns the exchange, on its own broker - connect
// there and declare our own exclusive queue bound to it. We only see orders
// published while this binding exists - nothing from before we subscribed,
// nothing after we disconnect.
export async function subscribeToOrders(onOrder: (order: Order) => Promise<void>): Promise<void> {
    const channel = await getChannel(ORDERS_BROKER_URL);
    await channel.assertExchange(EXCHANGE, 'fanout', { durable: false });
    const { queue } = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(queue, EXCHANGE, '');
    console.log(`[pubsub] subscribed to "${EXCHANGE}"`);

    channel.consume(queue, async (msg) => {
        if (!msg) return;
        try {
            await onOrder(JSON.parse(msg.content.toString()));
            channel.ack(msg);
        } catch (error) {
            if (error instanceof StockUnavailableError) {
                // Permanent failure (no such product, or not enough of it) -
                // requeuing would just spin forever redelivering the same
                // failure. Drop it, but ack so it's not silently invisible.
                console.error('[pubsub] order cannot be fulfilled, dropping', error);
                channel.ack(msg);
                return;
            }
            console.error('[pubsub] failed to persist order, requeueing', error);
            channel.nack(msg, false, true);
        }
    });
}
