import amqp, { Channel } from 'amqplib';

const channels = new Map<string, Promise<Channel>>();

// Retries forever with capped backoff instead of giving up - a broker that's
// slow to start (or briefly down) shouldn't take the app down with it.
async function connectWithRetry(url: string): Promise<Channel> {
    let delayMs = 2000;
    const maxDelayMs = 30000;

    for (;;) {
        try {
            const connection = await amqp.connect(url);
            console.log(`[broker] connected to ${url}`);
            return await connection.createChannel();
        } catch (error) {
            console.log(`[broker] ${url} not reachable, retrying in ${delayMs / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            delayMs = Math.min(delayMs * 2, maxDelayMs);
        }
    }
}

// One connection is shared per broker URL - kitchenQueue and ordersPubSub
// each talk to a different broker, so they get separate channels here.
export function getChannel(url: string): Promise<Channel> {
    if (!channels.has(url)) {
        channels.set(url, connectWithRetry(url));
    }
    return channels.get(url)!;
}
