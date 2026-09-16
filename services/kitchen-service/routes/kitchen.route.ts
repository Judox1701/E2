import { Router } from 'express';
import KitchenController from '../controllers/kitchen.controller';

const router = Router();
const kitchenController = new KitchenController();

router.get('/', (req, res) => {
    return kitchenController.getReceivedOrders(req, res);
});

export default router;
