import React, { useState, useEffect } from 'react';
import { Upload, File, Check, X, Eye } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const DocumentManagement = ({ applicationId, onClose }) => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    document_type: 'birth_certificate',
    document_name: '',
    file_url: ''
  });

  const documentTypes = [
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'transfer_certificate', label: 'Transfer Certificate' },
    { value: 'aadhar_card', label: 'Aadhar Card' },
    { value: 'photo', label: 'Student Photo' },
    { value: 'address_proof', label: 'Address Proof' },
    { value: 'medical_records', label: 'Medical Records' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const loadDocuments = async () => {
    try {
      const res = await api.get(`/documents/${applicationId}`);
      setDocuments(res.data);
    } catch (error) {
      console.error('Failed to load documents');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For demo, we'll use a placeholder URL
      // In production, upload to cloud storage (S3, Cloudinary, etc.)
      const fileUrl = `https://storage.example.com/documents/${Date.now()}-${file.name}`;
      setUploadForm({
        ...uploadForm,
        document_name: file.name,
        file_url: fileUrl
      });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      await api.post('/documents/upload', {
        application_id: applicationId,
        ...uploadForm
      });
      toast.success('Document uploaded successfully!');
      setUploadForm({
        document_type: 'birth_certificate',
        document_name: '',
        file_url: ''
      });
      loadDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const updateDocumentStatus = async (docId, status) => {
    try {
      await api.patch(`/documents/${docId}`, { status });
      toast.success(`Document marked as ${status}`);
      loadDocuments();
    } catch (error) {
      toast.error('Failed to update document status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <File className="w-4 h-4" /> },
      verified: { color: 'bg-green-100 text-green-800', icon: <Check className="w-4 h-4" /> },
      rejected: { color: 'bg-red-100 text-red-800', icon: <X className="w-4 h-4" /> }
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl flex justify-between items-center sticky top-0">
          <h2 className="text-2xl font-bold">Document Management</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#1e3a8a] mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" /> Upload Document
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Document Type *</label>
                  <select
                    value={uploadForm.document_type}
                    onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Select File *</label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={uploading || !uploadForm.file_url}
                className="w-full py-3 bg-[#f97316] text-white rounded-lg font-semibold hover:bg-[#f97316]/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? 'Uploading...' : (
                  <>
                    <Upload className="w-5 h-5" /> Upload Document
                  </>
                )}
              </button>
            </form>
            <p className="text-xs text-gray-600 mt-3">
              ℹ️ Supported formats: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>

          {/* Documents List */}
          <div>
            <h3 className="text-lg font-semibold text-[#1e3a8a] mb-4">Uploaded Documents</h3>
            {documents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <File className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const statusBadge = getStatusBadge(doc.status);
                  return (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <File className="w-8 h-8 text-[#1e3a8a]" />
                          <div>
                            <p className="font-semibold">
                              {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                            </p>
                            <p className="text-sm text-gray-600">{doc.document_name}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusBadge.color}`}>
                            {statusBadge.icon}
                            {doc.status}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(doc.file_url, '_blank')}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                            {doc.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateDocumentStatus(doc.id, 'verified')}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                >
                                  ✓ Verify
                                </button>
                                <button
                                  onClick={() => updateDocumentStatus(doc.id, 'rejected')}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                >
                                  ✗ Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;