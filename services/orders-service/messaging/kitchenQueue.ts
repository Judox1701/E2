import { getChannel } from './connection';
import { KITCHEN_BROKER_URL } from './brokers';
import Order from '../models/order.model';

const QUEUE = 'kitchen_queue';

// Point-to-point: kitchen-service owns this queue on its own broker, so we
// connect there to send. Exactly one consumer receives each message.
export async function postToKitchenQueue(order: Order): Promise<void> {
    const channel = await getChannel(KITCHEN_BROKER_URL);
    await channel.assertQueue(QUEUE, { durable: true });
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(order)), { persistent: true });
    console.log(`[queue] order ${order.id} sent to "${QUEUE}"`);
}
