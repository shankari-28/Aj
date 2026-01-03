import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Activity, LogOut, Menu, X } from 'lucide-react';
import { studentsAPI, attendanceAPI, activitiesAPI } from '../../utils/api';
import { toast } from 'sonner';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await studentsAPI.getAll();
      setStudents(res.data);
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50" data-testid="teacher-dashboard">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1e3a8a] text-white transition-all flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          {sidebarOpen && <h1 className="text-xl font-bold">Teacher Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', tab: 'dashboard' },
            { icon: Users, label: 'My Students', tab: 'students' },
            { icon: Calendar, label: 'Attendance', tab: 'attendance' },
            { icon: Activity, label: 'Daily Activities', tab: 'activities' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 ${
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

      <div className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm border-b p-6">
          <h2 className="text-2xl font-bold text-[#1e3a8a]">Welcome, {user?.full_name}</h2>
        </div>

        <div className="p-6">
          {activeTab === 'students' && (
            <div>
              <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">My Students</h3>
              <div className="bg-white rounded-xl shadow-md p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Roll No</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Class</th>
                      <th className="text-left p-3">Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono">{student.roll_number}</td>
                        <td className="p-3">{student.student_name}</td>
                        <td className="p-3 capitalize">{student.current_class?.replace('_', ' ')}</td>
                        <td className="p-3">{student.section}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Mark Attendance</h3>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-gray-600">Mark daily attendance for your students here.</p>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div>
              <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Daily Activities</h3>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-gray-600">Update daily activities, homework, and remarks for students.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;