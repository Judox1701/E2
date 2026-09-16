import { Request, Response } from 'express';
import KitchenService from '../services/kitchen.service';

export default class KitchenController {
    private kitchenService: KitchenService;

    constructor() {
        this.kitchenService = new KitchenService();
    }

    public async getReceivedOrders(req: Request, res: Response): Promise<void> {
        try {
            const orders = await this.kitchenService.getReceivedOrders();
            res.status(200).json(orders);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching received orders', error });
        }
    }
}
