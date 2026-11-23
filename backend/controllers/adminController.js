const Complaint = require('../models/Complaint');
const User = require('../models/User');
const StatusHistory = require('../models/StatusHistory');
const Category = require('../models/Category');

// @desc    Get Admin Dashboard metrics and statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardMetrics = async (req, res) => {
  try {
    const [
      totalComplaints,
      reportedCount,
      assignedCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      reopenedCount,
      totalUsers,
      totalStaff,
      allComplaints
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'reported' }),
      Complaint.countDocuments({ status: 'assigned' }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'closed' }),
      Complaint.countDocuments({ status: 'reopened' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: { $in: ['staff', 'admin'] } }),
      Complaint.find({}, 'category priority participants')
    ]);

    // Calculate duplicates avoided based on total extra participants joined
    let duplicatesAvoided = 0;
    const categoryDistribution = {};
    const priorityDistribution = { low: 0, medium: 0, high: 0, critical: 0 };

    allComplaints.forEach(c => {
      if (c.participants && c.participants.length > 0) {
        duplicatesAvoided += c.participants.length;
      }
      if (c.category) {
        categoryDistribution[c.category] = (categoryDistribution[c.category] || 0) + 1;
      }
      if (c.priority && priorityDistribution[c.priority] !== undefined) {
        priorityDistribution[c.priority]++;
      }
    });

    const recentComplaints = await Complaint.find()
      .populate('reporter', 'name email studentId')
      .populate('assignedStaff', 'name email')
      .sort({ createdAt: -1 })
      .limit(8);

    return res.status(200).json({
      success: true,
      data: {
        total: totalComplaints,
        reported: reportedCount,
        assigned: assignedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
        reopened: reopenedCount,
        duplicatesAvoided,
        totalUsers,
        totalStaff,
        categoryDistribution,
        priorityDistribution,
        recentComplaints
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching admin dashboard metrics'
    });
  }
};

// @desc    Get all staff members
// @route   GET /api/admin/staff
// @access  Private (Admin)
const getStaffList = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['staff', 'admin'] } })
      .select('-password')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching staff list'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUserList = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user list'
    });
  }
};

// @desc    Update complaint priority
// @route   PATCH /api/admin/complaints/:id/priority
// @access  Private (Admin)
const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be low, medium, high, or critical.'
      });
    }

    let query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { complaintId: id.toUpperCase() };
    const complaint = await Complaint.findOne(query);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const oldPriority = complaint.priority;
    complaint.priority = priority;
    await complaint.save();

    await StatusHistory.create({
      complaint: complaint._id,
      oldStatus: complaint.status,
      newStatus: complaint.status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      changedByRole: req.user.role,
      note: `Priority changed from ${oldPriority.toUpperCase()} to ${priority.toUpperCase()}`
    });

    return res.status(200).json({
      success: true,
      message: `Priority updated to ${priority}`,
      data: complaint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating priority'
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getStaffList,
  getUserList,
  updatePriority
};
