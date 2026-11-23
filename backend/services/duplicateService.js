const Complaint = require('../models/Complaint');

/**
 * Check if a similar active complaint already exists
 * Matches category, building, and location/block/floor among active statuses
 */
const findDuplicateComplaint = async ({ category, building, block, floor, location }) => {
  if (!category || !building) {
    return { duplicate: false };
  }

  const activeStatuses = ['reported', 'assigned', 'in_progress', 'reopened'];

  // Base query for active complaints in same category and building
  const query = {
    status: { $in: activeStatuses },
    category: new RegExp(`^${category.trim()}$`, 'i'),
    building: new RegExp(`^${building.trim()}$`, 'i')
  };

  // If block or floor are provided, match them if they exist
  if (block && block.trim()) {
    query.block = new RegExp(`^${block.trim()}$`, 'i');
  }

  if (floor && floor.trim()) {
    query.floor = new RegExp(`^${floor.trim()}$`, 'i');
  }

  // Fetch potential duplicates
  const candidates = await Complaint.find(query)
    .populate('reporter', 'name email studentId')
    .populate('assignedStaff', 'name email')
    .sort({ createdAt: -1 });

  if (candidates.length === 0) {
    return { duplicate: false };
  }

  // Filter or match closest location description
  const cleanLocation = (location || '').trim().toLowerCase();
  let matched = null;

  if (cleanLocation) {
    matched = candidates.find(c => {
      const existingLoc = (c.location || '').toLowerCase();
      return (
        existingLoc === cleanLocation ||
        existingLoc.includes(cleanLocation) ||
        cleanLocation.includes(existingLoc)
      );
    });
  }

  // Fallback to latest candidate in same building/floor if exact location is similar
  if (!matched && candidates.length > 0) {
    matched = candidates[0];
  }

  if (matched) {
    return {
      duplicate: true,
      existingComplaint: {
        _id: matched._id,
        complaintId: matched.complaintId,
        title: matched.title,
        category: matched.category,
        building: matched.building,
        block: matched.block,
        floor: matched.floor,
        location: matched.location,
        status: matched.status,
        priority: matched.priority,
        createdAt: matched.createdAt,
        participantCount: (matched.participants || []).length + 1
      }
    };
  }

  return { duplicate: false };
};

module.exports = {
  findDuplicateComplaint
};
