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
    </div>
  );
};

export default AdmissionDashboard;