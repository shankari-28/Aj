import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, DollarSign, FileText, LogOut, Menu, X, TrendingUp, AlertCircle } from 'lucide-react';
import { feesAPI } from '../../utils/api';
import api from '../../utils/api';
import { toast } from 'sonner';
import FeeManagementView from './FeeManagementView';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalCollected: 0,
    pendingFees: 0,
    overdue: 0,
    totalStudents: 0
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get all payments
      const studentsRes = await api.get('/students');
      const students = studentsRes.data;
      
      // Calculate stats
      let totalCollected = 0;
      for (const student of students) {
        try {
          const paymentsRes = await feesAPI.getStudentPayments(student.id);
          const payments = paymentsRes.data;
          totalCollected += payments
            .filter(p => p.payment_status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);
        } catch (e) {
          // No payments for this student
        }
      }
      
      setStats({
        totalCollected,
        pendingFees: 0, // Would need fee structure comparison
        overdue: 0,
        totalStudents: students.length
      });
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fees', label: 'Fee Management', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

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
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === item.id ? 'bg-blue-700' : 'hover:bg-blue-700'
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
          {activeView === 'dashboard' && (
            <>
              <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Finance Overview</h3>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Collected</p>
                      <p className="text-3xl font-bold text-[#1e3a8a]">₹{stats.totalCollected.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Pending Fees</p>
                      <p className="text-3xl font-bold text-orange-500">₹{stats.pendingFees.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Overdue</p>
                      <p className="text-3xl font-bold text-red-500">₹{stats.overdue.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Students</p>
                      <p className="text-3xl font-bold text-[#1e3a8a]">{stats.totalStudents}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h4 className="text-lg font-bold text-[#1e3a8a] mb-4">Quick Actions</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveView('fees')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#f97316] hover:bg-orange-50 transition-all text-center"
                  >
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-[#f97316]" />
                    <p className="font-semibold">Collect Fee</p>
                    <p className="text-sm text-gray-500">Record offline payments</p>
                  </button>
                  <button
                    onClick={() => setActiveView('fees')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#1e3a8a] hover:bg-blue-50 transition-all text-center"
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2 text-[#1e3a8a]" />
                    <p className="font-semibold">Fee Structure</p>
                    <p className="text-sm text-gray-500">Manage fee configurations</p>
                  </button>
                  <button
                    onClick={() => setActiveView('reports')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center"
                  >
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="font-semibold">View Reports</p>
                    <p className="text-sm text-gray-500">Daily & monthly collection</p>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeView === 'fees' && <FeeManagementView />}

          {activeView === 'reports' && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">Reports Module</h3>
              <p className="text-gray-500">Coming soon - Daily collection reports, outstanding dues, and more.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;