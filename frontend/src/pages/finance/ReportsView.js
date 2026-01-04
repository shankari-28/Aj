import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, AlertCircle, Users, DollarSign } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

const ReportsView = () => {
  const [activeReport, setActiveReport] = useState('daily');
  const [dailyReport, setDailyReport] = useState(null);
  const [outstandingReport, setOutstandingReport] = useState(null);
  const [summaryReport, setSummaryReport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeReport === 'daily') loadDailyReport();
    else if (activeReport === 'outstanding') loadOutstandingReport();
    else if (activeReport === 'summary') loadSummaryReport();
  }, [activeReport, selectedDate, dateRange]);

  const loadDailyReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/daily-collection?date=${selectedDate}`);
      setDailyReport(res.data);
    } catch (error) {
      toast.error('Failed to load daily report');
    } finally {
      setLoading(false);
    }
  };

  const loadOutstandingReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/outstanding-dues');
      setOutstandingReport(res.data);
    } catch (error) {
      toast.error('Failed to load outstanding dues report');
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/collection-summary?start_date=${dateRange.start}&end_date=${dateRange.end}`);
      setSummaryReport(res.data);
    } catch (error) {
      toast.error('Failed to load summary report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Report exported successfully');
  };

  const reportTabs = [
    { id: 'daily', label: 'Daily Collection', icon: Calendar },
    { id: 'outstanding', label: 'Outstanding Dues', icon: AlertCircle },
    { id: 'summary', label: 'Collection Summary', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-[#1e3a8a]">Financial Reports</h3>

      {/* Report Tabs */}
      <div className="flex gap-2 border-b pb-4">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeReport === tab.id
                ? 'bg-[#1e3a8a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daily Collection Report */}
      {activeReport === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={() => exportToCSV(dailyReport?.payments, 'daily_collection')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={!dailyReport?.payments?.length}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : dailyReport ? (
            <>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600">Total Collection</p>
                  <p className="text-3xl font-bold text-[#1e3a8a]">₹{dailyReport.total_collection.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-3xl font-bold text-green-600">{dailyReport.transaction_count}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600">Cash</p>
                  <p className="text-2xl font-bold text-amber-600">₹{dailyReport.by_payment_mode.cash?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600">UPI/Online</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{((dailyReport.by_payment_mode.upi || 0) + (dailyReport.by_payment_mode.online || 0)).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h4 className="font-semibold mb-4">Transaction Details</h4>
                {dailyReport.payments.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No transactions on this date</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Receipt No.</th>
                        <th className="text-left p-3">Student</th>
                        <th className="text-left p-3">Roll No.</th>
                        <th className="text-left p-3">Class</th>
                        <th className="text-left p-3">Mode</th>
                        <th className="text-right p-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyReport.payments.map(payment => (
                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono text-sm">{payment.receipt_number}</td>
                          <td className="p-3">{payment.student_name}</td>
                          <td className="p-3">{payment.roll_number}</td>
                          <td className="p-3 capitalize">{payment.class?.replace('_', ' ')}</td>
                          <td className="p-3 capitalize">{payment.payment_mode}</td>
                          <td className="p-3 text-right font-semibold">₹{payment.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Outstanding Dues Report */}
      {activeReport === 'outstanding' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => exportToCSV(outstandingReport?.students, 'outstanding_dues')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={!outstandingReport?.students?.length}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : outstandingReport ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <p className="text-sm text-red-600">Total Outstanding</p>
                  <p className="text-3xl font-bold text-red-600">₹{outstandingReport.total_outstanding.toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <p className="text-sm text-amber-600">Students with Dues</p>
                  <p className="text-3xl font-bold text-amber-600">{outstandingReport.students_with_dues}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h4 className="font-semibold mb-4">Students with Outstanding Dues</h4>
                {outstandingReport.students.length === 0 ? (
                  <p className="text-center text-green-600 py-4">🎉 All fees collected! No outstanding dues.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Roll No.</th>
                        <th className="text-left p-3">Student</th>
                        <th className="text-left p-3">Class</th>
                        <th className="text-right p-3">Total Fee</th>
                        <th className="text-right p-3">Paid</th>
                        <th className="text-right p-3">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstandingReport.students.map(student => (
                        <tr key={student.student_id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono text-sm">{student.roll_number}</td>
                          <td className="p-3">{student.student_name}</td>
                          <td className="p-3 capitalize">{student.class?.replace('_', ' ')} - {student.section}</td>
                          <td className="p-3 text-right">₹{student.total_fee.toLocaleString()}</td>
                          <td className="p-3 text-right text-green-600">₹{student.paid_amount.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-red-600">₹{student.due_amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Collection Summary Report */}
      {activeReport === 'summary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              />
              <label className="text-sm font-medium">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={() => exportToCSV(summaryReport?.daily_breakdown, 'collection_summary')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={!summaryReport?.daily_breakdown?.length}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : summaryReport ? (
            <>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600">Total Collection</p>
                  <p className="text-3xl font-bold text-[#1e3a8a]">₹{summaryReport.total_collection.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600">Cash</p>
                  <p className="text-2xl font-bold text-amber-600">₹{(summaryReport.by_payment_mode.cash || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600">UPI</p>
                  <p className="text-2xl font-bold text-purple-600">₹{(summaryReport.by_payment_mode.upi || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600">Online</p>
                  <p className="text-2xl font-bold text-green-600">₹{(summaryReport.by_payment_mode.online || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h4 className="font-semibold mb-4">Daily Breakdown</h4>
                {summaryReport.daily_breakdown.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No transactions in this period</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Date</th>
                        <th className="text-right p-3">Transactions</th>
                        <th className="text-right p-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryReport.daily_breakdown.map(day => (
                        <tr key={day.date} className="border-b hover:bg-gray-50">
                          <td className="p-3">{new Date(day.date).toLocaleDateString()}</td>
                          <td className="p-3 text-right">{day.count}</td>
                          <td className="p-3 text-right font-semibold">₹{day.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ReportsView;
