import React, { useState } from 'react';
import { activitiesAPI } from '../../utils/api';
import { toast } from 'sonner';

const DailyActivitiesView = ({ students }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    rhymes: '',
    activities: '',
    food_habits: '',
    nap_status: '',
    behavior_notes: '',
    homework: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setLoading(true);
    try {
      await activitiesAPI.create({
        ...formData,
        student_id: selectedStudent.id
      });
      toast.success('Daily activity saved!');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        rhymes: '',
        activities: '',
        food_habits: '',
        nap_status: '',
        behavior_notes: '',
        homework: '',
        remarks: ''
      });
      setSelectedStudent(null);
    } catch (error) {
      toast.error('Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-2xl font-bold text-[#1e3a8a] mb-6">Daily Activities</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Student *</label>
              <select
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  const student = students.find(s => s.id === e.target.value);
                  setSelectedStudent(student);
                }}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Choose student...</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.student_name} - {student.roll_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rhymes Done</label>
            <input
              type="text"
              value={formData.rhymes}
              onChange={(e) => setFormData({ ...formData, rhymes: e.target.value })}
              placeholder="e.g., Twinkle Twinkle Little Star"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Activities Conducted</label>
            <textarea
              value={formData.activities}
              onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
              placeholder="e.g., Coloring, Building blocks, Story time"
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Food Habits</label>
              <select
                value={formData.food_habits}
                onChange={(e) => setFormData({ ...formData, food_habits: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select...</option>
                <option value="ate_well">Ate Well</option>
                <option value="ate_partially">Ate Partially</option>
                <option value="did_not_eat">Did Not Eat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nap Status</label>
              <select
                value={formData.nap_status}
                onChange={(e) => setFormData({ ...formData, nap_status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select...</option>
                <option value="slept_well">Slept Well</option>
                <option value="slept_partially">Slept Partially</option>
                <option value="did_not_sleep">Did Not Sleep</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Behavior Notes</label>
            <textarea
              value={formData.behavior_notes}
              onChange={(e) => setFormData({ ...formData, behavior_notes: e.target.value })}
              placeholder="Any behavioral observations..."
              className="w-full px-4 py-2 border rounded-lg"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Homework</label>
            <input
              type="text"
              value={formData.homework}
              onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
              placeholder="e.g., Practice writing numbers 1-10"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">General Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Any additional notes for parents..."
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#f97316] text-white rounded-lg font-semibold hover:bg-[#f97316]/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Daily Activity'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DailyActivitiesView;