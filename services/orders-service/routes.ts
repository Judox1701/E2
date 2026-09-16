import express, {Router} from 'express';
import orderRoutes from './routes/order.route';
import { register } from './metrics';

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

router.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

router.use('/orders', orderRoutes);

export default router;