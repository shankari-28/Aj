import React, { useState, useEffect } from 'react';
import { Upload, FileText, Check, X, Eye, Trash2, Download, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const DocumentUpload = ({ applicationId, readOnly = false }) => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('birth_certificate');
  const [previewDoc, setPreviewDoc] = useState(null);

  const documentTypes = [
    { value: 'birth_certificate', label: 'Birth Certificate', required: true },
    { value: 'aadhaar_card', label: 'Aadhaar Card', required: true },
    { value: 'photo', label: 'Passport Photo', required: true },
    { value: 'transfer_certificate', label: 'Transfer Certificate', required: false },
    { value: 'medical_certificate', label: 'Medical Certificate', required: false },
    { value: 'address_proof', label: 'Address Proof', required: false },
    { value: 'other', label: 'Other Document', required: false },
  ];

  useEffect(() => {
    if (applicationId) {
      loadDocuments();
    }
  }, [applicationId]);

  const loadDocuments = async () => {
    try {
      const res = await api.get(`/documents/application/${applicationId}`);
      setDocuments(res.data);
    } catch (error) {
      console.error('Failed to load documents');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and PDF files are allowed');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await api.post('/documents/upload-file', {
        application_id: applicationId,
        document_type: selectedType,
        document_name: file.name,
        file_data: base64,
        file_type: file.type
      });

      toast.success('Document uploaded successfully!');
      loadDocuments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleVerify = async (docId, status) => {
    try {
      await api.patch(`/documents/${docId}/verify?status=${status}`);
      toast.success(`Document ${status}!`);
      loadDocuments();
    } catch (error) {
      toast.error('Failed to update document status');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document deleted');
      loadDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handlePreview = async (docId) => {
    try {
      const res = await api.get(`/documents/download/${docId}`);
      setPreviewDoc(res.data);
    } catch (error) {
      toast.error('Failed to load document');
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const res = await api.get(`/documents/download/${docId}`);
      const byteCharacters = atob(res.data.file_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: res.data.file_type });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      verified: { color: 'bg-green-100 text-green-800', label: 'Verified ✓' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected ✗' },
    };
    return badges[status] || badges.pending;
  };

  const getDocumentStatus = (type) => {
    const doc = documents.find(d => d.document_type === type);
    return doc ? doc.status : null;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!readOnly && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h4 className="font-semibold mb-4">Upload Document</h4>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Document Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} {type.required ? '*' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  disabled={uploading}
                />
                <span className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                  uploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#f97316] hover:bg-[#f97316]/90 cursor-pointer'
                } text-white`}>
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Uploading...' : 'Choose File'}
                </span>
              </label>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Supported: JPG, PNG, PDF (Max 5MB)</p>
        </div>
      )}

      {/* Document Checklist */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h4 className="font-semibold mb-4">Required Documents Checklist</h4>
        <div className="grid md:grid-cols-2 gap-3">
          {documentTypes.filter(t => t.required).map(type => {
            const status = getDocumentStatus(type.value);
            return (
              <div 
                key={type.value}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  status === 'verified' ? 'bg-green-50 border-green-200' :
                  status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                  status === 'rejected' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                {status === 'verified' ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : status === 'rejected' ? (
                  <X className="w-5 h-5 text-red-600" />
                ) : status === 'pending' ? (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
                <span className={`text-sm ${
                  status ? 'font-medium' : 'text-gray-500'
                }`}>
                  {type.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h4 className="font-semibold mb-4">Uploaded Documents</h4>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map(doc => {
              const badge = getStatusBadge(doc.status);
              return (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <FileText className="w-10 h-10 text-[#1e3a8a]" />
                    <div>
                      <p className="font-medium">{doc.document_name}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {doc.document_type?.replace('_', ' ')} • {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                      {badge.label}
                    </span>
                    <button
                      onClick={() => handlePreview(doc.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Preview"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc.id, doc.document_name)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    {!readOnly && (
                      <>
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(doc.id, 'verified')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Verify"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleVerify(doc.id, 'rejected')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#1e3a8a] text-white p-4 rounded-t-2xl flex justify-between items-center sticky top-0">
              <h3 className="font-semibold">{previewDoc.document_name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {previewDoc.file_type?.startsWith('image/') ? (
                <img 
                  src={`data:${previewDoc.file_type};base64,${previewDoc.file_data}`}
                  alt={previewDoc.document_name}
                  className="max-w-full mx-auto"
                />
              ) : previewDoc.file_type === 'application/pdf' ? (
                <iframe
                  src={`data:application/pdf;base64,${previewDoc.file_data}`}
                  className="w-full h-[70vh]"
                  title={previewDoc.document_name}
                />
              ) : (
                <p className="text-center text-gray-500">Preview not available for this file type</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
