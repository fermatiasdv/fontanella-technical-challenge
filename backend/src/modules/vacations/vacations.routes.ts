import { Router } from 'express';
import * as controller from './vacations.controller';

const router = Router();

router.get('/:lawyerId', controller.list);
router.post('/:lawyerId', controller.create);
router.delete('/:id', controller.remove);

export default router;
