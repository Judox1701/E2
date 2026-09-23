import { Router } from 'express';
import UserController from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

router.get('/', (req, res) => {
    return userController.getUsers(req, res);
});

router.get('/:id', (req, res) => {
    return userController.getUserById(req, res);
});

router.post('/', (req, res) => {
    return userController.createUser(req, res);
});

router.delete('/:id', (req, res) => {
    return userController.deleteUser(req, res);
});

export default router;
