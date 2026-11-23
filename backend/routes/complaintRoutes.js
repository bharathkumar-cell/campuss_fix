const express = require('express');
const router = express.Router();
const {
  checkDuplicate,
  createComplaint,
  getComplaints,
  getComplaintById,
  trackGuestComplaint,
  joinComplaint,
  assignComplaint,
  updateStatus,
  uploadResolutionProof,
  verifyResolution,
  deleteComplaint
} = require('../controllers/complaintController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { requireStudent, requireStaff, requireAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public & optional auth routes
router.post('/check-duplicate', checkDuplicate);
router.get('/track/:complaintId', trackGuestComplaint);
router.post('/', optionalAuth, upload.single('attachment'), createComplaint);
router.get('/', optionalAuth, getComplaints);
router.get('/:id', optionalAuth, getComplaintById);

// Protected routes
router.post('/:id/join', protect, requireStudent, joinComplaint);
router.patch('/:id/assign', protect, requireAdmin, assignComplaint);
router.patch('/:id/status', protect, requireStaff, updateStatus);
router.post('/:id/proof', protect, requireStaff, upload.single('proofFile'), uploadResolutionProof);
router.post('/:id/verify', protect, requireStudent, verifyResolution);
router.delete('/:id', protect, requireAdmin, deleteComplaint);

module.exports = router;
