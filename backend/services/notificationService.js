const { emitComplaintEvent } = require('../sockets/complaintSocket');

const notifyComplaintCreated = (complaint) => {
  emitComplaintEvent('complaint:created', {
    message: `New complaint submitted: ${complaint.complaintId} (${complaint.category})`,
    complaint
  });
};

const notifyComplaintAssigned = (complaint, staff) => {
  emitComplaintEvent('complaint:assigned', {
    message: `Complaint ${complaint.complaintId} assigned to ${staff ? staff.name : 'Staff'}`,
    complaintId: complaint.complaintId,
    complaint
  });
};

const notifyStatusUpdated = (complaint, oldStatus, newStatus) => {
  let eventName = 'complaint:statusUpdated';
  if (newStatus === 'resolved') eventName = 'complaint:resolved';
  if (newStatus === 'reopened') eventName = 'complaint:reopened';
  if (newStatus === 'verified') eventName = 'complaint:verified';
  if (newStatus === 'closed') eventName = 'complaint:closed';

  emitComplaintEvent(eventName, {
    message: `Complaint ${complaint.complaintId} status updated to ${newStatus.toUpperCase()}`,
    complaintId: complaint.complaintId,
    oldStatus,
    newStatus,
    complaint
  });
};

module.exports = {
  notifyComplaintCreated,
  notifyComplaintAssigned,
  notifyStatusUpdated
};
