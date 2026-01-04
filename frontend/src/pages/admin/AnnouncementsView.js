import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Trash2, Users, Bell, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

const AnnouncementsView = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_roles: [],
    target_classes: []
  });

  const roles = [
    { value: 'parent', label: 'Parents' },
    { value: 'teacher', label: 'Teachers' },
    { value: 'admission_officer', label: 'Admission Officers' },
    { value: 'finance_manager', label: 'Finance Managers' },
  ];

  const classes = [
    { value: 'play_group', label: 'Play Group' },
    { value: 'pre_kg', label: 'Pre KG' },
    { value: 'lkg', label: 'LKG' },
    { value: 'ukg', label: 'UKG' },
  ];

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data);
    } catch (error) {
      toast.error('Failed to load announcements');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/announcements', formData);
      toast.success(`Announcement sent to ${res.data.notifications_sent} users!`);
      setShowCreate(false);
      setFormData({ title: '', message: '', target_roles: [], target_classes: [] });
      loadAnnouncements();
    } catch (error) {
      toast.error('Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement deleted');
      loadAnnouncements();
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const sendFeeReminders = async () => {
    if (!window.confirm('Send fee reminders to all parents with outstanding dues?')) return;
    
    try {
      const res = await api.post('/notifications/fee-reminder');
      toast.success(`Fee reminders sent to ${res.data.reminders_sent} parents!`);
    } catch (error) {
      toast.error('Failed to send fee reminders');
    }
  };

  const toggleRole = (role) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }));
  };

  const toggleClass = (cls) => {
    setFormData(prev => ({
      ...prev,
      target_classes: prev.target_classes.includes(cls)
        ? prev.target_classes.filter(c => c !== cls)
        : [...prev.target_classes, cls]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-[#1e3a8a]">Announcements & Notifications</h3>
        <div className="flex gap-3">
          <button
            onClick={sendFeeReminders}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            <Bell className="w-4 h-4" />
            Send Fee Reminders
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90"
          >
            <Megaphone className="w-4 h-4" />
            New Announcement
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h4 className="font-semibold mb-4">Recent Announcements</h4>
        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(announcement => (
              <div key={announcement.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-semibold text-[#1e3a8a]">{announcement.title}</h5>
                    <p className="text-gray-600 mt-1">{announcement.message}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>{new Date(announcement.created_at).toLocaleString()}</span>
                      {announcement.target_roles?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {announcement.target_roles.join(', ')}
                        </span>
                      )}
                      {announcement.target_classes?.length > 0 && (
                        <span>Classes: {announcement.target_classes.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Megaphone className="w-6 h-6" />
                Create Announcement
              </h2>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Announcement title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg h-32 resize-none"
                  placeholder="Write your announcement message..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Audience (leave empty for all)</label>
                <div className="flex flex-wrap gap-2">
                  {roles.map(role => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => toggleRole(role.value)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.target_roles.includes(role.value)
                          ? 'bg-[#1e3a8a] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Classes (for parents)</label>
                <div className="flex flex-wrap gap-2">
                  {classes.map(cls => (
                    <button
                      key={cls.value}
                      type="button"
                      onClick={() => toggleClass(cls.value)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.target_classes.includes(cls.value)
                          ? 'bg-[#f97316] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cls.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="flex items-center gap-2 text-blue-800">
                  <CheckCircle className="w-4 h-4" />
                  Notifications will be sent to all selected users immediately.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsView;
