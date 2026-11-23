/**
 * Authentication and Session Management Helper
 */

const API_BASE = '/api';

const Auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  setSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : 'guest';
  },

  logout() {
    this.clearSession();
    window.location.href = '/login.html';
  },

  // Auth Guard for Protected Pages
  guard(allowedRoles = []) {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      alert(`Access denied. Your role '${user.role}' cannot view this page.`);
      if (user.role === 'admin') window.location.href = '/admin-dashboard.html';
      else if (user.role === 'staff') window.location.href = '/staff-dashboard.html';
      else window.location.href = '/student-dashboard.html';
      return false;
    }

    return true;
  },

  // Render Navigation Bar dynamically
  renderNavbar(activePage = '') {
    const navContainer = document.getElementById('navbar-container');
    if (!navContainer) return;

    const user = this.getUser();
    const role = user ? user.role : 'guest';

    let linksHtml = '';

    if (role === 'guest') {
      linksHtml = `
        <li class="nav-item"><a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="/index.html"><i class="bi bi-house me-1"></i>Home</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'report' ? 'active' : ''}" href="/report.html"><i class="bi bi-plus-circle me-1"></i>Report Complaint</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'track' ? 'active' : ''}" href="/track.html"><i class="bi bi-search me-1"></i>Track Complaint</a></li>
        <li class="nav-item ms-lg-3"><a class="btn btn-outline-primary btn-sm me-2" href="/login.html"><i class="bi bi-box-arrow-in-right me-1"></i>Login</a></li>
        <li class="nav-item"><a class="btn btn-primary btn-sm" href="/register.html">Register</a></li>
      `;
    } else if (role === 'student') {
      linksHtml = `
        <li class="nav-item"><a class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" href="/student-dashboard.html"><i class="bi bi-speedometer2 me-1"></i>Dashboard</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'report' ? 'active' : ''}" href="/report.html"><i class="bi bi-plus-circle me-1"></i>New Complaint</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'track' ? 'active' : ''}" href="/track.html"><i class="bi bi-search me-1"></i>Track Status</a></li>
        <li class="nav-item dropdown ms-lg-3">
          <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
            <span class="badge bg-primary me-2">Student</span> ${user.name}
          </a>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm">
            <li><h6 class="dropdown-header">${user.email} (${user.studentId || 'No ID'})</h6></li>
            <li><a class="dropdown-item" href="/student-dashboard.html">My Complaints</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </li>
      `;
    } else if (role === 'staff') {
      linksHtml = `
        <li class="nav-item"><a class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" href="/staff-dashboard.html"><i class="bi bi-tools me-1"></i>Staff Dashboard</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'track' ? 'active' : ''}" href="/track.html"><i class="bi bi-search me-1"></i>Lookup ID</a></li>
        <li class="nav-item dropdown ms-lg-3">
          <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
            <span class="badge bg-warning text-dark me-2">Staff</span> ${user.name}
          </a>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm">
            <li><h6 class="dropdown-header">${user.email} (${user.department || 'Maintenance'})</h6></li>
            <li><a class="dropdown-item" href="/staff-dashboard.html">Assigned Tasks</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </li>
      `;
    } else if (role === 'admin') {
      linksHtml = `
        <li class="nav-item"><a class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" href="/admin-dashboard.html"><i class="bi bi-shield-check me-1"></i>Admin Dashboard</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'report' ? 'active' : ''}" href="/report.html"><i class="bi bi-plus-circle me-1"></i>Log Issue</a></li>
        <li class="nav-item"><a class="nav-link ${activePage === 'track' ? 'active' : ''}" href="/track.html"><i class="bi bi-search me-1"></i>Track</a></li>
        <li class="nav-item dropdown ms-lg-3">
          <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
            <span class="badge bg-danger me-2">Admin</span> ${user.name}
          </a>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm">
            <li><h6 class="dropdown-header">${user.email}</h6></li>
            <li><a class="dropdown-item" href="/admin-dashboard.html">Manage System</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </li>
      `;
    }

    navContainer.innerHTML = `
      <nav class="navbar navbar-expand-lg custom-navbar sticky-top">
        <div class="container">
          <a class="navbar-brand" href="/index.html">
            <i class="bi bi-building-check text-primary fs-4"></i>
            <span>College Complaint Hub</span>
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="mainNav">
            <ul class="navbar-nav ms-auto align-items-center">
              ${linksHtml}
            </ul>
          </div>
        </div>
      </nav>
    `;
  }
};

// Toast notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `custom-toast border-${type === 'error' ? 'danger' : (type === 'success' ? 'success' : 'primary')}`;
  
  const icon = type === 'error' ? 'bi-exclamation-circle-fill text-danger' : 
               (type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-info-circle-fill text-primary');

  toast.innerHTML = `
    <div class="d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <i class="bi ${icon} fs-5"></i>
        <div class="small fw-semibold text-dark">${message}</div>
      </div>
      <button type="button" class="btn-close btn-close-sm ms-2" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4500);
}
