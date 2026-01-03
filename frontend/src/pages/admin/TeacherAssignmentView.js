import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import api from '../../utils/api';
import { toast } from 'sonner';

const TeacherAssignmentView = () => {
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    teacher_id: '',
    standard: 'play_group',
    section: 'A',
    academic_year: '2025-2026',
    is_class_teacher: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teachersRes, assignmentsRes] = await Promise.all([
        adminAPI.getUsers(),
        api.get('/teachers/assignments')
      ]);
      setTeachers(teachersRes.data.filter(u => u.role === 'teacher'));
      setAssignments(assignmentsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teachers/assign', formData);
      toast.success('Teacher assigned successfully!');
      setShowModal(false);
      loadData();
      setFormData({
        teacher_id: '',
        standard: 'play_group',
        section: 'A',
        academic_year: '2025-2026',
        is_class_teacher: false
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign teacher');
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.full_name || 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-[#1e3a8a]">Teacher Assignments</h3>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90"
        >
          Assign Teacher
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {assignments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No assignments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Teacher</th>
                  <th className="text-left p-3">Class</th>
                  <th className="text-left p-3">Section</th>
                  <th className="text-left p-3">Year</th>
                  <th className="text-left p-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => (
                  <tr key={assignment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{getTeacherName(assignment.teacher_id)}</td>
                    <td className="p-3 capitalize">{assignment.standard?.replace('_', ' ')}</td>
                    <td className="p-3">{assignment.section}</td>
                    <td className="p-3">{assignment.academic_year}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        assignment.is_class_teacher 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.is_class_teacher ? 'Class Teacher' : 'Assistant'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">Assign Teacher</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Teacher *</label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Choose teacher...</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Standard *</label>
                <select
                  value={formData.standard}
                  onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
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
                <label className="block text-sm font-medium mb-2">Section *</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Academic Year *</label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="2025-2026"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="class_teacher"
                  checked={formData.is_class_teacher}
                  onChange={(e) => setFormData({ ...formData, is_class_teacher: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="class_teacher" className="text-sm">Assign as Class Teacher</label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentView;