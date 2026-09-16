import Order from '../models/order.model';
import DatabaseClient from '../database/client';
import { decreaseStock } from '../clients/inventory.client';

type Source = 'queue' | 'pubsub';

export default class KitchenService {
    private dbClient: DatabaseClient;

    constructor() {
        this.dbClient = DatabaseClient.getInstance();
    }

    public async receiveOrder(order: Order, source: Source): Promise<void> {
        console.log(`[${source}] kitchen received order ${order.id}`);

        // Throws StockUnavailableError (product missing or out of stock) if
        // the kitchen can't actually fulfil this order - a permanent
        // failure the queue/pubsub consumers ack and drop rather than
        // retry forever. Any other error (e.g. inventory-service
        // unreachable) is transient and gets requeued instead.
        await decreaseStock(order.productId, order.quantity);

        await this.dbClient.query(
            'INSERT INTO received_orders (order_id, product_id, quantity, price, source) VALUES ($1, $2, $3, $4, $5)',
            [order.id, order.productId, order.quantity, order.price, source]
        );
    }

    public async getReceivedOrders(): Promise<any[]> {
        const result = await this.dbClient.query('SELECT * FROM received_orders ORDER BY received_at DESC');
        return result.rows;
    }
}
