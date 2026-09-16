import { Request, Response } from 'express';
import InventoryService from '../services/inventory.service';

export default class InventoryController {
    private inventoryService: InventoryService;

    constructor() {
        this.inventoryService = new InventoryService();
    }

    public async getProducts(req: Request, res: Response): Promise<void> {
        try {
            const products = await this.inventoryService.getProducts();
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching products', error });
        }
    }

    public async createProduct(req: Request, res: Response): Promise<void> {
        try {
            const { name, quantity } = req.body;
            const product = await this.inventoryService.createProduct(name, quantity);
            res.status(201).json(product);
        } catch (error) {
            res.status(500).json({ message: 'Error creating product', error });
        }
    }

    public async decreaseStock(req: Request, res: Response): Promise<void> {
        try {
            const { productId, quantity } = req.body;
            const product = await this.inventoryService.decreaseStock(productId, quantity);
            res.status(200).json(product);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error decreasing stock';
            const status = message.includes('does not exist') ? 404 : 409;
            res.status(status).json({ message });
        }
    }
}
