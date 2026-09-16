import Product from '../models/product.model';
import DatabaseClient from '../database/client';

export default class InventoryService {
    private dbClient: DatabaseClient;

    constructor() {
        this.dbClient = DatabaseClient.getInstance();
    }

    public async getProducts(): Promise<Product[]> {
        const result = await this.dbClient.query('SELECT * FROM products ORDER BY name');
        return result.rows;
    }

    public async createProduct(name: string, quantity: number): Promise<Product> {
        const result = await this.dbClient.query(
            'INSERT INTO products (name, quantity) VALUES ($1, $2) RETURNING *',
            [name, quantity]
        );
        return result.rows[0];
    }

    // Atomic decrement guarded by the current quantity - avoids a
    // check-then-write race between concurrent orders for the same product.
    // If it affects no row, a second lookup tells us whether that's because
    // the product doesn't exist at all or because there isn't enough stock.
    public async decreaseStock(productId: number, quantity: number): Promise<Product> {
        const decremented = await this.dbClient.query(
            'UPDATE products SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1 RETURNING *',
            [quantity, productId]
        );

        if (decremented.rows.length > 0) {
            return decremented.rows[0];
        }

        const existing = await this.dbClient.query('SELECT * FROM products WHERE id = $1', [productId]);
        if (existing.rows.length === 0) {
            throw new Error(`Product ${productId} does not exist`);
        }

        throw new Error(`Insufficient stock for product ${productId}`);
    }
}
