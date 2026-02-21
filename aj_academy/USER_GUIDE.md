# Kid Scholars School Management System - User Guide

## 🔐 Login Credentials

**Super Admin Account:**
- Email: `shankarithangaraj01@gmail.com`
- Password: `admin123`

---

## 📋 Complete Admission Workflow (Step-by-Step)

### **For Parents (Public - No Login Required)**

#### Step 1: Submit New Application
1. Go to the school website
2. Click **"Apply Now"** or **"New Application"** button
3. Fill in the application form:
   - Student details (name, gender, date of birth)
   - Class applying for (Play Group/Pre-KG/LKG/UKG)
   - Parent/Guardian details
   - Contact information
4. Click **"Submit Application"**
5. **Save the Reference Number** (e.g., KSIS-2026-XXXXXX)

#### Step 2: Check Application Status
1. Click **"Check Application Status"**
2. Enter:
   - Reference Number
   - Student's Date of Birth
3. View current status and next steps

---

### **For Admission Officer (Login Required)**

#### Step 1: Login
1. Click **"Login"** button (top right)
2. Enter credentials
3. Select role: "Admission Officer"
4. Click **"Login"**

#### Step 2: View Applications
1. Navigate to **"Admission Management"** from sidebar
2. See all applications in table format with:
   - Reference Number
   - Student Name
   - Class
   - Contact Number
   - Current Status

#### Step 3: Categorize Enquiry
Update the status dropdown for each application:
- **New** - Just received
- **Hot** - High priority/interested
- **Warm** - Moderate interest
- **Cold** - Low priority
- **Docs Pending** - Waiting for documents
- **Docs Verified** - Documents received and verified ✅
- **Payment Pending** - Awaiting fee payment
- **Admitted** - Student enrolled

#### Step 4: Admit Student
1. Change application status to **"Docs Verified"**
2. Green **"Admit"** button appears
3. Click **"Admit"** button
4. In the modal, enter:
   - **Section**: A, B, or C
   - **Academic Year**: e.g., 2025-2026
5. Click **"Admit Student"**
6. System will:
   - Generate Admission Number
   - Generate Roll Number (format: 2026-UKG-A-001)
   - Create Parent Login Account
   - Send notification

#### Step 5: Share Credentials with Parent
After admission, you'll see:
- **Parent Email**: (from application)
- **Default Password**: `parent2026`
- **Roll Number**: Generated automatically

Share these credentials with the parent via email/phone.

---

### **For Parents (After Admission)**

#### Parent Login
1. Go to school website
2. Click **"Login"**
3. Enter:
   - Email: (provided during application)
   - Password: `parent2026`
   - Role: "Parent"
4. Access Parent Dashboard to view:
   - Child's profile
   - Attendance records
   - Daily activities
   - Fee status

---

### **For Admin (Full System Access)**

#### 1. Dashboard Overview
- View total students
- View total applications
- View pending applications
- View hot/warm/cold enquiries

#### 2. User Management
- Create new users (teachers, staff, etc.)
- Assign roles
- Reset passwords
- Deactivate users

#### 3. Admission Management
- Same as Admission Officer
- Can override any decisions
- Can bulk process applications

#### 4. Academic Setup
- Create academic years
- Define sections (A, B, C)
- Set class capacities
- Assign teachers to classes

#### 5. Teacher Management
- Create teacher accounts
- Assign classes and sections
- View teacher attendance
- Approve leave requests

#### 6. Finance Management
- View fee collection summary
- Track pending payments
- Generate reports

#### 7. Inventory Management
- Track books, uniforms, supplies
- Low stock alerts
- Issue tracking

---

## 🎯 Quick Reference

### Application Status Flow
```
New Application (Parent submits)
    ↓
Enquiry New (Admission Officer sees)
    ↓
Hot/Warm/Cold (Categorization)
    ↓
Docs Pending (Request documents)
    ↓
Docs Verified (Documents OK) ✅
    ↓
[Click "Admit" Button]
    ↓
Enter Section & Year
    ↓
Admitted (Roll number generated)
    ↓
Parent login created automatically
```

### Default Passwords
- **Admin**: `admin123`
- **Parents**: `parent2026` (after admission)
- **Teachers**: Set by admin during creation

### Roll Number Format
- Pattern: `YEAR-CLASS-SECTION-SEQUENCE`
- Example: `2026-UKG-A-015`
- Auto-generated during admission

---

## ⚠️ Important Notes

1. **Status Dropdown**: The "Docs Verified" option is now added - you must select this to see the "Admit" button

2. **Admit Button**: Only appears when status is "Docs Verified" or "Payment Pending"

3. **Parent Account**: Automatically created when student is admitted - no manual creation needed

4. **Reference Number**: Always save this - it's the only way to track applications publicly

5. **Section Assignment**: Must be done during admission - cannot be changed without admin access

---

## 🐛 Troubleshooting

**Issue**: Can't see "Admit" button
- **Solution**: Make sure application status is set to "Docs Verified"

**Issue**: Login not working
- **Solution**: Check email is correct and try default password

**Issue**: Application not showing in dashboard
- **Solution**: Refresh the page or check if logged in with correct role

**Issue**: Parent can't login after admission
- **Solution**: Use default password `parent2026` and ensure email is correct

---

## 📞 Support

For technical support or questions:
- **School Contact**: +91 72008 25692
- **Email**: info@kidscholars.edu.in
- **Address**: Medavakkam, Chennai - 600100

---

**System Version**: 1.0  
**Last Updated**: January 2026
