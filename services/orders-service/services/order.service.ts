import Order from '../models/order.model';
import DatabaseClient from '../database/client';
import { postToKitchenQueue } from '../messaging/kitchenQueue';
import { publishOrderCreated } from '../messaging/ordersPubSub';

export default class OrderService {

    private dbClient: DatabaseClient;

    constructor() {
        this.dbClient = DatabaseClient.getInstance();
    }

    public async getOrders(): Promise<Order[]> {
        const orders: Order[] = await this.dbClient.query('SELECT * FROM orders');
        return orders;
    }

    public async createOrder(orderData: { productId: number; quantity: number; price: number }): Promise<Order> {
        const { productId, quantity, price } = orderData;
        const newOrder = await this.dbClient.query(
            // id is omitted - the orders table generates it (SERIAL).
            'INSERT INTO orders (product_id, quantity, price) VALUES ($1, $2, $3) RETURNING *',
            [productId, quantity, price]
        );

        const row = newOrder.rows[0];
        // pg returns raw column names (product_id) - go through the Order
        // model so what's serialized onto the wire matches what
        // kitchen-service expects to deserialize (productId).
        const createdOrder = new Order(row.id, row.product_id, row.quantity, row.price);
        // Two ways to tell the kitchen about a new order — pick one in class.
        // Fire-and-forget: the broker connections retry forever in the
        // background if unreachable, so the HTTP response must not wait on
        // them - otherwise a down/unreachable broker hangs every request.
        postToKitchenQueue(createdOrder).catch((error) => console.error('[queue] failed to send order', error));
        publishOrderCreated(createdOrder).catch((error) => console.error('[pubsub] failed to publish order', error));

        return newOrder;
    }
}