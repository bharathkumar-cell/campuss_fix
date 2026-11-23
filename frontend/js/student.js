/**
 * Student Dashboard Logic
 */

let studentComplaints = [];

async function loadStudentDashboard() {
  if (!Auth.guard(['student', 'admin'])) return;

  const user = Auth.getUser();
  const welcomeEl = document.getElementById('studentWelcomeName');
  if (welcomeEl) {
    welcomeEl.textContent = user.name;
  }

  try {
    const res = await fetch('/api/complaints', {
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`
      }
    });
    const result = await res.json();

    if (result.success && result.data) {
      const currentUserId = user._id;

      // Filter complaints where user is reporter or in participants
      studentComplaints = result.data.filter(c => {
        const isReporter = c.reporter && (c.reporter._id === currentUserId || c.reporter === currentUserId);
        const isParticipant = (c.participants || []).some(p => (p._id === currentUserId || p === currentUserId));
        return isReporter || isParticipant;
      });

      renderStudentMetrics(studentComplaints);
      renderStudentComplaintsTable(studentComplaints);
    }
  } catch (err) {
    console.error('Error loading student dashboard:', err);
    showToast('Failed to load dashboard data', 'error');
  }
}

function renderStudentMetrics(complaints) {
  const total = complaints.length;
  const active = complaints.filter(c => ['reported', 'assigned', 'in_progress', 'reopened'].includes(c.status)).length;
  const resolvedPending = complaints.filter(c => c.status === 'resolved').length;
  const closed = complaints.filter(c => ['verified', 'closed'].includes(c.status)).length;

  const totalEl = document.getElementById('metricTotal');
  const activeEl = document.getElementById('metricActive');
  const resolvedEl = document.getElementById('metricResolved');
  const closedEl = document.getElementById('metricClosed');

  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = active;
  if (resolvedEl) resolvedEl.textContent = resolvedPending;
  if (closedEl) closedEl.textContent = closed;

  // Highlight pending verification banner if any
  const verificationBanner = document.getElementById('pendingVerificationBanner');
  if (verificationBanner) {
    if (resolvedPending > 0) {
      verificationBanner.classList.remove('d-none');
      const countEl = document.getElementById('pendingVerificationCount');
      if (countEl) countEl.textContent = resolvedPending;
    } else {
      verificationBanner.classList.add('d-none');
    }
  }
}

function renderStudentComplaintsTable(complaints) {
  const tbody = document.getElementById('studentComplaintsTableBody');
  const emptyState = document.getElementById('studentEmptyState');
  if (!tbody) return;

  if (complaints.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');

  tbody.innerHTML = complaints.map(c => {
    const isParticipant = c.reporter && c.reporter._id !== Auth.getUser()._id;
    const dateFormatted = new Date(c.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    let actionBtn = `<a href="/complaint-details.html?id=${c.complaintId}" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye me-1"></i> View Details</a>`;

    if (c.status === 'resolved') {
      actionBtn = `<a href="/complaint-details.html?id=${c.complaintId}#verificationSection" class="btn btn-sm btn-success fw-semibold"><i class="bi bi-patch-check me-1"></i> Verify Resolution</a>`;
    }

    return `
      <tr>
        <td class="fw-bold text-primary font-monospace">${c.complaintId}</td>
        <td>
          <div class="fw-semibold text-dark">${c.title}</div>
          <div class="small text-muted">${c.building} ${c.floor ? '• Floor ' + c.floor : ''} (${c.location})</div>
        </td>
        <td><span class="badge bg-light text-dark border">${c.category}</span></td>
        <td>
          <span class="badge badge-status badge-${c.status}">
            ● ${c.status.replace('_', ' ')}
          </span>
          ${isParticipant ? '<span class="badge bg-info text-dark ms-1" title="You joined this complaint"><i class="bi bi-people"></i> Joined</span>' : ''}
        </td>
        <td><span class="badge badge-priority badge-priority-${c.priority}">${c.priority.toUpperCase()}</span></td>
        <td class="small text-muted">${dateFormatted}</td>
        <td class="text-end">${actionBtn}</td>
      </tr>
    `;
  }).join('');
}

// Live update hook
if (typeof Realtime !== 'undefined') {
  Realtime.onUpdate(() => {
    loadStudentDashboard();
  });
}
