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
  BookOpen,
  Megaphone,
  FileText,
  Image
} from 'lucide-react';
import { applicationsAPI, studentsAPI, adminAPI } from '../../utils/api';
import api from '../../utils/api';
import { toast } from 'sonner';
import TeacherAssignmentView from './TeacherAssignmentView';
import AcademicSetupView from './AcademicSetupView';
import GalleryManagementView from './GalleryManagementView';
import FeeManagementView from '../finance/FeeManagementView';
import ReportsView from '../finance/ReportsView';
import AnnouncementsView from './AnnouncementsView';
import NotificationBell from '../../components/NotificationBell';

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
    { icon: FileText, label: 'Reports', path: '/admin/reports' },
    { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
    { icon: Image, label: 'Gallery Management', path: '/admin/gallery' },
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
            <div className="flex items-center gap-4">
              <NotificationBell />
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
            <Route path="/finance" element={<FeeManagementView />} />
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/announcements" element={<AnnouncementsView />} />
            <Route path="/gallery" element={<GalleryManagementView />} />
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
  return <AcademicSetupView />;
};

const AdmissionManagement = () => {
  const [applications, setApplications] = useState([]);
  const [admitApp, setAdmitApp] = useState(null);
  const [viewApp, setViewApp] = useState(null);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [holdMessage, setHoldMessage] = useState('');
  const [holdAppId, setHoldAppId] = useState(null);

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

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      if (newStatus === 'on_hold') {
        setHoldAppId(appId);
        setHoldMessage('');
        setHoldDialogOpen(true);
        return;
      }
      if (newStatus === 'rejected') {
        const ok = window.confirm('Are you sure you want to mark this application as Rejected? An email will be sent to the applicant.');
        if (!ok) return;
      }

      const response = await applicationsAPI.update(appId, { status: newStatus });
      if (response.data?.email_sent) {
        toast.success('Status updated and email notification sent to the applicant!');
      } else {
        toast.success('Status updated successfully!');
      }
      loadApplications();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const submitHold = async () => {
    const msg = holdMessage.trim();
    if (!msg) {
      toast.error('Please enter a message for Hold');
      return;
    }
    if (!holdAppId) return;

    try {
      const response = await applicationsAPI.update(holdAppId, { status: 'on_hold', remarks: msg });
      if (response.data?.email_sent) {
        toast.success('Application put on Hold and email sent to the applicant.');
      } else {
        toast.success('Application put on Hold.');
      }
      setHoldDialogOpen(false);
      setHoldMessage('');
      setHoldAppId(null);
      loadApplications();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to put application on hold');
    }
  };

  const handleAdmit = (app) => {
    setAdmitApp(app);
    setShowAdmitModal(true);
  };

  const handleView = (app) => {
    setViewApp(app);
    setShowViewModal(true);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const normalizeStatus = (status) => (status || '').toLowerCase();

  const getSortedAndFilteredApplications = () => {
    let filtered = [...applications];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => normalizeStatus(app.status) === filterStatus);
    }
    
    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle different data types
        if (sortConfig.key === 'applying_for_class') {
          aValue = aValue?.toLowerCase() || '';
          bValue = bValue?.toLowerCase() || '';
        } else if (sortConfig.key === 'student_name') {
          aValue = aValue?.toLowerCase() || '';
          bValue = bValue?.toLowerCase() || '';
        } else if (sortConfig.key === 'reference_number') {
          aValue = aValue || '';
          bValue = bValue || '';
        } else if (sortConfig.key === 'mobile') {
          aValue = aValue || '';
          bValue = bValue || '';
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return '↕';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'enquiry_new': { color: 'bg-blue-100 text-blue-800', label: 'New' },
      'enquiry_hot': { color: 'bg-red-100 text-red-800', label: 'Hot 🔥' },
      'enquiry_warm': { color: 'bg-amber-100 text-amber-800', label: 'Warm ⚡' },
      'enquiry_cold': { color: 'bg-gray-100 text-gray-800', label: 'Cold ❄️' },
      'documents_pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Docs Pending' },
      'documents_verified': { color: 'bg-green-100 text-green-800', label: 'Docs Verified ✅' },
      'payment_pending': { color: 'bg-purple-100 text-purple-800', label: 'Payment Pending' },
      'admitted': { color: 'bg-green-600 text-white', label: 'Admitted 🎓' },
      'on_hold': { color: 'bg-orange-100 text-orange-800', label: 'On Hold' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    return badges[status] || badges['enquiry_new'];
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Admission Management</h3>
      
      {/* Filter and Stats Section */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-2 border-gray-300 rounded-lg px-4 py-2 bg-white hover:border-[#f97316] focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20"
            >
              <option value="all">All Applications ({applications.length})</option>
              <option value="enquiry_new">🆕 New Enquiry ({applications.filter(a => normalizeStatus(a.status) === 'enquiry_new').length})</option>
              <option value="enquiry_hot">🔥 Hot Lead ({applications.filter(a => normalizeStatus(a.status) === 'enquiry_hot').length})</option>
              <option value="enquiry_warm">⚡ Warm Lead ({applications.filter(a => normalizeStatus(a.status) === 'enquiry_warm').length})</option>
              <option value="enquiry_cold">❄️ Cold Lead ({applications.filter(a => normalizeStatus(a.status) === 'enquiry_cold').length})</option>
              <option value="documents_pending">📄 Documents Pending ({applications.filter(a => normalizeStatus(a.status) === 'documents_pending').length})</option>
              <option value="documents_verified">✅ Documents Verified ({applications.filter(a => normalizeStatus(a.status) === 'documents_verified').length})</option>
              <option value="payment_pending">💳 Payment Pending ({applications.filter(a => normalizeStatus(a.status) === 'payment_pending').length})</option>
              <option value="admitted">🎓 Admitted ({applications.filter(a => normalizeStatus(a.status) === 'admitted').length})</option>
              <option value="on_hold">⏸️ On Hold ({applications.filter(a => normalizeStatus(a.status) === 'on_hold').length})</option>
              <option value="rejected">❌ Rejected ({applications.filter(a => normalizeStatus(a.status) === 'rejected').length})</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {getSortedAndFilteredApplications().length} of {applications.length} applications
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th 
                  className="text-left p-3 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('reference_number')}
                >
                  Reference {getSortIcon('reference_number')}
                </th>
                <th 
                  className="text-left p-3 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('student_name')}
                >
                  Student {getSortIcon('student_name')}
                </th>
                <th 
                  className="text-left p-3 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('applying_for_class')}
                >
                  Class {getSortIcon('applying_for_class')}
                </th>
                <th 
                  className="text-left p-3 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('mobile')}
                >
                  Contact {getSortIcon('mobile')}
                </th>
                <th 
                  className="text-left p-3 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('status')}
                >
                  Current Status {getSortIcon('status')}
                </th>
                <th className="text-left p-3">Docs Link</th>
                <th className="text-left p-3">Lead Status</th>
                <th className="text-left p-3">Change Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedAndFilteredApplications().map((app) => {
                const statusBadge = getStatusBadge(app.status);
                const isLeadStatus = ['enquiry_new', 'enquiry_hot', 'enquiry_warm', 'enquiry_cold'].includes(app.status);
                
                return (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{app.reference_number}</td>
                    <td className="p-3">{app.student_name}</td>
                    <td className="p-3 capitalize">{app.applying_for_class?.replace('_', ' ')}</td>
                    <td className="p-3 text-sm">{app.mobile}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {app.documents_link ? (
                        <a
                          href={app.documents_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View link
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        value={isLeadStatus ? app.status : ''}
                        onChange={(e) => e.target.value && handleStatusUpdate(app.id, e.target.value)}
                        className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-[#f97316] focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 cursor-pointer"
                      >
                        <option value="">--</option>
                        <option value="enquiry_new">🆕 New Enquiry</option>
                        <option value="enquiry_hot">🔥 Hot Lead</option>
                        <option value="enquiry_warm">⚡ Warm Lead</option>
                        <option value="enquiry_cold">❄️ Cold Lead</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        value={!isLeadStatus ? app.status : ''}
                        onChange={(e) => e.target.value && handleStatusUpdate(app.id, e.target.value)}
                        className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-[#f97316] focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 cursor-pointer"
                      >
                        <option value="">--</option>
                        <option value="documents_pending">📄 Documents Pending</option>
                        <option value="documents_verified">✅ Documents Verified</option>
                        <option value="payment_pending">💳 Payment Pending</option>
                        <option value="admitted">🎓 Admitted</option>
                        <option value="on_hold">⏸️ On Hold</option>
                        <option value="rejected">❌ Rejected</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => handleView(app)}
                        className="text-blue-600 hover:underline text-sm mr-3"
                      >
                        View
                      </button>
                      {(app.status === 'documents_verified' || app.status === 'payment_pending') && (
                        <button
                          onClick={() => handleAdmit(app)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Admit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admit Student Modal - reuse from Admission Dashboard */}
      {showAdmitModal && admitApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdmitModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">Admit Student</h2>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-[#1e3a8a]">{admitApp.student_name}</p>
                <p className="text-sm text-gray-600">Class: {admitApp.applying_for_class?.replace('_', ' ').toUpperCase()}</p>
                <p className="text-sm text-gray-600">Parent: {admitApp.parent_name}</p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const formData = new FormData(e.target);
                  await api.post(`/applications/${admitApp.id}/admit`, {
                    section: formData.get('section'),
                    academic_year: formData.get('academic_year')
                  });
                  toast.success('Student admitted successfully!');
                  setShowAdmitModal(false);
                  setAdmitApp(null);
                  loadApplications();
                } catch (error) {
                  toast.error('Failed to admit student');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Section *</label>
                  <select name="section" className="w-full px-4 py-2 border rounded-lg" required>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Academic Year *</label>
                  <input
                    type="text"
                    name="academic_year"
                    defaultValue="2025-2026"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdmitModal(false);
                      setAdmitApp(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Admit Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Application Details Modal */}
      {showViewModal && viewApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Application Details</h2>
                <p className="text-sm text-blue-100 mt-1">
                  Ref: <span className="font-mono font-semibold">{viewApp.reference_number}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewApp(null);
                }}
                className="text-white/90 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Branch:</span> <span className="font-medium">{viewApp.branch || '—'}</span></div>
                    <div><span className="text-gray-500">Student Name:</span> <span className="font-medium">{viewApp.student_name || '—'}</span></div>
                    <div><span className="text-gray-500">Gender:</span> <span className="font-medium">{viewApp.gender ? viewApp.gender.replace(/_/g, ' ').toUpperCase() : '—'}</span></div>
                    <div><span className="text-gray-500">Date of Birth:</span> <span className="font-medium">{viewApp.date_of_birth || '—'}</span></div>
                    <div><span className="text-gray-500">Class Applied For:</span> <span className="font-medium">{viewApp.applying_for_class ? viewApp.applying_for_class.replace(/_/g, ' ').toUpperCase() : '—'}</span></div>
                    <div><span className="text-gray-500">How they came to know:</span> <span className="font-medium">{viewApp.source ? viewApp.source.replace(/_/g, ' ').toUpperCase() : '—'}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Parent / Guardian Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Type:</span> <span className="font-medium">{viewApp.parent_type ? viewApp.parent_type.replace(/_/g, ' ').toUpperCase() : '—'}</span></div>
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium">{viewApp.parent_name || '—'}</span></div>
                    <div><span className="text-gray-500">Mobile:</span> <span className="font-medium">{viewApp.mobile || '—'}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium">{viewApp.email || '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Documents Link (if submitted) */}
              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Documents Link</h3>
                {viewApp.documents_link ? (
                  <a
                    href={viewApp.documents_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline break-all text-sm"
                  >
                    {viewApp.documents_link}
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">No documents link submitted yet.</p>
                )}
              </div>

              {/* Close */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewApp(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hold Message Dialog */}
      {holdDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setHoldDialogOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">Put Application On Hold</h2>
              <p className="text-sm text-blue-100 mt-1">Enter a message (this will be emailed to the applicant).</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea
                  value={holdMessage}
                  onChange={(e) => setHoldMessage(e.target.value)}
                  className="w-full min-h-[110px] px-4 py-2 border rounded-lg"
                  placeholder="Example: Birth certificate is missing in the uploaded drive link. Please upload it and resubmit."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setHoldDialogOpen(false);
                    setHoldMessage('');
                    setHoldAppId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitHold}
                  className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90"
                >
                  Save & Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'teacher',
    full_name: '',
    mobile: ''
  });
  const [loading, setLoading] = useState(false);

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

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) return;
    setLoading(true);
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully!');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminAPI.createUser(formData);
      toast.success('User created successfully!');
      setShowCreate(false);
      loadUsers();
      setFormData({
        email: '',
        password: '',
        role: 'teacher',
        full_name: '',
        mobile: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-[#1e3a8a]">User Management</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90"
          data-testid="create-user-button"
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
                  <td className="p-3 flex items-center gap-3">
                    <button className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button
                      className="text-red-600 hover:underline text-sm"
                      onClick={() => handleDeleteUser(user.id, user.full_name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">Create New User</h2>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mobile</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="school_admin">School Admin</option>
                  <option value="admission_officer">Admission Officer</option>
                  <option value="teacher">Teacher</option>
                  <option value="finance_manager">Finance Manager</option>
                  <option value="inventory_manager">Inventory Manager</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;