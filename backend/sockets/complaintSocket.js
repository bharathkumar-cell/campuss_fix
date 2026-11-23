let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for specific complaint tracking
    socket.on('join:complaint', (complaintId) => {
      if (complaintId) {
        socket.join(`complaint_${complaintId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined room complaint_${complaintId}`);
      }
    });

    // Leave room
    socket.on('leave:complaint', (complaintId) => {
      if (complaintId) {
        socket.leave(`complaint_${complaintId}`);
      }
    });

    // Join room by role (e.g. admin, staff, student)
    socket.on('join:role', (role) => {
      if (role) {
        socket.join(`role_${role}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => {
  return ioInstance;
};

/**
 * Emit real-time event to all clients and room-specific subscribers
 */
const emitComplaintEvent = (eventName, payload) => {
  if (!ioInstance) return;

  // Broadcast to global channel
  ioInstance.emit(eventName, payload);

  // If payload contains complaintId or _id, broadcast specifically to that room
  const cid = payload.complaintId || payload.id || (payload.complaint && payload.complaint.complaintId);
  if (cid) {
    ioInstance.to(`complaint_${cid}`).emit(eventName, payload);
  }
  const mongoId = payload._id || (payload.complaint && payload.complaint._id);
  if (mongoId) {
    ioInstance.to(`complaint_${mongoId}`).emit(eventName, payload);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitComplaintEvent
};
