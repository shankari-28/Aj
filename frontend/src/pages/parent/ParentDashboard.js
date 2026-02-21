import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Activity, FileText, LogOut, Menu, X, Calendar } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activities, setActivities] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadChildren();
    }
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadChildData(selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      const res = await api.get('/parent/children');
      setChildren(res.data);
      if (res.data.length > 0) {
        setSelectedChild(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to load children:', error);
    }
  };

  const loadChildData = async (studentId) => {
    try {
      const [activitiesRes, attendanceRes] = await Promise.all([
        api.get(`/parent/child/${studentId}/activities`),
        api.get(`/parent/child/${studentId}/attendance`)
      ]);
      setActivities(activitiesRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Failed to load child data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const calculateAttendanceStats = () => {
    if (attendance.length === 0) return { present: 0, absent: 0, percentage: 0 };
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const percentage = Math.round((present / attendance.length) * 100);
    return { present, absent, percentage };
  };

  const stats = calculateAttendanceStats();

  return (
    <div className="flex h-screen bg-gray-50" data-testid="parent-dashboard">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1e3a8a] text-white transition-all flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          {sidebarOpen && <h1 className="text-xl font-bold">Parent Portal</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: LayoutDashboard, label: 'Overview', tab: 'overview' },
            { icon: User, label: 'Profile', tab: 'profile' },
            { icon: Activity, label: 'Daily Activities', tab: 'activities' },
            { icon: Calendar, label: 'Attendance', tab: 'attendance' },
            { icon: FileText, label: 'Fee Status', tab: 'fees' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors ${
                activeTab === item.tab ? 'bg-blue-700' : ''
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm border-b p-6">
          <h2 className="text-2xl font-bold text-[#1e3a8a]">Welcome, {user?.full_name}</h2>
          {children.length > 0 && (
            <div className="mt-4">
              <label className="text-sm text-gray-600">Select Child:</label>
              <select
                value={selectedChild?.id || ''}
                onChange={(e) => {
                  const child = children.find(c => c.id === e.target.value);
                  setSelectedChild(child);
                }}
                className="ml-2 px-4 py-2 border rounded-lg"
              >
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.student_name} - {child.roll_number}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-6">
          {children.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-600 mb-4">No children enrolled yet</p>
              <p className="text-sm text-gray-500">Your child's information will appear here once admission is complete</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && selectedChild && (
                <div>
                  <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Overview</h3>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <p className="text-sm text-gray-600 mb-2">Attendance Rate</p>
                      <p className="text-3xl font-bold text-green-600">{stats.percentage}%</p>
                      <p className="text-sm text-gray-500 mt-2">{stats.present} present / {stats.absent} absent</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <p className="text-sm text-gray-600 mb-2">Recent Activities</p>
                      <p className="text-3xl font-bold text-[#1e3a8a]">{activities.length}</p>
                      <p className="text-sm text-gray-500 mt-2">Last 30 days</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <p className="text-sm text-gray-600 mb-2">Class</p>
                      <p className="text-3xl font-bold text-[#1e3a8a]">
                        {selectedChild.current_class?.replace('_', ' ').toUpperCase()}-{selectedChild.section}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Academic Year {selectedChild.academic_year}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h4 className="text-lg font-semibold mb-4">Recent Activities</h4>
                    {activities.length === 0 ? (
                      <p className="text-gray-500">No activities recorded yet</p>
                    ) : (
                      <div className="space-y-4">
                        {activities.slice(0, 5).map((activity, idx) => (
                          <div key={idx} className="border-l-4 border-[#f97316] pl-4 py-2">
                            <p className="font-semibold text-sm text-gray-600">{new Date(activity.date).toLocaleDateString()}</p>
                            {activity.activities && <p className="text-sm">Activities: {activity.activities}</p>}
                            {activity.remarks && <p className="text-sm text-gray-600 mt-1">{activity.remarks}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && selectedChild && (
                <div>
                  <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Student Profile</h3>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-lg font-semibold text-[#1e3a8a]">{selectedChild.student_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Roll Number</label>
                        <p className="text-lg font-semibold text-[#1e3a8a]">{selectedChild.roll_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Admission Number</label>
                        <p className="text-lg font-semibold text-[#1e3a8a]">{selectedChild.admission_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                        <p className="text-lg font-semibold text-[#1e3a8a]">{selectedChild.date_of_birth}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Class</label>
                        <p className="text-lg font-semibold text-[#1e3a8a]">
                          {selectedChild.current_class?.replace('_', ' ').toUpperCase()} - Section {selectedChild.section}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Academic Year</label>
                        <p className="text-lg font-semibold text-[#1e3a8a]">{selectedChild.academic_year}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div>
                  <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Daily Activities</h3>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    {activities.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No activities recorded yet</p>
                    ) : (
                      <div className="space-y-6">
                        {activities.map((activity, idx) => (
                          <div key={idx} className="border-b pb-6 last:border-0">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-lg">{new Date(activity.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              {activity.rhymes && (
                                <div>
                                  <span className="font-medium text-gray-600">Rhymes:</span>
                                  <p>{activity.rhymes}</p>
                                </div>
                              )}
                              {activity.activities && (
                                <div>
                                  <span className="font-medium text-gray-600">Activities:</span>
                                  <p>{activity.activities}</p>
                                </div>
                              )}
                              {activity.food_habits && (
                                <div>
                                  <span className="font-medium text-gray-600">Food Habits:</span>
                                  <p className="capitalize">{activity.food_habits.replace('_', ' ')}</p>
                                </div>
                              )}
                              {activity.nap_status && (
                                <div>
                                  <span className="font-medium text-gray-600">Nap Status:</span>
                                  <p className="capitalize">{activity.nap_status.replace('_', ' ')}</p>
                                </div>
                              )}
                              {activity.behavior_notes && (
                                <div className="md:col-span-2">
                                  <span className="font-medium text-gray-600">Behavior:</span>
                                  <p>{activity.behavior_notes}</p>
                                </div>
                              )}
                              {activity.homework && (
                                <div className="md:col-span-2">
                                  <span className="font-medium text-gray-600">Homework:</span>
                                  <p>{activity.homework}</p>
                                </div>
                              )}
                              {activity.remarks && (
                                <div className="md:col-span-2">
                                  <span className="font-medium text-gray-600">Teacher's Remarks:</span>
                                  <p className="text-[#f97316]">{activity.remarks}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div>
                  <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Attendance Records</h3>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    {attendance.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No attendance records yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3">Date</th>
                              <th className="text-left p-3">Status</th>
                              <th className="text-left p-3">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.map((record, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="p-3">{new Date(record.date).toLocaleDateString()}</td>
                                <td className="p-3">
                                  <span className={`px-3 py-1 rounded-full text-sm ${
                                    record.status === 'present' ? 'bg-green-100 text-green-800' :
                                    record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {record.status === 'present' ? 'Present' :
                                     record.status === 'absent' ? 'Absent' : 'Half Day'}
                                  </span>
                                </td>
                                <td className="p-3 text-sm text-gray-600">{record.remarks || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'fees' && (
                <div>
                  <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Fee Status</h3>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <p className="text-gray-600 text-center py-8">Fee payment integration coming soon</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
