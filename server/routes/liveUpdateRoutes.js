import express from 'express';
import {
  createLiveUpdate,
  getAllLiveUpdates,
  getLiveUpdateById,
  deleteLiveUpdate,
  getFilteredDevices
} from '../controllers/liveUpdateController.js';

const router = express.Router();

router.post('/', createLiveUpdate);
router.get('/', getAllLiveUpdates);
router.get('/devices', getFilteredDevices);
router.get('/:id', getLiveUpdateById);
router.delete('/:id', deleteLiveUpdate);

export default router;
