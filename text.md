# SPECIFICATION — College Complaint Management System

## 1. Project Title

**College Complaint Management System**

Build a complete, responsive, role-based college complaint management web application where students and guests can report college-related problems, track complaints in real time, and verify whether the issue was actually resolved.

Core lifecycle:

**Report → Duplicate Detection → Assign → In Progress → Resolve → Resolution Proof → Student Verification → Close / Reopen**

---

# 2. Main Objective

Create a simple, clean and professional complaint management platform for a college.

The system should solve these problems:

- Students do not know where to report problems.
- Multiple students report the same issue repeatedly.
- Students cannot see the current status of their complaint.
- Staff may mark complaints as resolved without proper proof.
- Students have no way to verify the resolution.
- Admins cannot easily track pending and unresolved complaints.

The application must provide transparency throughout the complaint lifecycle.

---

# 3. Technology Stack

## Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap 5 OR simple custom CSS
- Fetch API

Do not use React, Angular or Vue.

Keep the frontend simple and beginner-friendly.

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Authentication

- JWT
- bcrypt

Use role-based authentication.

## Real-time Updates

- Socket.IO

Use Socket.IO for live complaint status updates and notifications.

## File Upload

- Multer for multipart/form-data
- Cloudinary for storing resolution proof images/videos

## Location

Do NOT implement Google Maps initially.

Phase 1 location fields:

- Building
- Block
- Floor
- Room / Area
- Location description

Google Maps will be added later.

---

# 4. User Roles

## 4.1 Guest

Guest does not need an account.

Can:

- Submit a complaint
- Enter complaint details
- Upload an optional image
- Receive a unique Complaint ID
- Track complaint status using Complaint ID

Cannot:

- Access student dashboard
- View private student information
- Modify another user's complaint
- Verify complaints

---

## 4.2 Student

Student must login.

Can:

- Submit complaints
- View own complaints
- Track complaint status
- View complaint details
- View resolution proof
- Verify resolved complaints
- Reject a resolution
- Reopen a complaint
- Join an existing duplicate complaint
- View complaint history

---

## 4.3 Staff

Staff must login.

Can:

- View complaints assigned to them
- Accept/handle assigned complaints
- Change status
- Add progress information
- Upload resolution proof
- Mark complaint as resolved

Cannot:

- Delete complaints
- Manage users
- Change system settings
- Close a complaint without student verification

---

## 4.4 Admin

Admin has full access.

Can:

- View all complaints
- View all users
- View all staff
- Assign complaints
- Change complaint priority
- Change status
- View dashboard statistics
- Manage categories
- View duplicate complaints
- Monitor pending complaints
- View complaint history
- Reassign complaints

---

# 5. Complaint Lifecycle

Every complaint should follow:

```text
REPORTED
    ↓
ASSIGNED
    ↓
IN_PROGRESS
    ↓
RESOLVED
    ↓
STUDENT_VERIFICATION
    ↓
VERIFIED / CLOSED
```

If the student rejects the resolution:

```text
RESOLVED
    ↓
STUDENT REJECTS
    ↓
REOPENED
    ↓
IN_PROGRESS
```

Maintain a complete status history.

---

# 6. Complaint Categories

Create predefined categories:

- Water
- Electricity
- Wi-Fi / Internet
- Hostel
- Mess / Food
- Washroom
- Classroom
- Furniture
- Library
- Transport
- Cleanliness
- Maintenance
- Security
- Other

Admin should be able to manage categories later.

---

# 7. Complaint Fields

Each complaint should contain:

```text
Complaint ID
Title
Description
Category
Priority
Building
Block
Floor
Room / Area
Location Description
Image / Attachment
Reporter Type
Reporter ID (if student)
Guest Contact (if required)
Status
Assigned Staff
Participants
Resolution Description
Resolution Proof
Created Date
Updated Date
Resolved Date
Verified Date
Closed Date
```

---

# 8. Complaint ID

Every complaint must receive a unique human-readable ID.

Examples:

```text
CMP-2026-00001
CMP-2026-00002
CMP-2026-00003
```

The Complaint ID must be unique.

Guests must receive the Complaint ID after submission.

---

# 9. Duplicate Complaint Detection

This is one of the most important features.

Before creating a new complaint, check whether an active similar complaint already exists.

Initially use rule-based duplicate detection.

Compare:

```text
Category
+
Building
+
Block
+
Floor
+
Location
+
Active Status
```

Active statuses:

```text
reported
assigned
in_progress
reopened
```

Example existing complaint:

```text
CMP-2026-00120

Category: Water
Building: C Block
Floor: 2
Location: Near Room 204
Status: In Progress
```

New complaint:

```text
Category: Water
Building: C Block
Floor: 2
Location: Near Room 204
```

Display:

```text
⚠ Similar complaint already exists.

Complaint ID: CMP-2026-00120
Category: Water
Location: C Block - 2nd Floor

[Join Existing Complaint]
[Submit New Complaint]
```

Do not automatically delete the new complaint.

Let the user choose.

---

# 10. Joining an Existing Complaint

If a student finds an existing complaint for the same issue, they can select:

**Join Existing Complaint**

Add the student as an affected/reporter participant.

Maintain a `participants` array/reference.

Prevent the same student from joining the same complaint multiple times.

Example:

```text
CMP-2026-00120
Water problem — C Block

Affected Students: 37
```

---

# 11. Live Complaint Status

The student dashboard must display a visual progress tracker.

Example:

```text
✓ Reported
   ↓
✓ Assigned
   ↓
● In Progress
   ↓
○ Resolved
   ↓
○ Verified
```

When staff/admin changes the status, update the student dashboard in real time using Socket.IO.

No page refresh should be required.

---

# 12. Resolution Proof

A complaint cannot simply be marked as resolved without evidence.

When staff resolves a complaint, they must provide:

```text
Resolution Description
Resolution Proof
```

Proof may be:

- Image
- Video
- Document

Example:

```text
Resolution:
"Broken fan replaced with a new fan."

Proof:
resolution-image.jpg
```

Store the proof URL/path in the database.

---

# 13. Student Verification

After staff marks a complaint as resolved:

```text
Status = RESOLVED
```

Student sees:

```text
Was your problem actually solved?

[Yes, Problem Solved]
[No, Still Exists]
```

### If Yes

```text
RESOLVED
   ↓
VERIFIED
   ↓
CLOSED
```

### If No

Require a reason:

```text
Problem still exists
```

Then:

```text
RESOLVED
   ↓
REOPENED
   ↓
IN_PROGRESS
```

This prevents false resolution.

---

# 14. Authentication APIs

Implement:

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Passwords must never be stored as plain text.

Use bcrypt.

Use JWT for authentication.

Middleware:

```text
requireAuth
requireStudent
requireStaff
requireAdmin
```

---

# 15. Complaint APIs

## Create Complaint

```http
POST /api/complaints
```

Request:

```json
{
  "title": "Water leakage",
  "description": "Water is leaking near the washroom",
  "category": "Water",
  "building": "C Block",
  "block": "C",
  "floor": "2",
  "location": "Near Room 204",
  "priority": "medium"
}
```

Response:

```json
{
  "complaintId": "CMP-2026-00124",
  "status": "reported",
  "message": "Complaint submitted successfully"
}
```

## Get Complaints

```http
GET /api/complaints
```

Support filters:

```text
status
category
priority
building
assignedStaff
date
```

## Get Single Complaint

```http
GET /api/complaints/:id
```

## Update Complaint

```http
PATCH /api/complaints/:id
```

Only authorized users can update appropriate fields.

## Delete Complaint

```http
DELETE /api/complaints/:id
```

Only Admin should be able to delete if deletion is required.

Prefer soft-delete instead of permanent deletion.

---

# 16. Duplicate Detection API

```http
POST /api/complaints/check-duplicate
```

Request:

```json
{
  "category": "Water",
  "building": "C Block",
  "block": "C",
  "floor": "2",
  "location": "Near Room 204"
}
```

Response when duplicate exists:

```json
{
  "duplicate": true,
  "existingComplaint": {
    "complaintId": "CMP-2026-00120",
    "category": "Water",
    "location": "C Block - 2nd Floor",
    "status": "in_progress"
  }
}
```

No duplicate:

```json
{
  "duplicate": false
}
```

---

# 17. Join Complaint API

```http
POST /api/complaints/:id/join
```

Authenticated students can join an existing complaint.

Prevent duplicate participation.

---

# 18. Assignment API

Admin can assign a complaint:

```http
PATCH /api/complaints/:id/assign
```

Request:

```json
{
  "staffId": "STAFF-102"
}
```

Status should change:

```text
REPORTED → ASSIGNED
```

---

# 19. Status API

```http
PATCH /api/complaints/:id/status
```

Request:

```json
{
  "status": "in_progress"
}
```

Allowed statuses:

```text
reported
assigned
in_progress
resolved
reopened
verified
closed
```

Validate status transitions on the backend.

Do not allow arbitrary invalid transitions.

---

# 20. Resolution Proof API

```http
POST /api/complaints/:id/proof
```

Use `multipart/form-data`.

Fields:

```text
resolutionDescription
proofFile
```

Only assigned staff/admin can upload resolution proof.

After successful resolution:

```text
status = resolved
```

---

# 21. Student Verification API

```http
POST /api/complaints/:id/verify
```

Success:

```json
{
  "verified": true
}
```

Rejected:

```json
{
  "verified": false,
  "reason": "Problem still exists"
}
```

If verified:

```text
resolved → verified → closed
```

If rejected:

```text
resolved → reopened
```

---

# 22. Admin APIs

Implement:

```http
GET /api/admin/dashboard
GET /api/admin/complaints
GET /api/admin/users
GET /api/admin/staff
GET /api/admin/categories

PATCH /api/admin/complaints/:id/priority
PATCH /api/admin/complaints/:id/assign
```

Dashboard response:

```json
{
  "total": 248,
  "reported": 32,
  "assigned": 18,
  "inProgress": 41,
  "resolved": 27,
  "closed": 130,
  "reopened": 5,
  "duplicatesAvoided": 76
}
```

---

# 23. Guest Tracking API

Guest should be able to track without logging in.

Implement:

```http
GET /api/complaints/track/:complaintId
```

For security, consider adding a tracking token along with Complaint ID.

Do not expose private student information.

Return only:

```text
Complaint ID
Title
Category
Location
Status
Status History
Created Date
Updated Date
Resolution Information
```

---

# 24. Socket.IO Events

Implement:

```text
complaint:created
complaint:assigned
complaint:statusUpdated
complaint:resolved
complaint:reopened
complaint:verified
complaint:closed
```

When status changes:

```text
Backend
   ↓
Socket.IO
   ↓
Student Dashboard
```

Student should see the updated status immediately.

---

# 25. Database Models

## User

```text
User
- name
- email
- password
- role
- studentId
- department
- year
- createdAt
```

Roles:

```text
student
staff
admin
```

## Complaint

```text
Complaint
- complaintId
- title
- description
- category
- priority
- building
- block
- floor
- location
- attachments
- reporterType
- reporter
- participants
- assignedStaff
- status
- resolutionDescription
- resolutionProof
- createdAt
- updatedAt
- resolvedAt
- verifiedAt
- closedAt
```

## StatusHistory

```text
StatusHistory
- complaint
- oldStatus
- newStatus
- changedBy
- note
- timestamp
```

Every status change must be recorded.

## Category

```text
Category
- name
- description
- active
- createdAt
```

---

# 26. Frontend Pages

## Public Pages

### Home

```text
College Complaint Management System

Report college problems.
Track complaints.
Verify resolutions.

[Report Complaint]
[Track Complaint]
[Student Login]
```

### Guest Complaint Page

Fields:

```text
Title
Description
Category
Building
Block
Floor
Room / Area
Location
Photo
```

Button:

```text
Submit Complaint
```

After submission:

```text
Complaint Submitted Successfully!

Complaint ID:
CMP-2026-00124

[Track Complaint]
```

### Track Complaint Page

Input:

```text
Complaint ID
```

Display:

```text
Complaint Details
Current Status
Status Timeline
Resolution Proof
```

---

# 27. Student UI

## Student Dashboard

Show:

```text
Welcome, Student

Total Complaints
Active Complaints
Resolved Complaints
Pending Verification
```

Complaint cards/table:

```text
Complaint ID
Title
Category
Location
Status
Created Date

[View Details]
```

## Complaint Details

Display:

```text
Complaint ID
Title
Description
Category
Location
Priority
Created Date
Assigned Staff
Status Timeline
Resolution Proof
```

If resolved:

```text
Was your problem actually solved?

[Yes, Problem Solved]
[No, Still Exists]
```

---

# 28. Staff Dashboard

Show:

```text
Assigned Complaints
Pending
In Progress
Resolved
```

Complaint list:

```text
Complaint ID
Title
Location
Priority
Status

[View]
```

Complaint detail:

```text
[Start Work]
[Update Status]
[Upload Resolution Proof]
[Mark Resolved]
```

---

# 29. Admin Dashboard

Create a simple professional dashboard.

Show:

```text
Total Complaints
Reported
Assigned
In Progress
Resolved
Closed
Reopened
Duplicates Avoided
```

Filters:

```text
Category
Status
Priority
Building
Staff
```

Complaint table:

```text
ID
Title
Category
Location
Priority
Status
Assigned Staff
Created Date
Action
```

Admin actions:

```text
View
Assign
Change Priority
Change Status
```

---

# 30. UI Design

Keep the UI simple and professional.

Requirements:

- Responsive
- Mobile friendly
- Clean cards
- Simple navigation
- Clear status badges
- Accessible buttons
- Consistent spacing
- No unnecessary animations
- Easy for college students to understand

Suggested status styles:

```text
Reported      → yellow
Assigned      → blue
In Progress   → orange
Resolved      → green
Reopened      → red
Closed        → neutral
```

---

# 31. Navigation

## Guest

```text
Home
Report Complaint
Track Complaint
Login
```

## Student

```text
Dashboard
My Complaints
Report Complaint
Notifications
Profile
Logout
```

## Staff

```text
Dashboard
Assigned Complaints
Profile
Logout
```

## Admin

```text
Dashboard
Complaints
Staff
Students
Categories
Reports
Logout
```

---

# 32. Validation

Frontend and backend validation are mandatory.

Validate:

- Required fields
- Email format
- Password length
- Complaint title
- Description
- Category
- Location
- File type
- File size

Never trust frontend validation alone.

Backend must validate everything again.

---

# 33. Security

Implement:

- Password hashing
- JWT authentication
- Role-based authorization
- Protected routes
- Input validation
- File type validation
- File size limits
- CORS configuration
- Environment variables
- Do not expose passwords
- Do not expose private student information
- Prevent unauthorized complaint modification

Use `.env` for:

```text
MONGODB_URI
JWT_SECRET
PORT
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Never hardcode secrets.

---

# 34. Error Handling

Use proper HTTP status codes:

```text
200 → Success
201 → Created
400 → Bad Request
401 → Unauthorized
403 → Forbidden
404 → Not Found
409 → Conflict
500 → Server Error
```

Consistent response:

```json
{
  "success": false,
  "message": "Complaint not found"
}
```

---

# 35. API Response Format

Success:

```json
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Invalid complaint data"
}
```

---

# 36. Project Folder Structure

```text
college-complaint-system/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── report.html
│   ├── track.html
│   ├── student-dashboard.html
│   ├── complaint-details.html
│   ├── staff-dashboard.html
│   ├── admin-dashboard.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── auth.js
│       ├── complaint.js
│       ├── student.js
│       ├── staff.js
│       ├── admin.js
│       └── socket.js
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Complaint.js
│   │   ├── StatusHistory.js
│   │   └── Category.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── adminRoutes.js
│   │   └── categoryRoutes.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── complaintController.js
│   │   └── adminController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── services/
│   │   ├── duplicateService.js
│   │   └── notificationService.js
│   │
│   ├── sockets/
│   │   └── complaintSocket.js
│   │
│   ├── uploads/
│   │
│   ├── server.js
│   └── .env
│
├── package.json
└── README.md
```

---

# 37. Development Phases

## Phase 1 — Authentication

Implement:

- Project setup
- MongoDB connection
- User model
- Registration
- Login
- JWT
- Role-based access

## Phase 2 — Complaints

Implement:

- Complaint model
- Guest complaint submission
- Student complaint submission
- Complaint ID
- Complaint listing
- Complaint details

## Phase 3 — Duplicate Detection

Implement:

- Duplicate detection
- Join existing complaint
- Location-based duplicate rules

## Phase 4 — Assignment & Status

Implement:

- Admin dashboard
- Staff dashboard
- Complaint assignment
- Status management

## Phase 5 — Resolution

Implement:

- Resolution proof upload
- Student verification
- Reopen complaint

## Phase 6 — Real-time

Implement:

- Socket.IO
- Real-time status updates
- Notifications

## Phase 7 — Analytics & Polish

Implement:

- Dashboard statistics
- Filters
- Search
- UI improvements
- Error handling
- Security improvements

## Phase 8 — Future Location

Add:

- Google Maps
- Latitude/longitude
- Nearby complaint detection
- Map-based complaint visualization

Do not implement Google Maps in the first version.

---

# 38. Future AI Features

AI is not mandatory for the core system.

Possible future features:

## AI Duplicate Detection

Compare complaint descriptions using embeddings/semantic similarity.

Example:

```text
"Water is leaking near C block washroom"

and

"Water pipe leakage beside C block toilet"
```

System can identify them as semantically similar.

## AI Priority Prediction

Automatically classify:

```text
Low
Medium
High
Critical
```

## RAG Help Chatbot

Students can ask:

```text
How can I report a hostel issue?
Who handles Wi-Fi complaints?
How do I verify a resolved complaint?
```

The RAG chatbot can answer using college rules and complaint procedures.

---

# 39. Important Business Rules

1. Guest does not require login.
2. Student must login for student-specific features.
3. Staff can only manage assigned complaints unless admin grants additional permission.
4. Admin has full access.
5. Duplicate detection must happen before creating a complaint.
6. User must be allowed to join an existing complaint.
7. A complaint cannot be closed directly by staff.
8. Staff must upload resolution proof before marking it resolved.
9. Student must verify the resolution before closure.
10. Student can reject a resolution and reopen the complaint.
11. Every status change must be stored in StatusHistory.
12. Status transitions must be validated by backend.
13. Guest tracking must not expose private information.
14. Google Maps must remain a future feature.
15. Do not add AI/RAG to the core version unless explicitly requested.

---

# 40. Expected Final User Experience

```text
Open Website
      ↓
Login / Continue as Guest
      ↓
Report Complaint
      ↓
Enter Location + Category
      ↓
System checks duplicate
      ↓
Existing complaint found?
     ↙        ↘
   YES         NO
    ↓           ↓
Join Existing  Create New
      ↓           ↓
      └─────┬─────┘
            ↓
         REPORTED
            ↓
         ASSIGNED
            ↓
       IN_PROGRESS
            ↓
          RESOLVED
            ↓
     Resolution Proof
            ↓
    Student Verification
       ↙           ↘
     YES            NO
      ↓              ↓
   CLOSED         REOPENED
```

---

# 41. Final Requirements

Build the project as a working full-stack application, not just static UI.

The frontend must communicate with the Express backend using REST APIs.

The backend must communicate with MongoDB using Mongoose.

Authentication and authorization must work.

Complaint status must work.

Duplicate detection must work.

Guest tracking must work.

Staff assignment must work.

Resolution proof upload must work.

Student verification and reopening must work.

Socket.IO real-time updates must work.

The UI must be responsive and simple.

Keep the implementation understandable for a student developer.

Do not over-engineer the system.

Do not add unnecessary libraries.

Do not implement Google Maps yet.

Do not add AI/RAG to the core version.

At the end, provide:

1. Complete project structure
2. Setup instructions
3. Environment variable example
4. MongoDB setup instructions
5. API documentation
6. Test accounts for Student, Staff and Admin
7. Instructions to run frontend and backend
8. README.md
9. Sample seed data
10. Basic API testing examples

The final application should be suitable for a college mini-project/demo and clearly demonstrate the complete complaint lifecycle and transparency of resolution.
