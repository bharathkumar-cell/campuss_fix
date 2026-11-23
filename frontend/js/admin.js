/**
 * Admin Dashboard & System Control Logic
 */

let allAdminComplaints = [];
let staffMembers = [];
let selectedAdminComplaintId = null;

async function loadAdminDashboard() {
  if (!Auth.guard(['admin'])) return;

  await Promise.all([
    fetchAdminMetrics(),
    fetchStaffList(),
    fetchAdminComplaints(),
    loadAdminCategories()
  ]);
}

async function fetchAdminMetrics() {
  try {
    const res = await fetch('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const result = await res.json();

    if (result.success && result.data) {
      const d = result.data;
      document.getElementById('metricTotal').textContent = d.total;
      document.getElementById('metricReported').textContent = d.reported;
      document.getElementById('metricAssigned').textContent = d.assigned;
      document.getElementById('metricInProgress').textContent = d.inProgress;
      document.getElementById('metricResolved').textContent = d.resolved;
      document.getElementById('metricClosed').textContent = d.closed;
      document.getElementById('metricReopened').textContent = d.reopened;
      document.getElementById('metricDuplicatesAvoided').textContent = d.duplicatesAvoided;
      if (document.getElementById('metricUsersCount')) {
        document.getElementById('metricUsersCount').textContent = d.totalUsers;
      }
      if (document.getElementById('metricStaffCount')) {
        document.getElementById('metricStaffCount').textContent = d.totalStaff;
      }
    }
  } catch (err) {
    console.error('Error fetching admin metrics:', err);
  }
}

async function fetchStaffList() {
  try {
    const res = await fetch('/api/admin/staff', {
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const result = await res.json();

    if (result.success && result.data) {
      staffMembers = result.data;
      populateStaffDropdowns();
    }
  } catch (err) {
    console.error('Error fetching staff list:', err);
  }
}

function populateStaffDropdowns() {
  const modalSelect = document.getElementById('assignStaffSelect');
  const filterSelect = document.getElementById('filterStaff');

  const optionsHtml = staffMembers.map(s => `
    <option value="${s._id}">${s.name} (${s.department || 'Staff'})</option>
  `).join('');

  if (modalSelect) {
    modalSelect.innerHTML = '<option value="">-- Choose Staff Member --</option>' + optionsHtml;
  }
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="all">All Staff</option>' + optionsHtml;
  }
}

async function fetchAdminComplaints() {
  try {
    const status = document.getElementById('filterStatus')?.value || 'all';
    const category = document.getElementById('filterCategory')?.value || 'all';
    const priority = document.getElementById('filterPriority')?.value || 'all';
    const search = document.getElementById('searchQuery')?.value || '';

    let url = `/api/complaints?status=${status}&category=${category}&priority=${priority}&search=${encodeURIComponent(search)}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const result = await res.json();

    if (result.success && result.data) {
      allAdminComplaints = result.data;
      renderAdminComplaintsTable(allAdminComplaints);
    }
  } catch (err) {
    console.error('Error fetching admin complaints:', err);
  }
}

function renderAdminComplaintsTable(complaints) {
  const tbody = document.getElementById('adminComplaintsTableBody');
  const emptyState = document.getElementById('adminEmptyState');
  if (!tbody) return;

  if (complaints.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');

  tbody.innerHTML = complaints.map(c => {
    const reporterName = c.reporter ? `${c.reporter.name} (${c.reporterType})` : `Guest: ${c.guestContact?.name || 'Anonymous'}`;
    const staffName = c.assignedStaff ? c.assignedStaff.name : '<span class="text-danger fw-semibold"><i class="bi bi-exclamation-circle me-1"></i>Unassigned</span>';
    const participantsCount = (c.participants || []).length;
    const dateFormatted = new Date(c.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <tr>
        <td class="fw-bold text-primary font-monospace">
          <a href="/complaint-details.html?id=${c.complaintId}" class="text-decoration-none">${c.complaintId}</a>
        </td>
        <td>
          <div class="fw-semibold text-dark">${c.title}</div>
          <div class="small text-muted">${c.building} ${c.floor ? '• Fl ' + c.floor : ''} (${c.location})</div>
          ${participantsCount > 0 ? `<span class="badge bg-info text-dark small mt-1"><i class="bi bi-people-fill me-1"></i>+${participantsCount} affected students</span>` : ''}
        </td>
        <td><span class="badge bg-light text-dark border">${c.category}</span></td>
        <td>
          <select class="form-select form-select-sm badge-priority badge-priority-${c.priority} border-0" onchange="changePriority('${c.complaintId}', this.value)" style="width: 105px;">
            <option value="low" ${c.priority === 'low' ? 'selected' : ''}>LOW</option>
            <option value="medium" ${c.priority === 'medium' ? 'selected' : ''}>MEDIUM</option>
            <option value="high" ${c.priority === 'high' ? 'selected' : ''}>HIGH</option>
            <option value="critical" ${c.priority === 'critical' ? 'selected' : ''}>CRITICAL</option>
          </select>
        </td>
        <td>
          <span class="badge badge-status badge-${c.status}">
            ● ${c.status.replace('_', ' ')}
          </span>
        </td>
        <td class="small">${staffName}</td>
        <td class="small text-muted">${reporterName}</td>
        <td class="small text-muted">${dateFormatted}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" title="Assign Staff" onclick="openAssignModal('${c.complaintId}', '${escapeQuote(c.title)}', '${c.assignedStaff?._id || ''}')">
              <i class="bi bi-person-plus"></i>
            </button>
            <a href="/complaint-details.html?id=${c.complaintId}" class="btn btn-outline-secondary" title="View Full Details">
              <i class="bi bi-eye"></i>
            </a>
            <button class="btn btn-outline-danger" title="Delete" onclick="deleteComplaintAdmin('${c.complaintId}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Open Assign Staff Modal
function openAssignModal(complaintId, title, currentStaffId = '') {
  selectedAdminComplaintId = complaintId;
  const modalEl = document.getElementById('assignModal');
  if (!modalEl) return;

  document.getElementById('assignComplaintIdText').textContent = complaintId;
  document.getElementById('assignComplaintTitleText').textContent = title;

  const select = document.getElementById('assignStaffSelect');
  if (select) select.value = currentStaffId || '';

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

// Execute Staff Assignment
async function submitAssignStaff() {
  if (!selectedAdminComplaintId) return;

  const staffId = document.getElementById('assignStaffSelect')?.value;
  if (!staffId) {
    showToast('Please select a staff member', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/complaints/${selectedAdminComplaintId}/assign`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ staffId })
    });

    const result = await res.json();

    if (result.success) {
      showToast('Staff assigned successfully!', 'success');
      const modalEl = document.getElementById('assignModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      fetchAdminMetrics();
      fetchAdminComplaints();
    } else {
      showToast(result.message || 'Error assigning staff', 'error');
    }
  } catch (err) {
    console.error('Assign error:', err);
    showToast('Failed to assign staff', 'error');
  }
}

// Change Priority Inline
async function changePriority(complaintId, newPriority) {
  try {
    const res = await fetch(`/api/admin/complaints/${complaintId}/priority`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ priority: newPriority })
    });

    const result = await res.json();
    if (result.success) {
      showToast(`Priority updated to ${newPriority.toUpperCase()}`, 'success');
      fetchAdminComplaints();
    } else {
      showToast(result.message || 'Error updating priority', 'error');
    }
  } catch (err) {
    console.error('Priority error:', err);
  }
}

// Delete Complaint Admin
async function deleteComplaintAdmin(complaintId) {
  if (!confirm(`Are you sure you want to permanently delete complaint ${complaintId}?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/complaints/${complaintId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });

    const result = await res.json();
    if (result.success) {
      showToast('Complaint deleted', 'info');
      fetchAdminMetrics();
      fetchAdminComplaints();
    } else {
      showToast(result.message || 'Error deleting complaint', 'error');
    }
  } catch (err) {
    console.error('Delete error:', err);
  }
}

// Open Category Management Modal
function openCategoryModal() {
  loadAdminCategories();
  const modalEl = document.getElementById('categoryModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

// Category Management
async function loadAdminCategories() {
  const container = document.getElementById('adminCategoryList');
  if (!container) return;

  try {
    const res = await fetch('/api/categories/all', {
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const result = await res.json();

    if (result.success && result.data && result.data.length > 0) {
      container.innerHTML = result.data.map(cat => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>${cat.name}</strong>
            <div class="small text-muted">${cat.description || 'No description'}</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge ${cat.active ? 'bg-success' : 'bg-secondary'}">${cat.active ? 'Active' : 'Disabled'}</span>
            <button class="btn btn-outline-danger btn-sm py-0 px-2" onclick="deleteCategoryAdmin('${cat._id}')" title="Delete Category"><i class="bi bi-trash"></i></button>
          </div>
        </li>
      `).join('');
    } else {
      container.innerHTML = '<li class="list-group-item text-muted">No custom categories registered. Standard system categories are active.</li>';
    }
  } catch (err) {
    console.error('Error loading categories:', err);
    container.innerHTML = '<li class="list-group-item text-muted">Unable to load categories. Please check connection.</li>';
  }
}

async function handleAddCategory(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.categoryName.value.trim();
  const description = form.categoryDesc.value.trim();

  if (!name) return;

  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, description })
    });

    const result = await res.json();
    if (result.success) {
      showToast('Category created successfully!', 'success');
      form.reset();
      loadAdminCategories();
      loadCategories('filterCategory');
    } else {
      showToast(result.message || 'Error creating category', 'error');
    }
  } catch (err) {
    console.error('Add category error:', err);
  }
}

async function deleteCategoryAdmin(categoryId) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  try {
    const res = await fetch(`/api/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const result = await res.json();
    if (result.success) {
      showToast('Category deleted', 'info');
      loadAdminCategories();
      loadCategories('filterCategory');
    } else {
      showToast(result.message || 'Could not delete category', 'error');
    }
  } catch (err) {
    showToast('Failed to delete category', 'error');
  }
}

function escapeQuote(str) {
  return (str || '').replace(/['"]/g, '');
}

// Real-time update hook
if (typeof Realtime !== 'undefined') {
  Realtime.onUpdate(() => {
    fetchAdminMetrics();
    fetchAdminComplaints();
  });
}
