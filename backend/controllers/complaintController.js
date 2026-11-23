const Complaint = require('../models/Complaint');
const StatusHistory = require('../models/StatusHistory');
const User = require('../models/User');
const { findDuplicateComplaint } = require('../services/duplicateService');
const {
  notifyComplaintCreated,
  notifyComplaintAssigned,
  notifyStatusUpdated
} = require('../services/notificationService');

// Helper to record status change history
const recordStatusHistory = async (complaintId, oldStatus, newStatus, user, note = '') => {
  try {
    await StatusHistory.create({
      complaint: complaintId,
      oldStatus,
      newStatus,
      changedBy: user ? user._id : null,
      changedByName: user ? user.name : 'System / Guest',
      changedByRole: user ? user.role : 'guest',
      note: note || `Status changed from ${oldStatus || 'NONE'} to ${newStatus}`
    });
  } catch (err) {
    console.error('[StatusHistory Error]', err.message);
  }
};

// @desc    Check for duplicate active complaints
// @route   POST /api/complaints/check-duplicate
// @access  Public
const checkDuplicate = async (req, res) => {
  try {
    const { category, building, block, floor, location } = req.body;
    const result = await findDuplicateComplaint({ category, building, block, floor, location });
    return res.status(200).json({
      success: true,
      duplicate: result.duplicate,
      existingComplaint: result.existingComplaint || null
    });
  } catch (error) {
    console.error('Check duplicate error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error checking for duplicates'
    });
  }
};

// @desc    Create a new complaint (Student or Guest)
// @route   POST /api/complaints
// @access  Public (Optional Auth)
const createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      building,
      block,
      floor,
      roomArea,
      location,
      guestName,
      guestEmail,
      guestPhone
    } = req.body;

    if (!title || !description || !category || !building || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, building, and specific location.'
      });
    }

    const attachments = [];
    if (req.file) {
      attachments.push(`/uploads/${req.file.filename}`);
    } else if (req.files && req.files.length > 0) {
      req.files.forEach(f => attachments.push(`/uploads/${f.filename}`));
    }

    let reporterType = 'guest';
    let reporterId = null;

    if (req.user) {
      reporterType = req.user.role === 'admin' ? 'admin' : (req.user.role === 'staff' ? 'staff' : 'student');
      reporterId = req.user._id;
    }

    const complaint = new Complaint({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      priority: priority || 'medium',
      building: building.trim(),
      block: (block || '').trim(),
      floor: (floor || '').trim(),
      roomArea: (roomArea || '').trim(),
      location: location.trim(),
      attachments,
      reporterType,
      reporter: reporterId,
      guestContact: {
        name: (guestName || '').trim(),
        email: (guestEmail || '').trim(),
        phone: (guestPhone || '').trim()
      },
      status: 'reported'
    });

    const savedComplaint = await complaint.save();

    // Record initial status in history
    await recordStatusHistory(
      savedComplaint._id,
      null,
      'reported',
      req.user || null,
      'Complaint submitted and registered in system'
    );

    // Socket notification
    notifyComplaintCreated(savedComplaint);

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        complaintId: savedComplaint.complaintId,
        status: savedComplaint.status,
        complaint: savedComplaint
      }
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error submitting complaint'
    });
  }
};

// @desc    Get complaints with filters and search
// @route   GET /api/complaints
// @access  Public / Role-filtered
const getComplaints = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      building,
      assignedStaff,
      reporter,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (building && building !== 'all') {
      query.building = new RegExp(building.trim(), 'i');
    }
    if (assignedStaff) {
      query.assignedStaff = assignedStaff;
    }
    if (reporter) {
      query.reporter = reporter;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { complaintId: regex },
        { title: regex },
        { description: regex },
        { location: regex },
        { building: regex }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('reporter', 'name email studentId department')
        .populate('assignedStaff', 'name email department')
        .populate('participants', 'name email studentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Complaint.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: complaints
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching complaints'
    });
  }
};

// @desc    Get single complaint details with timeline history
// @route   GET /api/complaints/:id
// @access  Public (safe details) / Authenticated
const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    // Support lookup by MongoDB _id or human readable complaintId
    let query = {};
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { complaintId: id.toUpperCase() };
    }

    const complaint = await Complaint.findOne(query)
      .populate('reporter', 'name email studentId department year')
      .populate('assignedStaff', 'name email department')
      .populate('participants', 'name email studentId department');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Fetch timeline history
    const timeline = await StatusHistory.find({ complaint: complaint._id })
      .populate('changedBy', 'name role')
      .sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      data: {
        ...complaint.toObject(),
        timeline
      }
    });
  } catch (error) {
    console.error('Get complaint by ID error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching complaint details'
    });
  }
};

// @desc    Guest tracking endpoint (safe sanitized information)
// @route   GET /api/complaints/track/:complaintId
// @access  Public
const trackGuestComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findOne({ complaintId: complaintId.trim().toUpperCase() })
      .populate('assignedStaff', 'name department');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found with this ID. Please check the Complaint ID.'
      });
    }

    const timeline = await StatusHistory.find({ complaint: complaint._id })
      .sort({ timestamp: 1 });

    // Sanitized guest response without exposing private student records
    const safeData = {
      complaintId: complaint.complaintId,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      building: complaint.building,
      block: complaint.block,
      floor: complaint.floor,
      roomArea: complaint.roomArea,
      location: complaint.location,
      attachments: complaint.attachments,
      status: complaint.status,
      assignedStaff: complaint.assignedStaff ? { name: complaint.assignedStaff.name, department: complaint.assignedStaff.department } : null,
      participantCount: (complaint.participants || []).length + 1,
      resolutionDescription: complaint.resolutionDescription,
      resolutionProof: complaint.resolutionProof,
      reopenReason: complaint.reopenReason,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      resolvedAt: complaint.resolvedAt,
      verifiedAt: complaint.verifiedAt,
      closedAt: complaint.closedAt,
      timeline
    };

    return res.status(200).json({
      success: true,
      data: safeData
    });
  } catch (error) {
    console.error('Track complaint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error tracking complaint'
    });
  }
};

// @desc    Join an existing complaint
// @route   POST /api/complaints/:id/join
// @access  Private (Student)
const joinComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    let query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { complaintId: id.toUpperCase() };

    const complaint = await Complaint.findOne(query);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const userIdStr = req.user._id.toString();

    // Check if user is the original reporter
    if (complaint.reporter && complaint.reporter.toString() === userIdStr) {
      return res.status(400).json({
        success: false,
        message: 'You are the original reporter of this complaint.'
      });
    }

    // Check if already in participants
    const alreadyJoined = (complaint.participants || []).some(
      pId => pId.toString() === userIdStr
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this complaint.'
      });
    }

    complaint.participants.push(req.user._id);
    await complaint.save();

    await recordStatusHistory(
      complaint._id,
      complaint.status,
      complaint.status,
      req.user,
      `Student ${req.user.name} (${req.user.studentId || req.user.email}) joined as affected participant`
    );

    notifyStatusUpdated(complaint, complaint.status, complaint.status);

    return res.status(200).json({
      success: true,
      message: 'Successfully joined the complaint. You will now receive updates.',
      data: {
        complaintId: complaint.complaintId,
        participantCount: complaint.participants.length + 1
      }
    });
  } catch (error) {
    console.error('Join complaint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error joining complaint'
    });
  }
};

// @desc    Assign complaint to staff (Admin)
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Admin)
const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid staffId'
      });
    }

    const staffUser = await User.findById(staffId);
    if (!staffUser || (staffUser.role !== 'staff' && staffUser.role !== 'admin')) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must be a staff member'
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

    const oldStatus = complaint.status;
    complaint.assignedStaff = staffUser._id;
    if (complaint.status === 'reported') {
      complaint.status = 'assigned';
    }

    await complaint.save();

    await recordStatusHistory(
      complaint._id,
      oldStatus,
      complaint.status,
      req.user,
      `Assigned to staff: ${staffUser.name} (${staffUser.email})`
    );

    notifyComplaintAssigned(complaint, staffUser);

    return res.status(200).json({
      success: true,
      message: `Complaint assigned to ${staffUser.name}`,
      data: complaint
    });
  } catch (error) {
    console.error('Assign complaint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error assigning complaint'
    });
  }
};

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id/status
// @access  Private (Staff / Admin)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['reported', 'assigned', 'in_progress', 'resolved', 'verified', 'closed', 'reopened'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
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

    // Role safety check: Staff can only update complaints assigned to them (unless admin)
    if (req.user.role === 'staff' && complaint.assignedStaff && complaint.assignedStaff.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update complaints assigned to you.'
      });
    }

    // Staff cannot directly close a complaint without student verification
    if (req.user.role === 'staff' && status === 'closed') {
      return res.status(403).json({
        success: false,
        message: 'Staff cannot close complaints directly. Upload resolution proof to mark as Resolved for student verification.'
      });
    }

    const oldStatus = complaint.status;
    complaint.status = status;

    if (status === 'resolved') complaint.resolvedAt = new Date();
    if (status === 'verified') complaint.verifiedAt = new Date();
    if (status === 'closed') complaint.closedAt = new Date();

    await complaint.save();

    await recordStatusHistory(
      complaint._id,
      oldStatus,
      status,
      req.user,
      note || `Status transitioned to ${status}`
    );

    notifyStatusUpdated(complaint, oldStatus, status);

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: complaint
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating status'
    });
  }
};

// @desc    Upload resolution proof and mark resolved
// @route   POST /api/complaints/:id/proof
// @access  Private (Staff / Admin)
const uploadResolutionProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionDescription } = req.body;

    if (!resolutionDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a resolution description.'
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

    if (req.user.role === 'staff' && complaint.assignedStaff && complaint.assignedStaff.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only resolve complaints assigned to you.'
      });
    }

    let proofPath = complaint.resolutionProof || '';
    if (req.file) {
      proofPath = `/uploads/${req.file.filename}`;
    }

    const oldStatus = complaint.status;
    complaint.resolutionDescription = resolutionDescription.trim();
    complaint.resolutionProof = proofPath;
    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();

    await complaint.save();

    await recordStatusHistory(
      complaint._id,
      oldStatus,
      'resolved',
      req.user,
      `Marked as Resolved. Resolution: "${resolutionDescription}". Proof attached.`
    );

    notifyStatusUpdated(complaint, oldStatus, 'resolved');

    return res.status(200).json({
      success: true,
      message: 'Resolution proof submitted. Awaiting student verification.',
      data: complaint
    });
  } catch (error) {
    console.error('Resolution proof error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error uploading resolution proof'
    });
  }
};

// @desc    Student verification (Accept -> Closed, or Reject -> Reopened)
// @route   POST /api/complaints/:id/verify
// @access  Private (Student / Admin / Reporter)
const verifyResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, reason } = req.body;

    let query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { complaintId: id.toUpperCase() };
    const complaint = await Complaint.findOne(query);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: `Complaint is currently '${complaint.status}'. Only 'resolved' complaints can be verified.`
      });
    }

    const oldStatus = complaint.status;

    if (verified === true || verified === 'true') {
      complaint.status = 'closed';
      complaint.verifiedAt = new Date();
      complaint.closedAt = new Date();
      await complaint.save();

      await recordStatusHistory(
        complaint._id,
        oldStatus,
        'closed',
        req.user,
        `Student confirmed resolution: Problem is solved. Complaint closed successfully.`
      );

      notifyStatusUpdated(complaint, oldStatus, 'closed');

      return res.status(200).json({
        success: true,
        message: 'Complaint verified and closed successfully. Thank you for your feedback!',
        data: complaint
      });
    } else {
      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a reason why the problem is not solved.'
        });
      }

      complaint.status = 'reopened';
      complaint.reopenReason = reason.trim();
      await complaint.save();

      await recordStatusHistory(
        complaint._id,
        oldStatus,
        'reopened',
        req.user,
        `Student rejected resolution: "${reason.trim()}". Complaint reopened.`
      );

      notifyStatusUpdated(complaint, oldStatus, 'reopened');

      return res.status(200).json({
        success: true,
        message: 'Complaint reopened. The staff team will re-examine the issue.',
        data: complaint
      });
    }
  } catch (error) {
    console.error('Verify resolution error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error verifying resolution'
    });
  }
};

// @desc    Delete complaint (Admin only)
// @route   DELETE /api/complaints/:id
// @access  Private (Admin)
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    let query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { complaintId: id.toUpperCase() };

    const complaint = await Complaint.findOne(query);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    await Complaint.findByIdAndDelete(complaint._id);
    await StatusHistory.deleteMany({ complaint: complaint._id });

    return res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting complaint'
    });
  }
};

module.exports = {
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
};
