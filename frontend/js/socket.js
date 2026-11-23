/**
 * Socket.IO Real-time Connection and Live Updates Helper
 */

let socket = null;
const socketListeners = [];

const Realtime = {
  init() {
    if (typeof io === 'undefined') {
      console.warn('[Socket.IO] Library not loaded in HTML.');
      return;
    }

    try {
      socket = io();

      socket.on('connect', () => {
        console.log('[Socket.IO] Connected to real-time server with ID:', socket.id);
        const role = Auth.getRole();
        if (role && role !== 'guest') {
          socket.emit('join:role', role);
        }
      });

      // Handle real-time complaint status events
      const events = [
        'complaint:created',
        'complaint:assigned',
        'complaint:statusUpdated',
        'complaint:resolved',
        'complaint:reopened',
        'complaint:verified',
        'complaint:closed'
      ];

      events.forEach(eventName => {
        socket.on(eventName, (data) => {
          console.log(`[Realtime Event: ${eventName}]`, data);
          if (data && data.message) {
            showToast(data.message, eventName.includes('resolved') || eventName.includes('closed') ? 'success' : (eventName.includes('reopened') ? 'error' : 'info'));
          }

          // Trigger page-specific listeners
          socketListeners.forEach(listener => {
            try {
              listener(eventName, data);
            } catch (err) {
              console.error('Socket listener error:', err);
            }
          });
        });
      });

      socket.on('disconnect', () => {
        console.log('[Socket.IO] Disconnected from server');
      });
    } catch (err) {
      console.error('[Socket.IO Init Error]', err);
    }
  },

  joinComplaintRoom(complaintId) {
    if (socket && complaintId) {
      socket.emit('join:complaint', complaintId);
    }
  },

  onUpdate(callback) {
    if (typeof callback === 'function') {
      socketListeners.push(callback);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Realtime.init();
});
