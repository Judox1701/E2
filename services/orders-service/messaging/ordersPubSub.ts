import { getChannel } from './connection';
import { ORDERS_BROKER_URL } from './brokers';
import Order from '../models/order.model';

const EXCHANGE = 'orders';

// Broadcast: this service owns the exchange, on its own broker. Every queue
// currently bound to it gets its own copy; nothing is kept for latecomers.
export async function publishOrderCreated(order: Order): Promise<void> {
    const channel = await getChannel(ORDERS_BROKER_URL);
    await channel.assertExchange(EXCHANGE, 'fanout', { durable: false });
    channel.publish(EXCHANGE, '', Buffer.from(JSON.stringify(order)));
    console.log(`[pubsub] order ${order.id} published to "${EXCHANGE}"`);
}
