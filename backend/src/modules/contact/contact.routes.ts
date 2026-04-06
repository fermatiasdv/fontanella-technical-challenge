import { Router } from 'express';
import * as controller from './contact.controller';

const router = Router();

router.get('/', controller.list);
router.get('/lawyer/:lawyerId', controller.listByLawyer);
router.get('/client/:clientId', controller.listByClient);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
