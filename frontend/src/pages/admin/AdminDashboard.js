import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  UserPlus, 
  DollarSign, 
  Package, 
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import { applicationsAPI, studentsAPI, adminAPI } from '../../utils/api';
import api from '../../utils/api';
import { toast } from 'sonner';
import TeacherAssignmentView from './TeacherAssignmentView';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [appsRes, studentsRes] = await Promise.all([
        applicationsAPI.getAll(),
        studentsAPI.getAll(),
      ]);
      setStats({
        totalStudents: studentsRes.data.length,
        totalApplications: appsRes.data.length,
        pendingApplications: appsRes.data.filter(a => 
          a.status === 'enquiry_new' || a.status === 'enquiry_hot' || a.status === 'enquiry_warm'
        ).length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: BookOpen, label: 'Academic Setup', path: '/admin/academic' },
    { icon: UserPlus, label: 'Admission Management', path: '/admin/admissions' },
    { icon: GraduationCap, label: 'Teacher Management', path: '/admin/teachers' },
    { icon: DollarSign, label: 'Finance Management', path: '/admin/finance' },
    { icon: Package, label: 'Inventory Management', path: '/admin/inventory' },
    { icon: Users, label: 'User Management', path: '/admin/users' },
  ];

  return (
    <div className="flex h-screen bg-gray-50" data-testid="admin-dashboard">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1e3a8a] text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          {sidebarOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-left"
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#1e3a8a]">Welcome, {user?.full_name}</h2>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<AdminDashboardHome stats={stats} />} />
            <Route path="/academic" element={<AcademicSetup />} />
            <Route path="/admissions" element={<AdmissionManagement />} />
            <Route path="/teachers" element={<TeacherManagement />} />
            <Route path="/finance" element={<div>Finance Management (Coming Soon)</div>} />
            <Route path="/inventory" element={<div>Inventory Management (Coming Soon)</div>} />
            <Route path="/users" element={<UserManagement />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const AdminDashboardHome = ({ stats }) => {
  const [dashStats, setDashStats] = useState(stats);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setDashStats({
        totalStudents: res.data.total_students,
        totalApplications: res.data.total_applications,
        pendingApplications: res.data.pending_applications,
        hotEnquiries: res.data.hot_enquiries,
        warmEnquiries: res.data.warm_enquiries,
        coldEnquiries: res.data.cold_enquiries,
      });
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const statCards = [
    { label: 'Total Students', value: dashStats.totalStudents, color: 'bg-blue-500', icon: '🏫' },
    { label: 'Total Applications', value: dashStats.totalApplications, color: 'bg-green-500', icon: '📝' },
    { label: 'Pending Applications', value: dashStats.pendingApplications, color: 'bg-orange-500', icon: '⏳' },
    { label: 'Hot Enquiries', value: dashStats.hotEnquiries, color: 'bg-red-500', icon: '🔥' },
  ];

  return (
    <div>
      <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Dashboard Overview</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-[#1e3a8a]">{card.value}</p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <h4 className="text-lg font-semibold mb-4">Quick Actions</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/admin/users')}
            className="px-6 py-3 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 font-medium"
          >
            Create New User
          </button>
          <button 
            onClick={() => navigate('/admin/admissions')}
            className="px-6 py-3 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e3a8a]/90 font-medium"
          >
            View All Applications
          </button>
        </div>
      </div>
    </div>
  );
};

const AcademicSetup = () => {
  return (
    <div>
      <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Academic Setup</h3>
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-gray-600">Configure academic years, standards, and sections here.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Academic Year</label>
            <input type="text" placeholder="2025-2026" className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Standards</label>
            <div className="flex gap-2 flex-wrap">
              {['Play Group', 'Pre KG', 'LKG', 'UKG'].map(std => (
                <div key={std} className="px-4 py-2 bg-blue-100 rounded-lg">{std}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdmissionManagement = () => {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const res = await applicationsAPI.getAll();
      setApplications(res.data);
    } catch (error) {
      toast.error('Failed to load applications');
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Admission Management</h3>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Reference</th>
                <th className="text-left p-3">Student Name</th>
                <th className="text-left p-3">Class</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{app.reference_number}</td>
                  <td className="p-3">{app.student_name}</td>
                  <td className="p-3 capitalize">{app.applying_for_class?.replace('_', ' ')}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {app.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{new Date(app.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TeacherManagement = () => {
  return (
    <div>
      <TeacherAssignmentView />
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-[#1e3a8a]">User Management</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90"
        >
          Create User
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{user.full_name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 capitalize">{user.role?.replace('_', ' ')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button className="text-blue-600 hover:underline text-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;