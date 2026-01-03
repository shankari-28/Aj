import React, { useState, useEffect } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

const AttendanceView = ({ teacherId }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [teacherId]);

  const loadStudents = async () => {
    try {
      const res = await api.get(`/teachers/${teacherId}/students`);
      setStudents(res.data);
      
      // Initialize attendance state
      const initialAttendance = {};
      res.data.forEach(student => {
        initialAttendance[student.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const attendanceList = students.map(student => ({
        student_id: student.id,
        status: attendance[student.id] || 'present',
        remarks: ''
      }));

      await api.post('/attendance/bulk', {
        date,
        standard: students[0]?.current_class || 'lkg',
        section: students[0]?.section || 'A',
        attendance_list: attendanceList
      });

      toast.success('Attendance marked successfully!');
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const markAllPresent = () => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student.id] = 'present';
    });
    setAttendance(newAttendance);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#1e3a8a]">Mark Attendance</h3>
          <div className="flex gap-3 items-center">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <button
              onClick={markAllPresent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Mark All Present
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {students.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No students assigned yet</p>
          ) : (
            students.map(student => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-[#1e3a8a]">{student.student_name}</p>
                  <p className="text-sm text-gray-600">
                    Roll No: {student.roll_number} | Class: {student.current_class?.replace('_', ' ').toUpperCase()}-{student.section}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAttendanceChange(student.id, 'present')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      attendance[student.id] === 'present'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    Present
                  </button>
                  <button
                    onClick={() => handleAttendanceChange(student.id, 'absent')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      attendance[student.id] === 'absent'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    Absent
                  </button>
                  <button
                    onClick={() => handleAttendanceChange(student.id, 'half_day')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      attendance[student.id] === 'half_day'
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Half Day
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {students.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full py-3 bg-[#f97316] text-white rounded-lg font-semibold hover:bg-[#f97316]/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Submit Attendance'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AttendanceView;