import { Router } from 'express';
import * as controller from './workingSchedule.controller';

const router = Router();

// GET  /working-schedule/:lawyerId
router.get('/:lawyerId', controller.getSchedule);

// PUT  /working-schedule/:lawyerId  — replaces full schedule (upsert)
router.put('/:lawyerId', controller.setSchedule);

// DELETE /working-schedule/slot/:id
router.delete('/slot/:id', controller.removeSlot);

export default router;
