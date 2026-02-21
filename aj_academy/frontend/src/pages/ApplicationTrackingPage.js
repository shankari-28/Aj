import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, FileText, Mail, Phone, Calendar, User, School, CreditCard } from 'lucide-react';
import { publicAPI } from '../utils/api';
import { toast } from 'sonner';
import ajAcademyLogo from '../assets/aj-academy-logo.png';

const ApplicationTrackingPage = () => {
  const { trackingToken } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentLink, setDocumentLink] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [paymentReceiptLink, setPaymentReceiptLink] = useState('');
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  const loadApplication = useCallback(async () => {
    try {
      const response = await publicAPI.getApplicationByTrackingToken(trackingToken);
      setApplication(response.data);
      setDocumentLink(response.data?.documents_link || '');
      setPaymentReceiptLink(response.data?.payment_receipt_link || '');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Application not found. Please check your link.');
      } else {
        toast.error('Failed to load application details');
      }
    } finally {
      setLoading(false);
    }
  }, [trackingToken]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handleSubmitDocuments = async (e) => {
    e.preventDefault();
    const link = documentLink.trim();
    if (!link) {
      toast.error('Please paste your Google Drive / Dropbox link');
      return;
    }

    setSubmittingDoc(true);
    try {
      await publicAPI.submitDocumentsByTrackingToken(trackingToken, { documents_link: link });
      toast.success('Documents link submitted successfully!');
      setApplication((prev) => prev ? { ...prev, documents_link: link } : prev);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit documents link');
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleSubmitPaymentReceipt = async (e) => {
    e.preventDefault();
    const link = paymentReceiptLink.trim();
    if (!link) {
      toast.error('Please paste your payment receipt link');
      return;
    }
    setSubmittingReceipt(true);
    try {
      await publicAPI.submitPaymentReceiptByTrackingToken(trackingToken, { payment_receipt_link: link });
      toast.success('Payment receipt submitted successfully!');
      setApplication((prev) => prev ? { ...prev, payment_receipt_link: link } : prev);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit payment receipt');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const getStatusColor = (status) => {
    if (status?.includes('hot')) return 'bg-red-100 text-red-800 border-red-300';
    if (status?.includes('warm')) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (status?.includes('cold')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (status === 'documents_pending') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (status === 'documents_verified') return 'bg-green-100 text-green-800 border-green-300';
    if (status === 'payment_pending') return 'bg-purple-100 text-purple-800 border-purple-300';
    if (status === 'admitted') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (status === 'rejected') return 'bg-red-100 text-red-800 border-red-300';
    if (status === 'on_hold') return 'bg-gray-100 text-gray-800 border-gray-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    if (status === 'documents_verified' || status === 'admitted') {
      return <CheckCircle className="w-5 h-5" />;
    }
    if (status === 'documents_pending' || status === 'payment_pending') {
      return <Clock className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const getStatusMessage = (status) => {
    const messages = {
      'enquiry_new': 'Your application has been received and is under review.',
      'enquiry_hot': 'Your application is being prioritized. We will contact you soon.',
      'enquiry_warm': 'Your application is being reviewed. We will contact you shortly.',
      'enquiry_cold': 'Your application is on file. We will contact you if needed.',
      'documents_pending': 'We require additional documents to proceed with your application. Please submit them as soon as possible.',
      'documents_verified': 'Your documents have been verified. We will proceed with the next steps.',
      'payment_pending': 'Your documents are verified. Please complete the fee payment to proceed.',
      'admitted': 'Congratulations! Your application has been accepted. Welcome to Kid Scholars!',
      'rejected': 'We regret to inform you that your application was not accepted.',
      'on_hold': 'Your application is currently on hold. We will contact you with updates.'
    };
    return messages[status] || 'Your application is being processed.';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Application Not Found</h1>
          <p className="text-gray-600 mb-6">
            The application link you're trying to access is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e3a8a]/90 transition"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-orange-300 mb-4 inline-flex items-center gap-2"
          >
            ← Back to Homepage
          </button>
          <img
            src={ajAcademyLogo}
            alt="AJ Academy"
            className="h-16 w-16 rounded-full object-cover mx-auto mb-3 bg-white/90"
          />
          <h1 className="text-4xl font-bold text-white mb-2">Application Status</h1>
          <p className="text-blue-100">Track your admission application in real-time</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Status Badge */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full bg-white/20 text-white`}>
                  {getStatusIcon(application.status)}
                </div>
                <div>
                  <p className="text-white/80 text-sm">Current Status</p>
                  <p className="text-white text-xl font-bold">{formatStatus(application.status)}</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full border-2 ${getStatusColor(application.status)}`}>
                <span className="font-semibold">{formatStatus(application.status)}</span>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="p-6 space-y-6">
            {/* Status Message */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-gray-700">{getStatusMessage(application.status)}</p>
              {application.remarks && (
                <p className="text-gray-600 mt-2 text-sm italic">Note: {application.remarks}</p>
              )}
            </div>

            {/* Student Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#1e3a8a]" />
                  Student Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Student Name</p>
                    <p className="text-lg font-semibold text-gray-800">{application.student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Branch</p>
                    <p className="text-lg font-semibold text-gray-800">{application.branch || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {application.gender ? application.gender.replace(/_/g, ' ').toUpperCase() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Applied Class</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {application.applying_for_class?.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {application.date_of_birth ? new Date(application.date_of_birth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <School className="w-5 h-5 text-[#1e3a8a]" />
                  Application Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Reference Number</p>
                    <p className="text-lg font-mono font-bold text-[#1e3a8a]">
                      {application.reference_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted Date</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {application.submitted_date ? new Date(application.submitted_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">How you came to know about us</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {application.source ? application.source.replace(/_/g, ' ').toUpperCase() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            {(application.parent_name || application.email || application.mobile) && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#1e3a8a]" />
                  Parent/Guardian Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {application.parent_type && (
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-semibold text-gray-800">{application.parent_type.replace(/_/g, ' ').toUpperCase()}</p>
                      </div>
                    </div>
                  )}
                  {application.parent_name && (
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-semibold text-gray-800">{application.parent_name}</p>
                      </div>
                    </div>
                  )}
                  {application.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-gray-800">{application.email}</p>
                      </div>
                    </div>
                  )}
                  {application.mobile && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Mobile</p>
                        <p className="font-semibold text-gray-800">{application.mobile}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {application.status === 'documents_pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Next Steps
                </h3>
                <ul className="list-disc list-inside space-y-2 text-yellow-800">
                  <li>Please submit the required documents as soon as possible</li>
                  <li>Paste your Google Drive / Dropbox link below (set access to “Anyone with the link can view”)</li>
                  <li>Our team will review your documents and update the status</li>
                  <li>You will receive an email notification once documents are verified</li>
                </ul>

                <form onSubmit={handleSubmitDocuments} className="mt-5 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-yellow-900 mb-2">
                      Documents Drive Link
                    </label>
                    <input
                      type="url"
                      value={documentLink}
                      onChange={(e) => setDocumentLink(e.target.value)}
                      placeholder="https://drive.google.com/... (Anyone with link can view)"
                      className="w-full px-4 py-2 border-2 border-yellow-200 rounded-lg bg-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20"
                    />
                    {application.documents_link && (
                      <p className="text-xs text-yellow-800 mt-2 break-all">
                        Current submitted link:{" "}
                        <a
                          href={application.documents_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1e3a8a] underline"
                        >
                          Open
                        </a>
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submittingDoc}
                    className="px-5 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 disabled:opacity-50"
                  >
                    {submittingDoc ? 'Submitting...' : 'Submit Link'}
                  </button>
                </form>
              </div>
            )}

            {/* Payment Pending Section */}
            {application.status === 'payment_pending' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Fee Payment Required
                </h3>
                <p className="text-purple-800 mb-4">
                  Please make the fee payment using the bank details below, then upload your payment receipt.
                </p>

                {/* Bank Details Card */}
                {/* 🔧 TO CHANGE BANK DETAILS: update env vars in Render: BANK_NAME, BANK_ACCOUNT_HOLDER, BANK_ACCOUNT_NUMBER, BANK_IFSC, BANK_BRANCH, BANK_UPI_ID */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-bold text-blue-900 mb-3">🏦 Bank / Payment Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Bank Name</span>
                    <span className="font-semibold text-blue-900">Indian Bank</span>
                    <span className="text-gray-500">Account Holder</span>
                    <span className="font-semibold text-blue-900">AJ Academy</span>
                    <span className="text-gray-500">Account Number</span>
                    <span className="font-semibold text-blue-900 font-mono tracking-wider">678900123456</span>
                    <span className="text-gray-500">IFSC Code</span>
                    <span className="font-semibold text-blue-900 font-mono">IDIB000M123</span>
                    <span className="text-gray-500">Branch</span>
                    <span className="font-semibold text-blue-900">Medavakkam, Chennai</span>
                  </div>
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-green-700 text-xs mb-1">Or pay via UPI</p>
                    <p className="text-green-800 font-bold text-xl tracking-wide">ajacademy@ibl</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 text-sm text-yellow-800">
                  <strong>⚠️ After making the payment:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Take a screenshot or download the payment confirmation</li>
                    <li>Upload it to Google Drive / Dropbox / any cloud storage</li>
                    <li>Set sharing to "Anyone with the link can view"</li>
                    <li>Paste the link below and click Submit</li>
                  </ul>
                </div>

                <form onSubmit={handleSubmitPaymentReceipt} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Payment Receipt Link
                    </label>
                    <input
                      type="url"
                      value={paymentReceiptLink}
                      onChange={(e) => setPaymentReceiptLink(e.target.value)}
                      placeholder="https://drive.google.com/... (paste receipt link here)"
                      className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg bg-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20"
                    />
                    {application.payment_receipt_link && (
                      <p className="text-xs text-purple-700 mt-2 break-all">
                        ✅ Receipt already submitted:{" "}
                        <a
                          href={application.payment_receipt_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1e3a8a] underline"
                        >
                          Open
                        </a>
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReceipt}
                    className="px-5 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 disabled:opacity-50"
                  >
                    {submittingReceipt ? 'Submitting...' : 'Submit Receipt'}
                  </button>
                </form>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3">Need Help?</h3>
              <p className="text-gray-600 mb-2">
                If you have any questions about your application, please contact our admission team.
              </p>
              <p className="text-sm text-gray-500">
                Email: admissions@kidscholars.edu | Phone: +91 7200825692
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>This page will automatically update when your application status changes.</p>
          <p className="mt-1">Bookmark this page to check your status anytime.</p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationTrackingPage;
