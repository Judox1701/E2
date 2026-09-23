import { Request, Response } from 'express';
import UserService from '../services/user.service';

// Postgres error code for a unique constraint violation (duplicate email).
const UNIQUE_VIOLATION = '23505';

export default class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    public async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.userService.getUsers();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching users', error });
        }
    }

    public async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const user = await this.userService.getUserById(Number(req.params.id));
            if (!user) {
                res.status(404).json({ message: `User ${req.params.id} does not exist` });
                return;
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching user', error });
        }
    }

    public async createUser(req: Request, res: Response): Promise<void> {
        const { name, email } = req.body ?? {};
        if (!name || !email) {
            res.status(400).json({ message: 'name and email are required' });
            return;
        }

        try {
            const user = await this.userService.createUser(name, email);
            res.status(201).json(user);
        } catch (error) {
            if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
                res.status(409).json({ message: `Email ${email} is already in use` });
                return;
            }
            res.status(500).json({ message: 'Error creating user', error });
        }
    }

    public async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const deleted = await this.userService.deleteUser(Number(req.params.id));
            if (!deleted) {
                res.status(404).json({ message: `User ${req.params.id} does not exist` });
                return;
            }
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting user', error });
        }
    }
}
