import express from 'express';
import {
  getDeviceTimeline,
  getAnalytics,
  getRegionWiseAdoption,
  getUpdateHistory
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/device/:imei', getDeviceTimeline);
router.get('/stats', getAnalytics);
router.get('/region-adoption', getRegionWiseAdoption);
router.get('/history', getUpdateHistory);

export default router;
