/**
 * Staff Dashboard Logic
 */

let staffComplaints = [];
let activeStaffComplaintId = null;

async function loadStaffDashboard() {
  if (!Auth.guard(['staff', 'admin'])) return;

  const user = Auth.getUser();
  const nameEl = document.getElementById('staffWelcomeName');
  const deptEl = document.getElementById('staffDepartment');

  if (nameEl) nameEl.textContent = user.name;
  if (deptEl) deptEl.textContent = user.department || 'Maintenance Team';

  try {
    const res = await fetch(`/api/complaints?assignedStaff=${user._id}`, {
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`
      }
    });
    const result = await res.json();

    if (result.success && result.data) {
      staffComplaints = result.data;
      renderStaffMetrics(staffComplaints);
      renderStaffComplaintsTable(staffComplaints);
    }
  } catch (err) {
    console.error('Error loading staff dashboard:', err);
    showToast('Failed to load assigned tasks.', 'error');
  }
}

function renderStaffMetrics(complaints) {
  const total = complaints.length;
  const assigned = complaints.filter(c => c.status === 'assigned').length;
  const inProgress = complaints.filter(c => c.status === 'in_progress' || c.status === 'reopened').length;
  const resolved = complaints.filter(c => ['resolved', 'verified', 'closed'].includes(c.status)).length;

  const totalEl = document.getElementById('metricTotalTasks');
  const assignedEl = document.getElementById('metricAssignedTasks');
  const progressEl = document.getElementById('metricProgressTasks');
  const resolvedEl = document.getElementById('metricResolvedTasks');

  if (totalEl) totalEl.textContent = total;
  if (assignedEl) assignedEl.textContent = assigned;
  if (progressEl) progressEl.textContent = inProgress;
  if (resolvedEl) resolvedEl.textContent = resolved;
}

function renderStaffComplaintsTable(complaints) {
  const tbody = document.getElementById('staffComplaintsTableBody');
  const emptyState = document.getElementById('staffEmptyState');
  if (!tbody) return;

  if (complaints.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');

  tbody.innerHTML = complaints.map(c => {
    const dateFormatted = new Date(c.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    let actionButtons = `<a href="/complaint-details.html?id=${c.complaintId}" class="btn btn-sm btn-outline-secondary me-1"><i class="bi bi-eye"></i></a>`;

    if (c.status === 'assigned' || c.status === 'reopened') {
      actionButtons += `
        <button class="btn btn-sm btn-primary me-1" onclick="updateTaskStatus('${c.complaintId}', 'in_progress')">
          <i class="bi bi-play-fill me-1"></i> Start Work
        </button>
      `;
    }

    if (c.status === 'in_progress' || c.status === 'reopened') {
      actionButtons += `
        <button class="btn btn-sm btn-success" onclick="openResolveModal('${c.complaintId}', '${escapeHtml(c.title)}')">
          <i class="bi bi-check2-circle me-1"></i> Resolve with Proof
        </button>
      `;
    }

    return `
      <tr>
        <td class="fw-bold text-primary font-monospace">${c.complaintId}</td>
        <td>
          <div class="fw-semibold text-dark">${c.title}</div>
          <div class="small text-muted">${c.building} ${c.floor ? '• Floor ' + c.floor : ''} (${c.location})</div>
          ${c.reopenReason ? `<div class="alert alert-danger p-1 mt-1 mb-0 small"><i class="bi bi-exclamation-triangle me-1"></i><strong>Reopen Reason:</strong> ${c.reopenReason}</div>` : ''}
        </td>
        <td><span class="badge bg-light text-dark border">${c.category}</span></td>
        <td><span class="badge badge-priority badge-priority-${c.priority}">${c.priority.toUpperCase()}</span></td>
        <td>
          <span class="badge badge-status badge-${c.status}">
            ● ${c.status.replace('_', ' ')}
          </span>
        </td>
        <td class="small text-muted">${dateFormatted}</td>
        <td class="text-end">${actionButtons}</td>
      </tr>
    `;
  }).join('');
}

// Update task status (e.g. In Progress)
async function updateTaskStatus(complaintId, newStatus) {
  try {
    const res = await fetch(`/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus, note: 'Staff started work on site' })
    });

    const result = await res.json();
    if (result.success) {
      showToast(`Status updated to ${newStatus.replace('_', ' ')}!`, 'success');
      loadStaffDashboard();
    } else {
      showToast(result.message || 'Error updating status', 'error');
    }
  } catch (err) {
    console.error('Update status error:', err);
    showToast('Failed to update status', 'error');
  }
}

// Open Resolve Modal
function openResolveModal(complaintId, title) {
  activeStaffComplaintId = complaintId;
  const modalEl = document.getElementById('resolveProofModal');
  if (!modalEl) return;

  document.getElementById('resolveComplaintIdText').textContent = complaintId;
  document.getElementById('resolveComplaintTitleText').textContent = title;
  document.getElementById('resolutionDescription').value = '';
  document.getElementById('proofFile').value = '';

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// Submit Resolution Proof
async function handleProofSubmit(e) {
  e.preventDefault();

  if (!activeStaffComplaintId) return;

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);

  if (!formData.get('resolutionDescription')) {
    showToast('Please provide a resolution description', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading proof...';
  }

  try {
    const res = await fetch(`/api/complaints/${activeStaffComplaintId}/proof`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`
      },
      body: formData
    });

    const result = await res.json();

    if (result.success) {
      showToast('Resolution proof submitted successfully! Awaiting student verification.', 'success');
      const modalEl = document.getElementById('resolveProofModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      loadStaffDashboard();
    } else {
      showToast(result.message || 'Error submitting proof', 'error');
    }
  } catch (err) {
    console.error('Proof submission error:', err);
    showToast('Server error uploading proof', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Submit Resolution';
    }
  }
}

function escapeHtml(text) {
  return (text || '').replace(/['"]/g, '');
}

// Live update hook
if (typeof Realtime !== 'undefined') {
  Realtime.onUpdate(() => {
    loadStaffDashboard();
  });
}
