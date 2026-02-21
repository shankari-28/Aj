import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { publicAPI } from '../utils/api';
import { toast } from 'sonner';

const NewApplicationModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    branch: 'Medavakkam, Chennai',
    student_name: '',
    gender: 'male',
    date_of_birth: '',
    applying_for_class: 'play_group',
    source: 'newspapers',
    parent_type: 'father',
    parent_name: '',
    mobile: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState(null);
  const successMessageRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await publicAPI.createApplication(formData);
      setReferenceNumber(response.data.reference_number);
      toast.success('Application submitted successfully!');
      
      // Scroll to success message after a brief delay to allow it to render
      setTimeout(() => {
        if (successMessageRef.current) {
          successMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        alert(`Application Submitted!\n\nYour Reference Number: ${response.data.reference_number}\n\nWe will contact you via mobile/email within 2-3 business days.`);
      }, 300);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="new-application-modal">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#1e3a8a]">New Application</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {referenceNumber && (
          <div ref={successMessageRef} className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="success-message">
            <p className="text-green-800 font-semibold">Application Submitted Successfully!</p>
            <p className="text-green-700 mt-1">Reference Number: <span className="font-mono font-bold">{referenceNumber}</span></p>
            <p className="text-sm text-green-600 mt-2">Please save this number for tracking your application.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch *</label>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
              required
            >
              <option>Medavakkam, Chennai</option>
            </select>
          </div>

          {/* Student Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Name *</label>
              <input
                type="text"
                name="student_name"
                value={formData.student_name}
                onChange={handleChange}
                data-testid="student-name-input"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span>Male</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span>Female</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                data-testid="dob-input"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Applying For Class *</label>
              <select
                name="applying_for_class"
                value={formData.applying_for_class}
                onChange={handleChange}
                data-testid="class-select"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                required
              >
                <option value="play_group">PLAY GROUP</option>
                <option value="pre_kg">PRE KG</option>
                <option value="lkg">LKG</option>
                <option value="ukg">UKG</option>
              </select>
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">How did you know about us? *</label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
              required
            >
              <option value="newspapers">Newspapers</option>
              <option value="sibling_reference">Sibling Reference</option>
              <option value="social_media">Social Media</option>
              <option value="school_banners">School Banners</option>
              <option value="friends_relatives">Friends & Relatives</option>
              <option value="others">Others</option>
            </select>
          </div>

          {/* Parent Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#1e3a8a] mb-4">Parent/Guardian Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent/Guardian Type *</label>
                <select
                  name="parent_type"
                  value={formData.parent_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                  required
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleChange}
                  data-testid="parent-name-input"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  data-testid="mobile-input"
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email ID *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  data-testid="email-input"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            data-testid="submit-application-button"
            className="w-full py-3 bg-[#f97316] text-white rounded-lg font-semibold hover:bg-[#f97316]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewApplicationModal;