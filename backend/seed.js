const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Category = require('./models/Category');
const Complaint = require('./models/Complaint');
const StatusHistory = require('./models/StatusHistory');

const seedData = async (isStandalone = true) => {
  try {
    if (isStandalone && mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_complaints';
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[Seed] Connected to database: ${mongoUri}`);
    }

    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Complaint.deleteMany();
    await StatusHistory.deleteMany();
    console.log('[Seed] Cleared existing data');

    // 1. Categories
    const categoriesData = [
      { name: 'Water', description: 'Water supply, pipe leakages, drinking coolers, and purifiers' },
      { name: 'Electricity', description: 'Power cuts, broken switches, fan/light issues, and wiring' },
      { name: 'Wi-Fi / Internet', description: 'Hostel and campus Wi-Fi connectivity, LAN ports, speeds' },
      { name: 'Hostel', description: 'Room allotment, hostel maintenance, pest control, hot water' },
      { name: 'Mess / Food', description: 'Canteen and mess quality, hygiene, timings' },
      { name: 'Washroom', description: 'Sanitation, cleanliness, broken taps, flush issues' },
      { name: 'Classroom', description: 'Smart boards, podiums, air conditioning, projector screens' },
      { name: 'Furniture', description: 'Broken chairs, study desks, benches, library racks' },
      { name: 'Library', description: 'Book availability, reading room lights, digital library access' },
      { name: 'Transport', description: 'College buses, shuttle schedules, parking lots' },
      { name: 'Cleanliness', description: 'Campus cleanliness, waste bins, corridor sweeping' },
      { name: 'Maintenance', description: 'Civil repairs, painting, window glass, doors' },
      { name: 'Security', description: 'Campus gates, ID checks, lighting in dark areas' },
      { name: 'Other', description: 'Any miscellaneous issue not listed in other categories' }
    ];

    await Category.insertMany(categoriesData);
    console.log('[Seed] Inserted default categories');

    // 2. Users (Admin, Staff, Students)
    const admin = await User.create({
      name: 'Chief Admin',
      email: 'admin@college.edu',
      password: 'Admin@123',
      role: 'admin',
      department: 'Administration'
    });

    const staff1 = await User.create({
      name: 'Ramesh Kumar (Plumbing & Maintenance)',
      email: 'staff.ramesh@college.edu',
      password: 'Staff@123',
      role: 'staff',
      department: 'Maintenance & Plumbing'
    });

    const staff2 = await User.create({
      name: 'Priya Sharma (Electrical & IT)',
      email: 'staff.priya@college.edu',
      password: 'Staff@123',
      role: 'staff',
      department: 'Electrical & IT'
    });

    const student1 = await User.create({
      name: 'Alex Mercer',
      email: 'student.alex@college.edu',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU-2024-001',
      department: 'Computer Science',
      year: '3rd Year'
    });

    const student2 = await User.create({
      name: 'Sara Khan',
      email: 'student.sara@college.edu',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU-2024-045',
      department: 'Mechanical Engineering',
      year: '2nd Year'
    });

    console.log('[Seed] Created default user accounts:');
    console.log('   - Admin:     admin@college.edu / Admin@123');
    console.log('   - Staff 1:   staff.ramesh@college.edu / Staff@123');
    console.log('   - Staff 2:   staff.priya@college.edu / Staff@123');
    console.log('   - Student 1: student.alex@college.edu / Student@123');
    console.log('   - Student 2: student.sara@college.edu / Student@123');

    // 3. Sample Complaints with Lifecycles
    const year = new Date().getFullYear();

    // Complaint 1: IN_PROGRESS (with duplicate participants)
    const c1 = new Complaint({
      complaintId: `CMP-${year}-00120`,
      title: 'Water leakage near washroom corridor',
      description: 'Major pipe leakage in C Block corridor causing slippery floor and water wastage.',
      category: 'Water',
      priority: 'high',
      building: 'C Block',
      block: 'C',
      floor: '2',
      roomArea: 'Corridor',
      location: 'Near Room 204',
      reporterType: 'student',
      reporter: student1._id,
      participants: [student2._id],
      assignedStaff: staff1._id,
      status: 'in_progress'
    });
    await c1.save();

    await StatusHistory.create([
      {
        complaint: c1._id,
        oldStatus: null,
        newStatus: 'reported',
        changedBy: student1._id,
        changedByName: student1.name,
        changedByRole: 'student',
        note: 'Complaint registered by student',
        timestamp: new Date(Date.now() - 3600000 * 24 * 2)
      },
      {
        complaint: c1._id,
        oldStatus: 'reported',
        newStatus: 'assigned',
        changedBy: admin._id,
        changedByName: admin.name,
        changedByRole: 'admin',
        note: `Assigned to ${staff1.name}`,
        timestamp: new Date(Date.now() - 3600000 * 24 * 1.5)
      },
      {
        complaint: c1._id,
        oldStatus: 'assigned',
        newStatus: 'in_progress',
        changedBy: staff1._id,
        changedByName: staff1.name,
        changedByRole: 'staff',
        note: 'Replacement plumbing valves requested from inventory and work started',
        timestamp: new Date(Date.now() - 3600000 * 20)
      },
      {
        complaint: c1._id,
        oldStatus: 'in_progress',
        newStatus: 'in_progress',
        changedBy: student2._id,
        changedByName: student2.name,
        changedByRole: 'student',
        note: `Student ${student2.name} (${student2.studentId}) joined as affected participant`,
        timestamp: new Date(Date.now() - 3600000 * 10)
      }
    ]);

    // Complaint 2: REPORTED (Guest complaint)
    const c2 = new Complaint({
      complaintId: `CMP-${year}-00121`,
      title: 'Projector not powering on in Seminar Hall',
      description: 'The ceiling HDMI projector power LED is blinking red and fails to boot during morning seminar.',
      category: 'Classroom',
      priority: 'medium',
      building: 'Main Building',
      block: 'A',
      floor: '1',
      roomArea: 'Seminar Hall 101',
      location: 'Podium projector unit',
      reporterType: 'guest',
      guestContact: {
        name: 'Prof. David',
        email: 'david.guest@gmail.com',
        phone: '+91 98765 43210'
      },
      status: 'reported'
    });
    await c2.save();

    await StatusHistory.create({
      complaint: c2._id,
      oldStatus: null,
      newStatus: 'reported',
      changedByName: 'Prof. David (Guest)',
      changedByRole: 'guest',
      note: 'Complaint registered by guest faculty',
      timestamp: new Date(Date.now() - 3600000 * 12)
    });

    // Complaint 3: RESOLVED (Awaiting student verification)
    const c3 = new Complaint({
      complaintId: `CMP-${year}-00122`,
      title: 'Hostel Wi-Fi router rebooting constantly',
      description: 'Wi-Fi access point in 3rd floor west wing goes offline every 10 minutes.',
      category: 'Wi-Fi / Internet',
      priority: 'high',
      building: 'Boys Hostel',
      block: 'West Wing',
      floor: '3',
      roomArea: 'Corridor AP 308',
      location: 'Near Room 310',
      reporterType: 'student',
      reporter: student1._id,
      assignedStaff: staff2._id,
      status: 'resolved',
      resolutionDescription: 'Replaced faulty power adapter and upgraded router firmware to v2.4.1.',
      resolutionProof: '',
      resolvedAt: new Date(Date.now() - 3600000 * 4)
    });
    await c3.save();

    await StatusHistory.create([
      {
        complaint: c3._id,
        oldStatus: null,
        newStatus: 'reported',
        changedBy: student1._id,
        changedByName: student1.name,
        changedByRole: 'student',
        note: 'Complaint registered',
        timestamp: new Date(Date.now() - 3600000 * 30)
      },
      {
        complaint: c3._id,
        oldStatus: 'reported',
        newStatus: 'assigned',
        changedBy: admin._id,
        changedByName: admin.name,
        changedByRole: 'admin',
        note: `Assigned to ${staff2.name}`,
        timestamp: new Date(Date.now() - 3600000 * 20)
      },
      {
        complaint: c3._id,
        oldStatus: 'assigned',
        newStatus: 'in_progress',
        changedBy: staff2._id,
        changedByName: staff2.name,
        changedByRole: 'staff',
        note: 'Diagnosing network router logs',
        timestamp: new Date(Date.now() - 3600000 * 10)
      },
      {
        complaint: c3._id,
        oldStatus: 'in_progress',
        newStatus: 'resolved',
        changedBy: staff2._id,
        changedByName: staff2.name,
        changedByRole: 'staff',
        note: 'Resolution: Replaced faulty power adapter and upgraded router firmware to v2.4.1.',
        timestamp: new Date(Date.now() - 3600000 * 4)
      }
    ]);

    // Complaint 4: CLOSED (Verified by student)
    const c4 = new Complaint({
      complaintId: `CMP-${year}-00123`,
      title: 'Broken desk wooden top in Lab 3',
      description: 'The front bench wooden plank is splintered and loose.',
      category: 'Furniture',
      priority: 'low',
      building: 'Engineering Block',
      block: 'B',
      floor: '3',
      roomArea: 'Lab 304',
      location: 'Row 2 Desk 4',
      reporterType: 'student',
      reporter: student2._id,
      assignedStaff: staff1._id,
      status: 'closed',
      resolutionDescription: 'Replaced wooden desk top with new polished hardwood plank.',
      resolvedAt: new Date(Date.now() - 3600000 * 48),
      verifiedAt: new Date(Date.now() - 3600000 * 24),
      closedAt: new Date(Date.now() - 3600000 * 24)
    });
    await c4.save();

    await StatusHistory.create([
      {
        complaint: c4._id,
        oldStatus: null,
        newStatus: 'reported',
        changedBy: student2._id,
        changedByName: student2.name,
        changedByRole: 'student',
        note: 'Complaint registered',
        timestamp: new Date(Date.now() - 3600000 * 72)
      },
      {
        complaint: c4._id,
        oldStatus: 'reported',
        newStatus: 'assigned',
        changedBy: admin._id,
        changedByName: admin.name,
        changedByRole: 'admin',
        note: `Assigned to ${staff1.name}`,
        timestamp: new Date(Date.now() - 3600000 * 60)
      },
      {
        complaint: c4._id,
        oldStatus: 'assigned',
        newStatus: 'resolved',
        changedBy: staff1._id,
        changedByName: staff1.name,
        changedByRole: 'staff',
        note: 'Replaced wooden desk top with new polished hardwood plank.',
        timestamp: new Date(Date.now() - 3600000 * 48)
      },
      {
        complaint: c4._id,
        oldStatus: 'resolved',
        newStatus: 'closed',
        changedBy: student2._id,
        changedByName: student2.name,
        changedByRole: 'student',
        note: 'Student confirmed resolution: Problem is solved. Complaint closed successfully.',
        timestamp: new Date(Date.now() - 3600000 * 24)
      }
    ]);

    // Complaint 5: REOPENED (Student rejected resolution)
    const c5 = new Complaint({
      complaintId: `CMP-${year}-00124`,
      title: 'Water cooler dispensing warm water in Library',
      description: 'Water cooling compressor in 1st floor reading hall is not cooling water.',
      category: 'Water',
      priority: 'medium',
      building: 'Library Block',
      block: 'Central',
      floor: '1',
      roomArea: 'Reading Hall',
      location: 'Water cooler near stairs',
      reporterType: 'student',
      reporter: student1._id,
      assignedStaff: staff1._id,
      status: 'reopened',
      resolutionDescription: 'Cleaned condenser coils and refilled gas.',
      reopenReason: 'Water is still at ambient room temperature and cooling light turns off after 2 minutes.',
      resolvedAt: new Date(Date.now() - 3600000 * 18)
    });
    await c5.save();

    await StatusHistory.create([
      {
        complaint: c5._id,
        oldStatus: null,
        newStatus: 'reported',
        changedBy: student1._id,
        changedByName: student1.name,
        changedByRole: 'student',
        note: 'Complaint registered',
        timestamp: new Date(Date.now() - 3600000 * 36)
      },
      {
        complaint: c5._id,
        oldStatus: 'reported',
        newStatus: 'assigned',
        changedBy: admin._id,
        changedByName: admin.name,
        changedByRole: 'admin',
        note: `Assigned to ${staff1.name}`,
        timestamp: new Date(Date.now() - 3600000 * 28)
      },
      {
        complaint: c5._id,
        oldStatus: 'assigned',
        newStatus: 'resolved',
        changedBy: staff1._id,
        changedByName: staff1.name,
        changedByRole: 'staff',
        note: 'Cleaned condenser coils and refilled gas.',
        timestamp: new Date(Date.now() - 3600000 * 18)
      },
      {
        complaint: c5._id,
        oldStatus: 'resolved',
        newStatus: 'reopened',
        changedBy: student1._id,
        changedByName: student1.name,
        changedByRole: 'student',
        note: 'Student rejected resolution: "Water is still at ambient room temperature and cooling light turns off after 2 minutes.". Complaint reopened.',
        timestamp: new Date(Date.now() - 3600000 * 6)
      }
    ]);

    console.log('[Seed] Database seeded with 5 test accounts & 5 demo complaints.');
    if (isStandalone) {
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error]', error.message);
    if (isStandalone) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = seedData;
