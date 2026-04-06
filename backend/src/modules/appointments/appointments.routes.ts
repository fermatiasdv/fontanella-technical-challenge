import { Router } from 'express';
import * as controller from './appointments.controller';

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.patch('/:id/cancel', controller.cancel);
router.delete('/:id', controller.remove);

export default router;
