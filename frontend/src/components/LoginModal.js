import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { toast } from 'sonner';

const LoginModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'school_admin', label: 'School Admin' },
    { value: 'admission_officer', label: 'Admission Officer' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'finance_manager', label: 'Finance Manager' },
    { value: 'inventory_manager', label: 'Inventory Manager' },
    { value: 'parent', label: 'Parent' },
    { value: 'student', label: 'Student' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password, formData.role || null);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Login successful!');
      
      // Navigate based on role
      const roleRoutes = {
        super_admin: '/admin',
        school_admin: '/admin',
        admission_officer: '/admission',
        teacher: '/teacher',
        finance_manager: '/finance',
        inventory_manager: '/inventory',
        parent: '/parent',
        student: '/parent',
      };
      
      navigate(roleRoutes[user.role] || '/');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()} data-testid="login-modal">
        <div className="bg-gradient-to-r from-[#1e3a8a] to-blue-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">Portal Login</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              data-testid="role-select"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email / Username</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="email-input"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              data-testid="password-input"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit-button"
            className="w-full py-3 bg-[#f97316] text-white rounded-lg font-semibold hover:bg-[#f97316]/90 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-xs text-center text-gray-500 mt-4">
            Default Admin: shankarithangaraj01@gmail.com / admin123
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;