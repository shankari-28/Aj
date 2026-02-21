import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, ExternalLink, Check, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const LinkSubmissionModal = ({ applicationId, isOpen, onClose }) => {
  const [link, setLink] = useState('');
  const [submittedLink, setSubmittedLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingExisting, setFetchingExisting] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (isOpen && applicationId) {
      loadExistingLink();
    }
  }, [isOpen, applicationId]);

  const loadExistingLink = async () => {
    try {
      setFetchingExisting(true);
      const res = await api.get(`/applications/${applicationId}/submitted-link`);
      if (res.data.submitted_link) {
        setSubmittedLink(res.data.submitted_link);
        setLink(res.data.submitted_link);
      }
    } catch (error) {
      console.error('Failed to load existing link:', error);
    } finally {
      setFetchingExisting(false);
    }
  };

  const validateLink = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!link.trim()) {
      toast.error('Please enter a link');
      return;
    }

    if (!validateLink(link)) {
      toast.error('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/applications/${applicationId}/submit-link`, {
        submitted_link: link
      });
      
      toast.success(submittedLink ? 'Link updated successfully!' : 'Link submitted successfully!');
      setSubmittedLink(link);
      setEditMode(false);
      setLoading(false);
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.detail || 'Failed to submit link');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Document Link Submission</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {fetchingExisting ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
            </div>
          ) : submittedLink && !editMode ? (
            // Show submitted link
            <div className="space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-3">
                  <Check className="w-5 h-5" />
                  Link Already Submitted
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Your document link has been successfully submitted and is being reviewed by the admission team.
                </p>
                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                  <p className="text-xs text-gray-500 mb-2">Current Link:</p>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
                    <a 
                      href={submittedLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#1e3a8a] font-mono text-sm truncate hover:underline flex items-center gap-2"
                    >
                      {submittedLink}
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditMode(true);
                    setLink(submittedLink);
                  }}
                  className="w-full px-4 py-2 border-2 border-[#1e3a8a] text-[#1e3a8a] rounded-lg hover:bg-blue-50 font-semibold transition"
                >
                  Update Link
                </button>
              </div>
            </div>
          ) : (
            // Form for submitting link
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Paste Your Google Drive / Cloud Storage Link *
                </label>

                {/* How-to steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    How to create &amp; share your Google Drive link:
                  </p>
                  <ol className="list-decimal list-inside text-xs text-blue-900 space-y-1.5">
                    <li>Go to <strong>drive.google.com</strong> and sign in with your Google account.</li>
                    <li>Click <strong>+ New → Folder</strong> and name it (e.g., <em>AJ Academy Documents</em>).</li>
                    <li>Upload all required documents into that folder.</li>
                    <li>Right-click the folder → <strong>Share</strong> → <strong>Change to Anyone with the link</strong> → set permission to <strong>Viewer</strong>.</li>
                    <li>Click <strong>Copy link</strong>.</li>
                    <li><strong>Paste the copied link</strong> in the field below and click Submit.</li>
                  </ol>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 You can also use Dropbox, OneDrive, or any cloud storage — ensure the link is publicly viewable.
                  </p>
                </div>

                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Paste your Google Drive link here — e.g. https://drive.google.com/drive/folders/XXXXXXXXXX?usp=sharing"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none transition"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  The link must start with <code>https://</code> and be set to "Anyone with the link can view".
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-[#1e3a8a] p-4 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Required Documents:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                  <li>Birth Certificate</li>
                  <li>Aadhaar Card</li>
                  <li>Passport Photo</li>
                  <li>Transfer Certificate (if applicable)</li>
                  <li>Medical Certificate (if applicable)</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (editMode) {
                      setEditMode(false);
                      setLink(submittedLink);
                    } else {
                      onClose();
                    }
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
                >
                  {editMode && submittedLink ? 'Cancel' : 'Close'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white rounded-lg hover:from-[#1e3a8a]/90 hover:to-[#1e40af]/90 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {submittedLink && !editMode ? 'Update' : 'Submit'} Link
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkSubmissionModal;
