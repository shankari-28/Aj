import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Activity, FileText, LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

const ParentDashboard = () => {
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
    <div className="flex h-screen bg-gray-50" data-testid="parent-dashboard">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1e3a8a] text-white transition-all flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          {sidebarOpen && <h1 className="text-xl font-bold">Parent Portal</h1>}
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
            <User className="w-5 h-5" />
            {sidebarOpen && <span>My Child</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700">
            <Activity className="w-5 h-5" />
            {sidebarOpen && <span>Daily Activities</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700">
            <FileText className="w-5 h-5" />
            {sidebarOpen && <span>Fee Status</span>}
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
          <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Your Child's Progress</h3>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-600">View your child's attendance, daily activities, and fee status here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;