import express from 'express';
import { heartbeat, getAllDevices } from '../controllers/deviceController.js';
import { rejectUpdate } from '../controllers/updateController.js';

const router = express.Router();

router.post('/heartbeat', heartbeat);
router.get('/', getAllDevices);
router.post('/reject-update', rejectUpdate);

export default router;
