import express from 'express';
import router from './routes';
import { metricsMiddleware } from './metrics';

const app = express();
app.use(metricsMiddleware);
app.use(express.json());
app.use('/', router);

const port = 3030;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});