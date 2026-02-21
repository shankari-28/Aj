import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { publicAPI } from '../utils/api';
import { toast } from 'sonner';

const CheckStatusModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reference_number: '',
    date_of_birth: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await publicAPI.resolveTrackingToken(formData);
      const token = res.data?.tracking_token;
      if (!token) {
        toast.error('Unable to open tracking page. Please try again.');
        return;
      }
      onClose();
      navigate(`/track/${token}`);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Application not found. Please check your details.');
      } else {
        toast.error('Failed to check status');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()} data-testid="check-status-modal">
        <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-[#1e3a8a]">Check Application Status</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number *</label>
              <input
                type="text"
                placeholder="KSIS-2026-000123"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                data-testid="reference-number-input"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                data-testid="status-dob-input"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="check-status-button"
              className="w-full py-3 bg-[#1e3a8a] text-white rounded-lg font-semibold hover:bg-[#1e3a8a]/90 disabled:opacity-50"
            >
              {loading ? 'Opening...' : 'View Application Status'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckStatusModal;