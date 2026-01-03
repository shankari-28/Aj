import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, LogOut, Menu, X } from 'lucide-react';
import { applicationsAPI } from '../../utils/api';
import { toast } from 'sonner';

const AdmissionDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showAdmitModal, setShowAdmitModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      await applicationsAPI.update(appId, { status: newStatus });
      toast.success('Status updated');
      loadApplications();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAdmit = (app) => {
    setSelectedApp(app);
    setShowAdmitModal(true);
  };

  return (
    <div className="flex h-screen bg-gray-50" data-testid="admission-dashboard">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1e3a8a] text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          {sidebarOpen && <h1 className="text-xl font-bold">Admission Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigate('/admission')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700"
          >
            <LayoutDashboard className="w-5 h-5" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700">
            <FileText className="w-5 h-5" />
            {sidebarOpen && <span>Applications</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-blue-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-[#1e3a8a]">Welcome, {user?.full_name}</h2>
        </div>

        <div className="p-6">
          <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Application Management</h3>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[{label: 'Total', color: 'blue'}, {label: 'Hot', color: 'green'}, {label: 'Warm', color: 'amber'}, {label: 'Cold', color: 'gray'}].map((stat, idx) => (
              <div key={idx} className={`bg-${stat.color}-100 border border-${stat.color}-300 rounded-lg p-4`}>
                <p className="text-sm text-gray-600">{stat.label} Enquiries</p>
                <p className="text-2xl font-bold text-[#1e3a8a]">
                  {stat.label === 'Total' ? applications.length : 
                   applications.filter(a => a.status.includes(stat.label.toLowerCase())).length}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Reference</th>
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3">Class</th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{app.reference_number}</td>
                    <td className="p-3">{app.student_name}</td>
                    <td className="p-3 capitalize">{app.applying_for_class?.replace('_', ' ')}</td>
                    <td className="p-3 text-sm">{app.mobile}</td>
                    <td className="p-3">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="enquiry_new">New</option>
                        <option value="enquiry_hot">Hot</option>
                        <option value="enquiry_warm">Warm</option>
                        <option value="enquiry_cold">Cold</option>
                        <option value="documents_pending">Docs Pending</option>
                        <option value="admitted">Admitted</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => handleAdmit(app)}
                        className="text-blue-600 hover:underline text-sm mr-3"
                      >
                        View
                      </button>
                      {app.status === 'documents_verified' && (
                        <button
                          onClick={() => handleAdmit(app)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Admit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Admit Student Modal */}
      {showAdmitModal && selectedApp && (
        <AdmitStudentModal
          application={selectedApp}
          onClose={() => {
            setShowAdmitModal(false);
            setSelectedApp(null);
          }}
          onSuccess={() => {
            setShowAdmitModal(false);
            setSelectedApp(null);
            loadApplications();
          }}
        />
      )}
    </div>
  );
};

const AdmitStudentModal = ({ application, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    section: 'A',
    academic_year: '2025-2026',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post(`/applications/${application.id}/admit`, formData);
      toast.success(`Student admitted! Roll No: ${response.data.roll_number}`);
      toast.info(`Parent login: ${response.data.parent_email} / ${response.data.parent_default_password}`);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to admit student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
          <h2 className="text-xl font-bold">Admit Student</h2>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold text-[#1e3a8a]">{application.student_name}</p>
            <p className="text-sm text-gray-600">Class: {application.applying_for_class?.replace('_', ' ').toUpperCase()}</p>
            <p className="text-sm text-gray-600">Parent: {application.parent_name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Section *</label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Academic Year *</label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="2025-2026"
                required
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p>⚠️ This will:</p>
              <ul className="list-disc ml-5 mt-1">
                <li>Generate admission & roll numbers</li>
                <li>Create parent login credentials</li>
                <li>Send notification to parent</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Admitting...' : 'Admit Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdmissionDashboard;