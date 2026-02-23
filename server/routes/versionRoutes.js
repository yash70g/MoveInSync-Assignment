import express from 'express';
import {
  registerVersion,
  getAllVersions,
  getVersionHierarchy,
  deleteVersion
} from '../controllers/versionController.js';

const router = express.Router();

router.post('/', registerVersion);
router.get('/', getAllVersions);
router.get('/hierarchy/:oldCode/:newCode', getVersionHierarchy);
router.delete('/:id', deleteVersion);

export default router;
