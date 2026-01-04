import requests
import sys
import json
from datetime import datetime

class KidScholarsAPITester:
    def __init__(self, base_url="https://youngminds-admin.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.teacher_token = None
        self.parent_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_data = {}

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "shankarithangaraj01@gmail.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_create_application(self):
        """Create test application"""
        success, response = self.run_test(
            "Create Application",
            "POST",
            "public/application",
            200,
            data={
                "student_name": "Test Student Phase2",
                "gender": "male",
                "date_of_birth": "2020-05-15",
                "applying_for_class": "lkg",
                "source": "friends_relatives",
                "parent_type": "father",
                "parent_name": "Test Parent",
                "mobile": "9876543210",
                "email": "testparent@example.com"
            }
        )
        if success:
            self.test_data['reference_number'] = response.get('reference_number')
            print(f"Application created: {self.test_data['reference_number']}")
            return True
        return False

    def test_admit_student(self):
        """Admit the test student"""
        if not self.admin_token:
            return False
        
        # First get the application
        applications_success, applications = self.run_test(
            "Get Applications",
            "GET",
            "applications",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if not applications_success:
            return False
        
        # Find our test application
        test_app = None
        for app in applications:
            if app.get('reference_number') == self.test_data.get('reference_number'):
                test_app = app
                break
        
        if not test_app:
            print("❌ Test application not found")
            return False
        
        # Admit the student
        success, response = self.run_test(
            "Admit Student",
            "POST",
            f"applications/{test_app['id']}/admit",
            200,
            data={"section": "A", "academic_year": "2025-2026"},
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            self.test_data['admission_number'] = response.get('admission_number')
            self.test_data['parent_email'] = response.get('parent_email')
            self.test_data['parent_password'] = response.get('parent_default_password')
            print(f"Student admitted: {self.test_data['admission_number']}")
            return True
        return False

    def test_create_teacher(self):
        """Create a test teacher"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Create Teacher User",
            "POST",
            "admin/users",
            200,
            data={
                "email": "testteacher@example.com",
                "password": "teacher123",
                "role": "teacher",
                "full_name": "Test Teacher",
                "mobile": "9876543211"
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            # Get teacher ID
            users_success, users = self.run_test(
                "Get Users",
                "GET",
                "admin/users",
                200,
                headers={'Authorization': f'Bearer {self.admin_token}'}
            )
            
            if users_success:
                for user in users:
                    if user.get('email') == 'testteacher@example.com':
                        self.test_data['teacher_id'] = user['id']
                        break
            return True
        return False

    def test_teacher_login(self):
        """Test teacher login"""
        success, response = self.run_test(
            "Teacher Login",
            "POST",
            "auth/login",
            200,
            data={"email": "testteacher@example.com", "password": "teacher123"}
        )
        if success and 'token' in response:
            self.teacher_token = response['token']
            print(f"Teacher token obtained: {self.teacher_token[:20]}...")
            return True
        return False

    def test_teacher_assignment(self):
        """Test teacher assignment to class"""
        if not self.admin_token or not self.test_data.get('teacher_id'):
            return False
        
        success, response = self.run_test(
            "Assign Teacher to Class",
            "POST",
            "teachers/assign",
            200,
            data={
                "teacher_id": self.test_data['teacher_id'],
                "standard": "lkg",
                "section": "A",
                "academic_year": "2025-2026",
                "is_class_teacher": True
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        return success

    def test_get_teacher_assignments(self):
        """Test getting teacher assignments"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Get Teacher Assignments",
            "GET",
            "teachers/assignments",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        return success

    def test_get_teacher_students(self):
        """Test getting students for teacher"""
        if not self.teacher_token or not self.test_data.get('teacher_id'):
            return False
        
        success, response = self.run_test(
            "Get Teacher Students",
            "GET",
            f"teachers/{self.test_data['teacher_id']}/students",
            200,
            headers={'Authorization': f'Bearer {self.teacher_token}'}
        )
        
        if success and response:
            self.test_data['students'] = response
            print(f"Found {len(response)} students for teacher")
        return success

    def test_bulk_attendance(self):
        """Test bulk attendance marking"""
        if not self.teacher_token or not self.test_data.get('students'):
            return False
        
        students = self.test_data['students']
        if not students:
            print("No students found for attendance test")
            return True  # Not a failure, just no data
        
        attendance_list = []
        for student in students[:3]:  # Test with first 3 students
            attendance_list.append({
                "student_id": student['id'],
                "status": "present",
                "remarks": "Test attendance"
            })
        
        success, response = self.run_test(
            "Mark Bulk Attendance",
            "POST",
            "attendance/bulk",
            200,
            data={
                "date": "2025-01-15",
                "standard": "lkg",
                "section": "A",
                "attendance_list": attendance_list
            },
            headers={'Authorization': f'Bearer {self.teacher_token}'}
        )
        return success

    def test_daily_activities(self):
        """Test daily activities creation"""
        if not self.teacher_token or not self.test_data.get('students'):
            return False
        
        students = self.test_data['students']
        if not students:
            print("No students found for activities test")
            return True
        
        success, response = self.run_test(
            "Create Daily Activity",
            "POST",
            "daily-activities",
            200,
            data={
                "student_id": students[0]['id'],
                "date": "2025-01-15",
                "rhymes": "Twinkle Twinkle Little Star",
                "activities": "Coloring and building blocks",
                "food_habits": "ate_well",
                "nap_status": "slept_well",
                "behavior_notes": "Very active and cooperative",
                "homework": "Practice writing A-Z",
                "remarks": "Great progress today!"
            },
            headers={'Authorization': f'Bearer {self.teacher_token}'}
        )
        return success

    def test_parent_login(self):
        """Test parent login"""
        if not self.test_data.get('parent_email') or not self.test_data.get('parent_password'):
            print("Parent credentials not available")
            return False
        
        success, response = self.run_test(
            "Parent Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.test_data['parent_email'],
                "password": self.test_data['parent_password']
            }
        )
        if success and 'token' in response:
            self.parent_token = response['token']
            print(f"Parent token obtained: {self.parent_token[:20]}...")
            return True
        return False

    def test_parent_children(self):
        """Test getting parent's children"""
        if not self.parent_token:
            return False
        
        success, response = self.run_test(
            "Get Parent Children",
            "GET",
            "parent/children",
            200,
            headers={'Authorization': f'Bearer {self.parent_token}'}
        )
        
        if success and response:
            self.test_data['parent_children'] = response
            print(f"Parent has {len(response)} children")
        return success

    def test_parent_child_activities(self):
        """Test getting child activities"""
        if not self.parent_token or not self.test_data.get('parent_children'):
            return False
        
        children = self.test_data['parent_children']
        if not children:
            print("No children found for parent")
            return True
        
        success, response = self.run_test(
            "Get Child Activities",
            "GET",
            f"parent/child/{children[0]['id']}/activities",
            200,
            headers={'Authorization': f'Bearer {self.parent_token}'}
        )
        return success

    def test_parent_child_attendance(self):
        """Test getting child attendance"""
        if not self.parent_token or not self.test_data.get('parent_children'):
            return False
        
        children = self.test_data['parent_children']
        if not children:
            print("No children found for parent")
            return True
        
        success, response = self.run_test(
            "Get Child Attendance",
            "GET",
            f"parent/child/{children[0]['id']}/attendance",
            200,
            headers={'Authorization': f'Bearer {self.parent_token}'}
        )
        return success

    def test_get_students(self):
        """Test getting all students"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Get All Students",
            "GET",
            "students",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            self.test_data['all_students'] = response
            print(f"Found {len(response)} total students")
        return success

    def test_create_fee_structure(self):
        """Test creating fee structure"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Create Fee Structure",
            "POST",
            "fees/structure",
            200,
            data={
                "standard": "lkg",
                "admission_fee": 5000,
                "tuition_fee": 20000,
                "books_fee": 3000,
                "uniform_fee": 2000,
                "transport_fee": 0,
                "academic_year": "2025-2026"
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            print("Fee structure created successfully")
        return success

    def test_get_fee_structures(self):
        """Test getting all fee structures"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Get Fee Structures",
            "GET",
            "fees/structure",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            self.test_data['fee_structures'] = response
            print(f"Found {len(response)} fee structures")
        return success

    def test_record_offline_payment(self):
        """Test recording offline payment"""
        if not self.admin_token or not self.test_data.get('all_students'):
            return False
        
        students = self.test_data['all_students']
        if not students:
            print("No students found for payment test")
            return True
        
        # Use the first student for payment test
        student_id = students[0]['id']
        
        success, response = self.run_test(
            "Record Offline Payment",
            "POST",
            "fee-payments/record",
            200,
            data={
                "student_id": student_id,
                "amount": 10000,
                "payment_mode": "cash",
                "payment_status": "paid"
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            self.test_data['test_student_id'] = student_id
            print(f"Payment recorded for student: {student_id}")
        return success

    def test_get_student_payments(self):
        """Test getting student payments"""
        if not self.admin_token or not self.test_data.get('test_student_id'):
            return False
        
        student_id = self.test_data['test_student_id']
        
        success, response = self.run_test(
            "Get Student Payments",
            "GET",
            f"fees/payments/{student_id}",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            print(f"Found {len(response)} payments for student")
        return success

    # ==================== PHASE 5 TESTS ====================
    
    def test_daily_collection_report(self):
        """Test daily collection report"""
        if not self.admin_token:
            return False
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        success, response = self.run_test(
            "Daily Collection Report",
            "GET",
            f"reports/daily-collection?date={today}",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            print(f"Daily collection: ₹{response.get('total_collection', 0)}")
            print(f"Transactions: {response.get('transaction_count', 0)}")
            self.test_data['daily_collection'] = response
        return success

    def test_outstanding_dues_report(self):
        """Test outstanding dues report"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Outstanding Dues Report",
            "GET",
            "reports/outstanding-dues",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            print(f"Total outstanding: ₹{response.get('total_outstanding', 0)}")
            print(f"Students with dues: {response.get('students_with_dues', 0)}")
            self.test_data['outstanding_dues'] = response
        return success

    def test_collection_summary_report(self):
        """Test collection summary report"""
        if not self.admin_token:
            return False
        
        today = datetime.now().strftime("%Y-%m-%d")
        start_date = "2025-01-01"
        
        success, response = self.run_test(
            "Collection Summary Report",
            "GET",
            f"reports/collection-summary?start_date={start_date}&end_date={today}",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            print(f"Period collection: ₹{response.get('total_collection', 0)}")
            print(f"Daily breakdown entries: {len(response.get('daily_breakdown', []))}")
        return success

    def test_create_announcement(self):
        """Test creating announcement"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Create Announcement",
            "POST",
            "announcements",
            200,
            data={
                "title": "Test Announcement",
                "message": "This is a test message for Phase 5 testing",
                "target_roles": ["parent"],
                "target_classes": ["lkg"]
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            self.test_data['announcement_id'] = response.get('announcement_id')
            print(f"Announcement created: {response.get('announcement_id')}")
            print(f"Notifications sent: {response.get('notifications_sent', 0)}")
        return success

    def test_get_announcements(self):
        """Test getting announcements"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Get Announcements",
            "GET",
            "announcements",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            print(f"Found {len(response)} announcements")
            # Verify our test announcement exists
            test_announcement = None
            for ann in response:
                if ann.get('title') == 'Test Announcement':
                    test_announcement = ann
                    break
            if test_announcement:
                print("✅ Test announcement found in list")
            else:
                print("⚠️ Test announcement not found in list")
        return success

    def test_unread_notifications_count(self):
        """Test getting unread notifications count"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Unread Notifications Count",
            "GET",
            "notifications/unread-count",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            print(f"Unread notifications: {response.get('unread_count', 0)}")
        return success

    def test_fee_reminder_notifications(self):
        """Test sending fee reminder notifications"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Send Fee Reminders",
            "POST",
            "notifications/fee-reminder",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            print(f"Fee reminders sent: {response.get('reminders_sent', 0)}")
        return success

    def test_upload_document(self):
        """Test document upload"""
        if not self.admin_token:
            return False
        
        # First get an existing application ID
        applications_success, applications = self.run_test(
            "Get Applications for Document Test",
            "GET",
            "applications",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if not applications_success or not applications:
            print("❌ No applications found for document test")
            return False
        
        application_id = applications[0]['id']
        self.test_data['test_application_id'] = application_id
        
        # Create a small test image in base64 (1x1 pixel PNG)
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        success, response = self.run_test(
            "Upload Document",
            "POST",
            "documents/upload-file",
            200,
            data={
                "application_id": application_id,
                "document_type": "birth_certificate",
                "document_name": "test_birth_certificate.png",
                "file_data": test_image_base64,
                "file_type": "image/png"
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            self.test_data['document_id'] = response.get('document_id')
            print(f"Document uploaded: {response.get('document_id')}")
        return success

    def test_get_application_documents(self):
        """Test getting application documents"""
        if not self.admin_token or not self.test_data.get('test_application_id'):
            return False
        
        application_id = self.test_data['test_application_id']
        
        success, response = self.run_test(
            "Get Application Documents",
            "GET",
            f"documents/application/{application_id}",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and response:
            print(f"Found {len(response)} documents for application")
            # Verify our test document exists
            test_doc = None
            for doc in response:
                if doc.get('document_name') == 'test_birth_certificate.png':
                    test_doc = doc
                    break
            if test_doc:
                print("✅ Test document found in application documents")
            else:
                print("⚠️ Test document not found in application documents")
        return success

    def test_verify_document(self):
        """Test document verification"""
        if not self.admin_token or not self.test_data.get('document_id'):
            return False
        
        document_id = self.test_data['document_id']
        
        success, response = self.run_test(
            "Verify Document",
            "PATCH",
            f"documents/{document_id}/verify?status=verified",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            print("✅ Document verified successfully")
        return success

def main():
    print("🚀 Starting Kid Scholars Phase 5 API Testing...")
    tester = KidScholarsAPITester()
    
    # Test sequence
    tests = [
        ("Admin Login", tester.test_admin_login),
        ("Create Application", tester.test_create_application),
        ("Admit Student", tester.test_admit_student),
        ("Create Teacher", tester.test_create_teacher),
        ("Teacher Login", tester.test_teacher_login),
        ("Teacher Assignment", tester.test_teacher_assignment),
        ("Get Teacher Assignments", tester.test_get_teacher_assignments),
        ("Get Teacher Students", tester.test_get_teacher_students),
        ("Bulk Attendance", tester.test_bulk_attendance),
        ("Daily Activities", tester.test_daily_activities),
        ("Parent Login", tester.test_parent_login),
        ("Parent Children", tester.test_parent_children),
        ("Parent Child Activities", tester.test_parent_child_activities),
        ("Parent Child Attendance", tester.test_parent_child_attendance),
        # Fee Management Tests
        ("Get All Students", tester.test_get_students),
        ("Create Fee Structure", tester.test_create_fee_structure),
        ("Get Fee Structures", tester.test_get_fee_structures),
        ("Record Offline Payment", tester.test_record_offline_payment),
        ("Get Student Payments", tester.test_get_student_payments),
        # Phase 5 Tests - Reports Module
        ("Daily Collection Report", tester.test_daily_collection_report),
        ("Outstanding Dues Report", tester.test_outstanding_dues_report),
        ("Collection Summary Report", tester.test_collection_summary_report),
        # Phase 5 Tests - Announcements Module
        ("Create Announcement", tester.test_create_announcement),
        ("Get Announcements", tester.test_get_announcements),
        ("Unread Notifications Count", tester.test_unread_notifications_count),
        ("Send Fee Reminders", tester.test_fee_reminder_notifications),
        # Phase 5 Tests - Document Upload Module
        ("Upload Document", tester.test_upload_document),
        ("Get Application Documents", tester.test_get_application_documents),
        ("Verify Document", tester.test_verify_document),
    ]
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Running: {test_name}")
        print('='*50)
        
        try:
            result = test_func()
            if not result:
                print(f"❌ {test_name} failed - stopping dependent tests")
                # Continue with other tests that don't depend on this one
        except Exception as e:
            print(f"❌ {test_name} error: {str(e)}")
    
    # Print final results
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS")
    print('='*60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())