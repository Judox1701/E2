import { Router } from 'express';
import InventoryController from '../controllers/inventory.controller';

const router = Router();
const inventoryController = new InventoryController();

router.get('/', (req, res) => {
    return inventoryController.getProducts(req, res);
});

router.post('/', (req, res) => {
    return inventoryController.createProduct(req, res);
});

router.post('/decrease', (req, res) => {
    return inventoryController.decreaseStock(req, res);
});

export default router;
