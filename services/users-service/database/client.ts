import { Pool } from 'pg';

export default class DatabaseClient {
    private static instance: DatabaseClient;
    private pool: Pool;

    private constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'users-service',
            password: process.env.DB_PASSWORD || 'postgres',
            port: Number(process.env.DB_PORT) || 5432,
        });

        // Without this, an error on an idle pooled connection (e.g. the db
        // restarting) is an unhandled 'error' event and crashes the process.
        this.pool.on('error', (error: Error) => console.error('[db] pool error', error));

        this.ensureSchema();
    }

    // Retries forever with capped backoff instead of crashing on startup -
    // the db container may still be starting when this runs.
    private async ensureSchema(): Promise<void> {
        let delayMs = 2000;
        const maxDelayMs = 30000;

        for (;;) {
            try {
                await this.pool.query(`
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL UNIQUE
                    )
                `);
                return;
            } catch (error) {
                console.log(`[db] not reachable yet, retrying in ${delayMs / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
                delayMs = Math.min(delayMs * 2, maxDelayMs);
            }
        }
    }

    public static getInstance(): DatabaseClient {
        if (!DatabaseClient.instance) {
            DatabaseClient.instance = new DatabaseClient();
        }
        return DatabaseClient.instance;
    }

    public async query(text: string, params?: any[]): Promise<any> {
        const client = await this.pool.connect();
        try {
            const res = await client.query(text, params);
            return res;
        } finally {
            client.release();
        }
    }
}
