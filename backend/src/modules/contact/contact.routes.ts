import { Router } from 'express';
import * as controller from './contact.controller';

const router = Router();

router.post('/', controller.submit);
router.get('/', controller.list);

export default router;
