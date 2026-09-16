import { Router } from 'express';
import inventoryRoutes from './routes/inventory.route';
import { register } from './metrics';

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

router.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

router.use('/inventory', inventoryRoutes);

export default router;
