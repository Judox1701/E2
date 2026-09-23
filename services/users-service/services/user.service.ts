import User from '../models/user.model';
import DatabaseClient from '../database/client';

export default class UserService {
    private dbClient: DatabaseClient;

    constructor() {
        this.dbClient = DatabaseClient.getInstance();
    }

    public async getUsers(): Promise<User[]> {
        const result = await this.dbClient.query('SELECT * FROM users ORDER BY id');
        return result.rows;
    }

    public async getUserById(id: number): Promise<User | null> {
        const result = await this.dbClient.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] ?? null;
    }

    public async createUser(name: string, email: string): Promise<User> {
        const result = await this.dbClient.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
            [name, email]
        );
        return result.rows[0];
    }

    public async deleteUser(id: number): Promise<boolean> {
        const result = await this.dbClient.query('DELETE FROM users WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
}
