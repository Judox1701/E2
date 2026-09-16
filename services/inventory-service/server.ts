import express from 'express';
import router from './routes';
import { metricsMiddleware } from './metrics';

const app = express();
app.use(metricsMiddleware);
app.use(express.json());
app.use('/', router);

const port = 3032;
app.listen(port, () => {
    console.log(`Inventory service is running on http://localhost:${port}`);
});
