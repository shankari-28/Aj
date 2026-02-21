import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { adminAPI } from '../../utils/api';
import { toast } from 'sonner';
import { Plus, Edit2, Check, X } from 'lucide-react';

const AcademicSetupView = () => {
  const location = useLocation();
  const [academicYears, setAcademicYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [standards, setStandards] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showStandardModal, setShowStandardModal] = useState(false);
  const [editingStandard, setEditingStandard] = useState(null);
  const [yearForm, setYearForm] = useState({ year: '', is_active: true });
  const [sectionForm, setSectionForm] = useState({
    standard: 'play_group',
    section_name: 'A',
    capacity: 30,
    academic_year: '',
    teacher_id: null
  });
  const [standardForm, setStandardForm] = useState({
    name: '',
    display_name: '',
    code: '',
    age_range: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Refetch when user navigates back to Academic Setup (e.g. from Teacher Management)
  useEffect(() => {
    if (location.pathname === '/admin/academic') {
      loadData();
    }
  }, [location.pathname]);

  const loadData = async () => {
    try {
      const [yearsRes, sectionsRes, standardsRes, usersRes] = await Promise.all([
        api.get('/academic/years'),
        api.get('/academic/sections'),
        api.get('/academic/standards'),
        adminAPI.getUsers().catch(() => ({ data: [] }))
      ]);
      setAcademicYears(yearsRes.data);
      setSections(sectionsRes.data);
      setStandards(standardsRes.data || []);
      setTeachers((usersRes.data || []).filter(u => u.role === 'teacher'));
    } catch (error) {
      console.error('Failed to load academic data');
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.full_name || null;
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
        academic_year: '',
        teacher_id: null
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create section');
    }
  };

  const handleCreateOrUpdateStandard = async (e) => {
    e.preventDefault();
    try {
      if (editingStandard) {
        await api.put(`/academic/standards/${editingStandard.id}`, {
          display_name: standardForm.display_name,
          age_range: standardForm.age_range,
          description: standardForm.description
        });
        toast.success('Standard updated successfully!');
      } else {
        // Auto-generate name and code from display_name
        const generatedCode = standardForm.display_name
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        
        await api.post('/academic/standards', {
          name: generatedCode,
          display_name: standardForm.display_name,
          code: generatedCode,
          age_range: standardForm.age_range,
          description: standardForm.description
        });
        toast.success('Standard created successfully!');
      }
      setShowStandardModal(false);
      setEditingStandard(null);
      loadData();
      setStandardForm({
        name: '',
        display_name: '',
        code: '',
        age_range: '',
        description: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save standard');
    }
  };

  const handleEditStandard = (standard) => {
    setEditingStandard(standard);
    setStandardForm({
      name: standard.name,
      display_name: standard.display_name,
      code: standard.code,
      age_range: standard.age_range || '',
      description: standard.description || ''
    });
    setShowStandardModal(true);
  };

  const handleDeleteStandard = async (standardId) => {
    if (!window.confirm('Are you sure you want to delete this standard? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/academic/standards/${standardId}`);
      toast.success('Standard deleted successfully!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete standard');
    }
  };

  const handleToggleStandardStatus = async (standard) => {
    try {
      await api.put(`/academic/standards/${standard.id}`, {
        is_active: !standard.is_active
      });
      toast.success(`Standard ${!standard.is_active ? 'activated' : 'deactivated'} successfully!`);
      loadData();
    } catch (error) {
      toast.error('Failed to update standard status');
    }
  };

  const handleDeleteYear = async (yearId) => {
    if (!window.confirm('Are you sure you want to delete this academic year? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/academic/years/${yearId}`);
      toast.success('Academic year deleted successfully!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete academic year');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/academic/sections/${sectionId}`);
      toast.success('Section deleted successfully!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete section');
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
                  <div className="flex justify-between items-start">
                    <span className="text-lg font-semibold">{year.year}</span>
                    <div className="flex gap-1 items-center">
                      {year.is_active && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteYear(year.id)}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Standards */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-[#1e3a8a]">Standards</h3>
          <button
            onClick={() => {
              setEditingStandard(null);
              setStandardForm({
                name: '',
                display_name: '',
                code: '',
                age_range: '',
                description: ''
              });
              setShowStandardModal(true);
            }}
            className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Standard
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          {standards.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No standards configured</p>
              <p className="text-sm text-gray-400">Add standards to organize your school classes</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {standards.map((std) => (
                <div
                  key={std.id}
                  className={`p-4 border-2 rounded-lg ${
                    std.is_active ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-300 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-lg font-semibold text-[#1e3a8a]">{std.display_name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditStandard(std)}
                        className="p-1 hover:bg-blue-100 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteStandard(std.id)}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  {std.age_range && (
                    <p className="text-sm text-gray-600 mb-1">Age: {std.age_range}</p>
                  )}
                  {std.description && (
                    <p className="text-xs text-gray-500 mb-2">{std.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={std.is_active}
                        onChange={() => handleToggleStandardStatus(std)}
                        className="w-3 h-3"
                      />
                      <span className={std.is_active ? 'text-green-600' : 'text-gray-500'}>
                        {std.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    <th className="text-left p-3">Actions</th>
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
                        {section.teacher_id ? (getTeacherName(section.teacher_id) || 'Assigned') : 'Not assigned'}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Delete Section"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
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
                  {standards.filter(s => s.is_active).map((std) => (
                    <option key={std.code} value={std.code}>
                      {std.display_name}
                    </option>
                  ))}
                  {standards.length === 0 && (
                    <>
                      <option value="play_group">Play Group</option>
                      <option value="pre_kg">Pre KG</option>
                      <option value="lkg">LKG</option>
                      <option value="ukg">UKG</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Section Name *</label>
                <input
                  type="text"
                  value={sectionForm.section_name}
                  onChange={(e) => setSectionForm({ ...sectionForm, section_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g. A, B, C or Rose, Lily..."
                  required
                />
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
                <select
                  value={sectionForm.academic_year}
                  onChange={(e) => setSectionForm({ ...sectionForm, academic_year: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((yr) => (
                    <option key={yr.id} value={yr.year}>{yr.year}</option>
                  ))}
                </select>
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

      {/* Create/Edit Standard Modal */}
      {showStandardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => {
          setShowStandardModal(false);
          setEditingStandard(null);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">
                {editingStandard ? 'Edit Standard' : 'Add New Standard'}
              </h2>
            </div>

            <form onSubmit={handleCreateOrUpdateStandard} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name *</label>
                <input
                  type="text"
                  value={standardForm.display_name}
                  onChange={(e) => setStandardForm({ ...standardForm, display_name: e.target.value })}
                  placeholder="e.g., Play Group"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Name shown to users</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Age Range</label>
                <input
                  type="text"
                  value={standardForm.age_range}
                  onChange={(e) => setStandardForm({ ...standardForm, age_range: e.target.value })}
                  placeholder="e.g., 1.5-2.5 Years"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={standardForm.description}
                  onChange={(e) => setStandardForm({ ...standardForm, description: e.target.value })}
                  placeholder="Brief description of this standard"
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStandardModal(false);
                    setEditingStandard(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90"
                >
                  {editingStandard ? 'Update Standard' : 'Create Standard'}
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
