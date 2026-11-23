const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getStaffList,
  getUserList,
  updatePriority
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(requireAdmin);

router.get('/dashboard', getDashboardMetrics);
router.get('/staff', getStaffList);
router.get('/users', getUserList);
router.patch('/complaints/:id/priority', updatePriority);

module.exports = router;
