# College Complaint Management System

A full-stack, role-based web application built with **Node.js, Express, MongoDB, Socket.IO, and Vanilla JavaScript (Bootstrap 5)** for reporting, managing, tracking, and verifying campus maintenance and facility issues in real-time.

---

## 🌟 Core Pillars & Unique Features

1. **Smart Duplicate Complaint Detection**:
   - Before a complaint is registered, the system cross-checks active tickets in the same category, building, floor, and location.
   - If a match is found, students can **Join the Existing Ticket** with one click (adding them to affected participants) instead of creating redundant tickets for staff.
2. **Mandatory Resolution Proof**:
   - Staff cannot mark a complaint as resolved without providing a detailed resolution description and uploading proof (photo/document/receipt).
3. **Student Verification Gate**:
   - Marking an issue resolved changes the status to `RESOLVED`, but does **not** close the ticket.
   - The student reporter must verify:
     - **Yes, Solved**: Transitions ticket to `VERIFIED` & `CLOSED`.
     - **No, Still Exists**: Reopens ticket to `REOPENED` / `IN_PROGRESS` with an explicit reason logged in the audit trail.
4. **Real-time Live Updates (Socket.IO)**:
   - Live status changes and notifications sync across dashboards without needing full page refreshes.
5. **Role-Based Portals**:
   - **Guest**: Instant reporting and public tracking via unique human-readable ID (`CMP-YYYY-XXXXX`).
   - **Student**: Dashboard, my tickets, joined tickets, verification actions, and status timelines.
   - **Staff**: Assigned tasks, work status changer, and resolution proof uploader.
   - **Admin**: System-wide dashboard, duplicate avoidance metrics, staff assigner, priority manager, and category manager.
6. **Zero-Friction Startup (Automatic Embedded MongoDB)**:
   - If you don't have MongoDB installed or running locally, the server **automatically starts an in-memory MongoDB database and auto-seeds all test accounts and sample complaints**. You can log in and test everything immediately!

---

## 📁 Project Structure

```text
mini/
├── backend/
│   ├── config/
│   │   └── db.js                  # Mongoose MongoDB connection with auto-fallback
│   ├── controllers/
│   │   ├── adminController.js     # Admin dashboard & analytics
│   │   ├── authController.js      # JWT Register/Login/Me
│   │   ├── categoryController.js  # Category management
│   │   └── complaintController.js # Complaint lifecycle & verification
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification & optional auth
│   │   ├── roleMiddleware.js      # Student / Staff / Admin guards
│   │   └── uploadMiddleware.js    # Multer file & proof uploads
│   ├── models/
│   │   ├── Category.js            # Complaint category schema
│   │   ├── Complaint.js           # Main complaint schema with custom ID
│   │   ├── StatusHistory.js       # Audit timeline history schema
│   │   └── User.js                # User & authentication schema
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   └── complaintRoutes.js
│   ├── services/
│   │   ├── duplicateService.js    # Rule-based duplicate query matcher
│   │   └── notificationService.js # Socket.IO notification broadcaster
│   ├── sockets/
│   │   └── complaintSocket.js     # Socket.IO connection & room handling
│   ├── uploads/                   # Statically served local upload storage
│   ├── .env.example               # Environment template
│   ├── .env                       # Active environment configuration
│   ├── seed.js                    # Database seeder with demo accounts
│   └── server.js                  # Express HTTP & Socket.IO server
├── frontend/
│   ├── css/
│   │   └── style.css              # Custom stylesheet with status badges
│   ├── js/
│   │   ├── admin.js               # Admin portal scripts
│   │   ├── auth.js                # Auth state & dynamic navbar helper
│   │   ├── complaint.js           # Submission & duplicate detection logic
│   │   ├── socket.js              # Socket.IO client handler
│   │   ├── staff.js               # Staff dashboard scripts
│   │   └── student.js             # Student dashboard scripts
│   ├── admin-dashboard.html       # Admin control center
│   ├── complaint-details.html     # Universal detail & verification page
│   ├── index.html                 # Landing home page
│   ├── login.html                 # Login page with 1-click demo buttons
│   ├── register.html              # Student registration page
│   ├── report.html                # Complaint reporting page
│   ├── staff-dashboard.html       # Staff maintenance tasks portal
│   ├── student-dashboard.html     # Student portal
│   └── track.html                 # Public guest tracking portal
├── package.json
├── text.md                        # Master Specification Sheet
└── README.md
```

---

## 🚀 Step-by-Step Local Setup & Execution Guide

### 1. Open Terminal in Project Directory
```bash
cd c:\Users\ASUS\Documents\mini
```

### 2. Install Dependencies *(if not already done)*
```bash
npm install
```

### 3. Start the Server
```bash
npm start
# OR for live-reload dev mode:
npm run dev
```

> **Note**: The application will connect to your local MongoDB service if running. If MongoDB is not running, it will automatically spin up an embedded in-memory database and auto-populate all demo accounts and complaints.

### 4. Open in Browser
Navigate to 👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Test Credentials (Included in Seeder & 1-Click Login)

The login page at `http://localhost:5000/login.html` features **1-Click Quick Fill** buttons for immediate testing:

| Role | Name | Email | Password | Scope / Department |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Chief Admin | `admin@college.edu` | `Admin@123` | Full access, assign staff, categories, metrics |
| **Staff 1** | Ramesh Kumar | `staff.ramesh@college.edu` | `Staff@123` | Maintenance & Plumbing |
| **Staff 2** | Priya Sharma | `staff.priya@college.edu` | `Staff@123` | Electrical & IT |
| **Student 1**| Alex Mercer | `student.alex@college.edu` | `Student@123` | Computer Science (STU-2024-001) |
| **Student 2**| Sara Khan | `student.sara@college.edu` | `Student@123` | Mechanical Engineering (STU-2024-045) |

---

## 📋 Complete Complaint Lifecycle Flow

```text
1. REPORTED ──────> 2. ASSIGNED ──────> 3. IN_PROGRESS
   (Guest/Student)      (Admin assigns)     (Staff starts work)
                                                   │
                                                   ▼
                                        4. RESOLVED (Proof Uploaded)
                                                   │
                                                   ▼
                                      5. STUDENT VERIFICATION
                                          /               \
                          [Yes, Solved]  /                 \  [No, Still Exists]
                                        ▼                   ▼
                                 6. CLOSED             REOPENED (Back to Staff)
```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new student account.
- `POST /api/auth/login` — Login and receive JWT token.
- `GET /api/auth/me` — Get current authenticated user profile (`Authorization: Bearer <token>`).
- `POST /api/auth/logout` — Logout user session.

### Complaints (`/api/complaints`)
- `POST /api/complaints/check-duplicate` — Check for existing similar active complaint by location and category.
- `POST /api/complaints` — Submit a complaint (`multipart/form-data` with optional attachment).
- `GET /api/complaints` — Query complaints with filters (`status`, `category`, `priority`, `search`, `assignedStaff`).
- `GET /api/complaints/:id` — Get single complaint details with audit timeline.
- `GET /api/complaints/track/:complaintId` — Public tracking endpoint (safe sanitized data).
- `POST /api/complaints/:id/join` — Student joins existing complaint as affected participant.
- `PATCH /api/complaints/:id/assign` — Admin assigns complaint to staff.
- `PATCH /api/complaints/:id/status` — Update complaint status.
- `POST /api/complaints/:id/proof` — Staff uploads resolution proof photo/description and marks `RESOLVED`.
- `POST /api/complaints/:id/verify` — Student verifies resolution (`{ verified: true }` to close or `{ verified: false, reason }` to reopen).
- `DELETE /api/complaints/:id` — Admin delete complaint.

### Admin (`/api/admin`)
- `GET /api/admin/dashboard` — Get dashboard statistics, status counts, and duplicates avoided.
- `GET /api/admin/staff` — List staff members.
- `GET /api/admin/users` — List registered users.
- `PATCH /api/admin/complaints/:id/priority` — Update complaint priority (`low`, `medium`, `high`, `critical`).

### Categories (`/api/categories`)
- `GET /api/categories` — Get active categories.
- `POST /api/categories` — Create category (Admin).
- `PUT /api/categories/:id` — Update category (Admin).
- `DELETE /api/categories/:id` — Delete category (Admin).

---

## 💡 Real-Time Socket.IO Events

- `join:complaint` — Subscribes a client to live updates for a specific complaint ID.
- `join:role` — Subscribes a client to role-specific broadcasts.
- `complaint:created` — Broadcasted when a new complaint is filed.
- `complaint:assigned` — Broadcasted when staff is assigned.
- `complaint:statusUpdated` — Broadcasted when status changes.
- `complaint:resolved` — Broadcasted when staff submits resolution proof.
- `complaint:verified` / `complaint:closed` — Broadcasted when student verifies resolution.
- `complaint:reopened` — Broadcasted when student rejects resolution.

---

## 🧪 Testing the Complete Workflow Locally

1. **Test Duplicate Detection**:
   - Go to `http://localhost:5000/report.html`.
   - Choose Category **Water**, Building **C Block**, Location **Near Room 204**.
   - Click Submit: Notice the modal popping up stating a similar complaint is already active (`CMP-2026-00120`) and offering you to **Join Existing Ticket**.
2. **Test Admin Assignment**:
   - Login as Admin (`admin@college.edu` / `Admin@123`).
   - Go to Admin Dashboard.
   - Click the person icon next to an unassigned complaint to assign it to **Ramesh Kumar**.
3. **Test Staff Resolution with Proof**:
   - Login as Staff (`staff.ramesh@college.edu` / `Staff@123`).
   - Find the assigned complaint on your Staff Dashboard.
   - Click **Resolve with Proof**, describe what was fixed, attach a photo, and submit.
4. **Test Student Verification**:
   - Login as Student (`student.alex@college.edu` / `Student@123`).
   - Go to Student Dashboard -> Notice the **Pending Verification** banner.
   - Click **Verify Resolution** -> Review the proof and click **Yes, Problem Solved** to permanently close the ticket!
