/**
 * Complaint Submission, Duplicate Detection, and Category Loading Logic
 */

let duplicateModalInstance = null;
let currentPendingSubmission = null;

const DEFAULT_CATEGORIES = [
  'Water',
  'Electricity',
  'Wi-Fi / Internet',
  'Hostel',
  'Mess / Food',
  'Washroom',
  'Classroom',
  'Furniture',
  'Library',
  'Transport',
  'Cleanliness',
  'Maintenance',
  'Security',
  'Other'
];

// Initialize categories dropdown with immediate fallback & dynamic fetch
async function loadCategories(selectElementId = 'category') {
  const select = document.getElementById(selectElementId);
  if (!select) return;

  // Immediately populate with standard default categories so UI is never empty/stuck
  const isFilter = selectElementId.includes('filter');
  const defaultOption = isFilter ? '<option value="all">All Categories</option>' : '<option value="">-- Select Category --</option>';
  
  select.innerHTML = defaultOption + DEFAULT_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('');

  try {
    const res = await fetch('/api/categories');
    const result = await res.json();

    if (result.success && result.data && result.data.length > 0) {
      select.innerHTML = defaultOption;
      result.data.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.warn('Using default category list due to API fetch delay:', err);
  }
}

// Handle Complaint Form Submission with Pre-flight Duplicate Check
async function handleComplaintSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const formData = new FormData(form);
  const category = formData.get('category');
  const building = formData.get('building');
  const block = formData.get('block');
  const floor = formData.get('floor');
  const location = formData.get('location');

  if (!category || !building || !location) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  // Disable button while checking
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Checking for duplicates...';
  }

  try {
    // Step 1: Pre-flight check for duplicate active complaint
    const duplicateRes = await fetch('/api/complaints/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, building, block, floor, location })
    });
    const dupResult = await duplicateRes.json();

    if (dupResult.success && dupResult.duplicate && dupResult.existingComplaint) {
      // Duplicate detected! Show modal to user to choose
      currentPendingSubmission = formData;
      showDuplicateModal(dupResult.existingComplaint);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-send me-1"></i> Submit Complaint';
      }
      return;
    }

    // Step 2: No duplicate, submit directly
    await executeSubmission(formData, submitBtn);
  } catch (err) {
    console.error('Submission error:', err);
    // If check fails, still allow user to submit
    await executeSubmission(formData, submitBtn);
  }
}

// Show Duplicate Detected Modal
function showDuplicateModal(existing) {
  const modalEl = document.getElementById('duplicateModal');
  if (!modalEl) return;

  document.getElementById('dupComplaintId').textContent = existing.complaintId;
  document.getElementById('dupTitle').textContent = existing.title;
  document.getElementById('dupCategory').textContent = existing.category;
  document.getElementById('dupLocation').textContent = `${existing.building}${existing.floor ? ' - Floor ' + existing.floor : ''} (${existing.location})`;
  document.getElementById('dupStatus').textContent = (existing.status || '').toUpperCase();
  document.getElementById('dupParticipants').textContent = existing.participantCount || 1;

  const joinBtn = document.getElementById('btnJoinExisting');
  if (joinBtn) {
    joinBtn.onclick = () => joinExistingComplaint(existing._id || existing.complaintId);
  }

  const proceedBtn = document.getElementById('btnProceedAnyway');
  if (proceedBtn) {
    proceedBtn.onclick = () => {
      if (duplicateModalInstance) duplicateModalInstance.hide();
      if (currentPendingSubmission) {
        executeSubmission(currentPendingSubmission);
      }
    };
  }

  duplicateModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
  duplicateModalInstance.show();
}

// Join existing complaint
async function joinExistingComplaint(complaintId) {
  if (!Auth.isLoggedIn()) {
    alert('Please log in with your Student account to join this existing complaint and track updates.');
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  try {
    const res = await fetch(`/api/complaints/${complaintId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await res.json();

    if (result.success) {
      if (duplicateModalInstance) duplicateModalInstance.hide();
      showToast('Successfully joined existing complaint!', 'success');
      setTimeout(() => {
        window.location.href = `/complaint-details.html?id=${result.data.complaintId}`;
      }, 1200);
    } else {
      showToast(result.message || 'Could not join complaint.', 'error');
    }
  } catch (err) {
    console.error('Join error:', err);
    showToast('Failed to join complaint.', 'error');
  }
}

// Execute Final Submission
async function executeSubmission(formData, submitBtn = null) {
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';
  }

  const headers = {};
  if (Auth.isLoggedIn()) {
    headers['Authorization'] = `Bearer ${Auth.getToken()}`;
  }

  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: headers,
      body: formData
    });

    const result = await res.json();

    if (result.success) {
      showToast('Complaint submitted successfully!', 'success');
      showSuccessModal(result.data);
    } else {
      showToast(result.message || 'Error submitting complaint', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-send me-1"></i> Submit Complaint';
      }
    }
  } catch (err) {
    console.error('Submit error:', err);
    showToast('Error connecting to server.', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-send me-1"></i> Submit Complaint';
    }
  }
}

// Display Success Modal with Complaint ID
function showSuccessModal(data) {
  const modalEl = document.getElementById('successModal');
  if (modalEl) {
    document.getElementById('successComplaintId').textContent = data.complaintId;
    const trackBtn = document.getElementById('btnTrackSubmitted');
    if (trackBtn) {
      trackBtn.href = `/track.html?id=${data.complaintId}`;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: 'static', keyboard: false });
    modal.show();
  } else {
    alert(`Complaint submitted successfully!\nYour Complaint ID: ${data.complaintId}\nPlease save this ID to track your status.`);
    window.location.href = `/track.html?id=${data.complaintId}`;
  }
}
