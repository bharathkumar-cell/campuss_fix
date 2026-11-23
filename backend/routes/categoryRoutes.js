const express = require('express');
const router = express.Router();
const {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.get('/', getCategories);
router.get('/all', protect, requireAdmin, getAllCategoriesAdmin);
router.post('/', protect, requireAdmin, createCategory);
router.put('/:id', protect, requireAdmin, updateCategory);
router.delete('/:id', protect, requireAdmin, deleteCategory);

module.exports = router;
