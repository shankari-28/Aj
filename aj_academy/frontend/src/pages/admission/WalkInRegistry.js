import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { publicAPI } from '../../utils/api';
import { toast } from 'sonner';

const WalkInRegistry = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    student_name: '',
    gender: 'male',
    date_of_birth: '',
    applying_for_class: 'play_group',
    source: 'walk_in',
    parent_type: 'father',
    parent_name: '',
    mobile: '',
    email: '',
    lead_status: 'enquiry_hot'
  });
  const [loading, setLoading] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await publicAPI.createApplication({
        ...formData,
        status: formData.lead_status
      });
      setReferenceNumber(response.data.reference_number);
      toast.success('Walk-in enquiry registered!');
      
      setTimeout(() => {
        navigate('/admission');
      }, 2000);
    } catch (error) {
      toast.error('Failed to register enquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1e3a8a] text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <button onClick={() => navigate('/admission')} className="flex items-center gap-2 mb-4 hover:text-[#f97316]">
            <ArrowLeft /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold">Walk-in Registry</h1>
          <p className="text-gray-200 mt-2">Register enquiries from parents who visit the school</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {referenceNumber && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">Enquiry Registered Successfully!</p>
            <p className="text-green-700 mt-1">Reference Number: <span className="font-mono font-bold">{referenceNumber}</span></p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#1e3a8a] mb-4">Lead Classification</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="lead_status"
                    value="enquiry_hot"
                    checked={formData.lead_status === 'enquiry_hot'}
                    onChange={(e) => setFormData({ ...formData, lead_status: e.target.value })}
                    className="text-[#f97316]"
                  />
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">🔥 Hot Lead</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="lead_status"
                    value="enquiry_warm"
                    checked={formData.lead_status === 'enquiry_warm'}
                    onChange={(e) => setFormData({ ...formData, lead_status: e.target.value })}
                    className="text-[#f97316]"
                  />
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">⚡ Warm Lead</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="lead_status"
                    value="enquiry_cold"
                    checked={formData.lead_status === 'enquiry_cold'}
                    onChange={(e) => setFormData({ ...formData, lead_status: e.target.value })}
                    className="text-[#f97316]"
                  />
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">❄️ Cold Lead</span>
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#1e3a8a] mb-4">Student Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Student Name *</label>
                  <input
                    type="text"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gender *</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      />
                      Male
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      />
                      Female
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Desired Class *</label>
                  <select
                    value={formData.applying_for_class}
                    onChange={(e) => setFormData({ ...formData, applying_for_class: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="play_group">PLAY GROUP</option>
                    <option value="pre_kg">PRE KG</option>
                    <option value="lkg">LKG</option>
                    <option value="ukg">UKG</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#1e3a8a] mb-4">Parent/Guardian Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Relation *</label>
                  <select
                    value={formData.parent_type}
                    onChange={(e) => setFormData({ ...formData, parent_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email ID *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#f97316] text-white rounded-lg font-semibold hover:bg-[#f97316]/90 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Walk-in Enquiry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WalkInRegistry;