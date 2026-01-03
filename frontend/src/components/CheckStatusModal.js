import React, { useState } from 'react';
import { X } from 'lucide-react';
import { publicAPI } from '../utils/api';
import { toast } from 'sonner';

const CheckStatusModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    reference_number: '',
    date_of_birth: '',
  });
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await publicAPI.checkStatus(formData);
      setApplication(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Application not found. Please check your details.');
        setApplication({ notFound: true });
      } else {
        toast.error('Failed to check status');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status?.includes('hot')) return 'bg-green-100 text-green-800 border-green-200';
    if (status?.includes('warm')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (status?.includes('cold')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
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
          {!application ? (
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
                {loading ? 'Checking...' : 'Check Status'}
              </button>
            </form>
          ) : application.notFound ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" data-testid="not-found-message">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-xl font-bold text-red-800 mb-2">Application Not Found</h3>
              <p className="text-red-700 mb-4">Please recheck your reference number and date of birth.</p>
              <p className="text-sm text-red-600">If the issue persists, please call us at +91 72008 25692</p>
              <button
                onClick={() => setApplication(null)}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4" data-testid="application-status">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Reference Number</p>
                    <p className="font-mono font-bold text-lg text-[#1e3a8a]">{application.reference_number}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(application.status)}`}>
                    {application.status?.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2">
                  <p><span className="font-semibold">Student Name:</span> {application.student_name}</p>
                  <p><span className="font-semibold">Applied Class:</span> {application.applying_for_class?.replace('_', ' ').toUpperCase()}</p>
                  <p><span className="font-semibold">Submitted Date:</span> {new Date(application.submitted_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Next Steps:</span> {application.remarks}
                </p>
              </div>
              <button
                onClick={() => setApplication(null)}
                className="w-full py-2 border border-[#1e3a8a] text-[#1e3a8a] rounded-lg hover:bg-[#1e3a8a] hover:text-white"
              >
                Check Another Application
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckStatusModal;