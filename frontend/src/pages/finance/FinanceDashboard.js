import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, DollarSign, FileText, LogOut, Menu, X } from 'lucide-react';
import { feesAPI } from '../../utils/api';
import { toast } from 'sonner';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50" data-testid="finance-dashboard">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1e3a8a] text-white transition-all flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          {sidebarOpen && <h1 className="text-xl font-bold">Finance Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700">
            <LayoutDashboard className="w-5 h-5" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700">
            <DollarSign className="w-5 h-5" />
            {sidebarOpen && <span>Fee Management</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700">
            <FileText className="w-5 h-5" />
            {sidebarOpen && <span>Reports</span>}
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
        <div className="bg-white shadow-sm border-b p-6">
          <h2 className="text-2xl font-bold text-[#1e3a8a]">Welcome, {user?.full_name}</h2>
        </div>

        <div className="p-6">
          <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Finance Dashboard</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Total Collected</p>
              <p className="text-3xl font-bold text-[#1e3a8a]">₹0</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Pending Fees</p>
              <p className="text-3xl font-bold text-orange-500">₹0</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Overdue</p>
              <p className="text-3xl font-bold text-red-500">₹0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;