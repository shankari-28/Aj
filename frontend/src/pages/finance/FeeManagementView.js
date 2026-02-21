import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Eye, CreditCard, FileText } from 'lucide-react';
import { feesAPI } from '../../utils/api';
import api from '../../utils/api';
import { toast } from 'sonner';

const FeeManagementView = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateStructure, setShowCreateStructure] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [structuresRes, studentsRes] = await Promise.all([
        feesAPI.getStructures(),
        api.get('/students')
      ]);
      setFeeStructures(structuresRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Failed to load data');
    }
  };

  const loadStudentPayments = async (studentId) => {
    try {
      const res = await feesAPI.getStudentPayments(studentId);
      setPayments(res.data);
    } catch (error) {
      console.error('Failed to load payments');
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    loadStudentPayments(student.id);
  };

  const calculateTotalFee = (student) => {
    const structure = feeStructures.find(f => f.standard === student.current_class);
    if (!structure) return 0;
    return structure.admission_fee + structure.tuition_fee + structure.books_fee + 
           structure.uniform_fee + structure.transport_fee;
  };

  const calculatePaid = (studentId) => {
    return payments
      .filter(p => p.student_id === studentId && p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Fee Structures */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-[#1e3a8a]">Fee Structures</h3>
          <button
            onClick={() => setShowCreateStructure(true)}
            className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90"
          >
            Create Fee Structure
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {feeStructures.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No fee structures configured</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Standard</th>
                    <th className="text-right p-3">Admission Fee</th>
                    <th className="text-right p-3">Tuition Fee</th>
                    <th className="text-right p-3">Books</th>
                    <th className="text-right p-3">Uniform</th>
                    <th className="text-right p-3">Transport</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {feeStructures.map(structure => {
                    const total = structure.admission_fee + structure.tuition_fee + 
                                  structure.books_fee + structure.uniform_fee + structure.transport_fee;
                    return (
                      <tr key={structure.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 capitalize font-semibold">{structure.standard?.replace('_', ' ')}</td>
                        <td className="p-3 text-right">₹{structure.admission_fee.toLocaleString()}</td>
                        <td className="p-3 text-right">₹{structure.tuition_fee.toLocaleString()}</td>
                        <td className="p-3 text-right">₹{structure.books_fee.toLocaleString()}</td>
                        <td className="p-3 text-right">₹{structure.uniform_fee.toLocaleString()}</td>
                        <td className="p-3 text-right">₹{structure.transport_fee.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-[#1e3a8a]">₹{total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Student Fee Management */}
      <div>
        <h3 className="text-2xl font-bold text-[#1e3a8a] mb-4">Student Fee Management</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Student List */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h4 className="font-semibold mb-4">Select Student</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map(student => (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedStudent?.id === student.id 
                      ? 'border-[#f97316] bg-orange-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-sm">{student.student_name}</p>
                  <p className="text-xs text-gray-600">{student.roll_number} • {student.current_class?.replace('_', ' ').toUpperCase()}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fee Details */}
          <div className="md:col-span-2">
            {selectedStudent ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h4 className="font-semibold mb-4">Fee Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Fee</p>
                      <p className="text-2xl font-bold text-[#1e3a8a]">₹{calculateTotalFee(selectedStudent).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Paid</p>
                      <p className="text-2xl font-bold text-green-600">₹{calculatePaid(selectedStudent.id).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Due</p>
                      <p className="text-2xl font-bold text-red-600">
                        ₹{(calculateTotalFee(selectedStudent) - calculatePaid(selectedStudent.id)).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full mt-4 py-3 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Collect Payment
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h4 className="font-semibold mb-4">Payment History</h4>
                  {payments.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No payments recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {payments.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-semibold">₹{payment.amount.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">
                              {payment.payment_mode} • {new Date(payment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              payment.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.payment_status}
                            </span>
                            {payment.receipt_number && (
                              <button className="text-blue-600 hover:underline text-sm">
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Select a student to view fee details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Collection Modal */}
      {showPaymentModal && selectedStudent && (
        <PaymentModal
          student={selectedStudent}
          totalFee={calculateTotalFee(selectedStudent)}
          paidAmount={calculatePaid(selectedStudent.id)}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadStudentPayments(selectedStudent.id);
          }}
        />
      )}

      {/* Create Fee Structure Modal */}
      {showCreateStructure && (
        <CreateFeeStructureModal
          onClose={() => setShowCreateStructure(false)}
          onSuccess={() => {
            setShowCreateStructure(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

const PaymentModal = ({ student, totalFee, paidAmount, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: totalFee - paidAmount,
    payment_mode: 'cash'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, record as offline payment
      // In production, integrate Razorpay here
      await api.post('/fee-payments/record', {
        student_id: student.id,
        amount: formData.amount,
        payment_mode: formData.payment_mode,
        payment_status: 'paid'
      });
      toast.success('Payment recorded successfully!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
          <h2 className="text-xl font-bold">Collect Payment</h2>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold text-[#1e3a8a]">{student.student_name}</p>
            <p className="text-sm text-gray-600">Roll No: {student.roll_number}</p>
            <div className="mt-2 flex justify-between text-sm">
              <span>Total Fee:</span>
              <span className="font-semibold">₹{totalFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Already Paid:</span>
              <span className="font-semibold text-green-600">₹{paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm border-t mt-2 pt-2">
              <span className="font-bold">Due Amount:</span>
              <span className="font-bold text-red-600">₹{(totalFee - paidAmount).toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Amount to Collect *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                max={totalFee - paidAmount}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Mode *</label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online (Razorpay)</option>
              </select>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p>💡 For online payments, Razorpay integration is ready. Add your keys in backend/.env</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CreateFeeStructureModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    standard: 'play_group',
    admission_fee: 5000,
    tuition_fee: 20000,
    books_fee: 3000,
    uniform_fee: 2000,
    transport_fee: 0,
    academic_year: '2025-2026'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await feesAPI.createStructure(formData);
      toast.success('Fee structure created!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to create fee structure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#1e3a8a] text-white p-6 rounded-t-2xl">
          <h2 className="text-xl font-bold">Create Fee Structure</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Admission Fee *</label>
              <input
                type="number"
                value={formData.admission_fee}
                onChange={(e) => setFormData({ ...formData, admission_fee: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tuition Fee *</label>
              <input
                type="number"
                value={formData.tuition_fee}
                onChange={(e) => setFormData({ ...formData, tuition_fee: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Books Fee</label>
              <input
                type="number"
                value={formData.books_fee}
                onChange={(e) => setFormData({ ...formData, books_fee: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Uniform Fee</label>
              <input
                type="number"
                value={formData.uniform_fee}
                onChange={(e) => setFormData({ ...formData, uniform_fee: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Transport Fee (Optional)</label>
            <input
              type="number"
              value={formData.transport_fee}
              onChange={(e) => setFormData({ ...formData, transport_fee: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            />
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeeManagementView;