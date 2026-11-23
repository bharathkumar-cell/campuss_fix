const Category = require('../models/Category');

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching categories'
    });
  }
};

// @desc    Get all categories including inactive (Admin)
// @route   GET /api/categories/all
// @access  Admin
const getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching all categories'
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Admin
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.'
      });
    }

    const exists = await Category.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists.'
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      active: true
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating category'
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description, active } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (active !== undefined) category.active = active;

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating category'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting category'
    });
  }
};

module.exports = {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory
};
