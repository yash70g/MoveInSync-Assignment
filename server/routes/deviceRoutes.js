import express from 'express';
import { heartbeat, getAllDevices } from '../controllers/deviceController.js';

const router = express.Router();

router.post('/heartbeat', heartbeat);
router.get('/', getAllDevices);

export default router;
