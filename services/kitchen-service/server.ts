import express from 'express';
import router from './routes';
import KitchenService from './services/kitchen.service';
import { listenToKitchenQueue } from './messaging/kitchenQueue';
import { subscribeToOrders } from './messaging/ordersPubSub';
import { metricsMiddleware } from './metrics';

const app = express();
app.use(metricsMiddleware);
app.use(express.json());
app.use('/', router);

const kitchenService = new KitchenService();

// Two independent ways of hearing about new orders — run both to compare.
listenToKitchenQueue((order) => kitchenService.receiveOrder(order, 'queue')).catch(console.error);
subscribeToOrders((order) => kitchenService.receiveOrder(order, 'pubsub')).catch(console.error);

const port = 3031;
app.listen(port, () => {
    console.log(`Kitchen service is running on http://localhost:${port}`);
});
