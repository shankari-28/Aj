import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { Plus, Edit2, Check, X } from 'lucide-react';

const AcademicSetupView = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [yearForm, setYearForm] = useState({ year: '', is_active: true });
  const [sectionForm, setSectionForm] = useState({
    standard: 'play_group',
    section_name: 'A',
    capacity: 30,
    academic_year: '2025-2026',
    teacher_id: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [yearsRes, sectionsRes] = await Promise.all([
        api.get('/academic/years'),
        api.get('/academic/sections')
      ]);
      setAcademicYears(yearsRes.data);
      setSections(sectionsRes.data);
    } catch (error) {
      console.error('Failed to load academic data');
    }
  };

  const handleCreateYear = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academic/years', yearForm);
      toast.success('Academic year created!');
      setShowYearModal(false);
      loadData();
      setYearForm({ year: '', is_active: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create academic year');
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academic/sections', sectionForm);
      toast.success('Section created!');
      setShowSectionModal(false);
      loadData();
      setSectionForm({
        standard: 'play_group',
        section_name: 'A',
        capacity: 30,
        academic_year: '2025-2026',
        teacher_id: null
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create section');
    }
  };

  return (
    <div className="space-y-8">
      {/* Academic Years */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-[#1e3a8a]">Academic Years</h3>
          <button
            onClick={() => setShowYearModal(true)}
            className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Academic Year
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {academicYears.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No academic years configured</p>
              <p className="text-sm text-gray-400">Create an academic year to start managing admissions</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {academicYears.map((year) => (
                <div
                  key={year.id}
                  className={`p-4 rounded-lg border-2 ${
                    year.is_active ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{year.year}</span>
                    {year.is_active && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Standards */}
      <div>
        <h3 className="text-2xl font-bold text-[#1e3a8a] mb-4">Standards</h3>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid md:grid-cols-4 gap-4">
            {['Play Group', 'Pre KG', 'LKG', 'UKG'].map((std) => (
              <div
                key={std}
                className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-center"
              >
                <span className="text-lg font-semibold text-[#1e3a8a]">{std}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ℹ️ These are the default standards for playschool. Contact support to add more.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-[#1e3a8a]">Sections</h3>
          <button
            onClick={() => setShowSectionModal(true)}
            className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Section
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {sections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No sections configured</p>
              <p className="text-sm text-gray-400">Create sections to organize students by class</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Standard</th>
                    <th className="text-left p-3">Section</th>
                    <th className="text-left p-3">Capacity</th>
                    <th className="text-left p-3">Academic Year</th>
                    <th className="text-left p-3">Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section) => (
                    <tr key={section.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 capitalize">{section.standard?.replace('_', ' ')}</td>
                      <td className="p-3 font-semibold">Section {section.section_name}</td>
                      <td className="p-3">{section.capacity} students</td>
                      <td className="p-3">{section.academic_year}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {section.teacher_id ? 'Assigned' : 'Not assigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Academic Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowYearModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">Create Academic Year</h2>
            </div>

            <form onSubmit={handleCreateYear} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Academic Year *</label>
                <input
                  type="text"
                  value={yearForm.year}
                  onChange={(e) => setYearForm({ ...yearForm, year: e.target.value })}
                  placeholder="e.g., 2025-2026"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={yearForm.is_active}
                  onChange={(e) => setYearForm({ ...yearForm, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm">Set as Active Year</label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSectionModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">Create Section</h2>
            </div>

            <form onSubmit={handleCreateSection} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Standard *</label>
                <select
                  value={sectionForm.standard}
                  onChange={(e) => setSectionForm({ ...sectionForm, standard: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="play_group">Play Group</option>
                  <option value="pre_kg">Pre KG</option>
                  <option value="lkg">LKG</option>
                  <option value="ukg">UKG</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Section Name *</label>
                <select
                  value={sectionForm.section_name}
                  onChange={(e) => setSectionForm({ ...sectionForm, section_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Capacity *</label>
                <input
                  type="number"
                  value={sectionForm.capacity}
                  onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                  max="100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Maximum number of students in this section</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Academic Year *</label>
                <input
                  type="text"
                  value={sectionForm.academic_year}
                  onChange={(e) => setSectionForm({ ...sectionForm, academic_year: e.target.value })}
                  placeholder="2025-2026"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicSetupView;
