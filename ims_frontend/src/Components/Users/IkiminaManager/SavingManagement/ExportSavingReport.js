import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const ExportSavingReport = ({ iki_id }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

const ikiUser = JSON.parse(localStorage.getItem('user'));
const iki_id = ikiUser?.id;


  const handleExport = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.get(`/api/admin/export-savings/${iki_id}`);
      const data = res.data; // expected array of saving records

      if (!data.length) {
        setMessage('No data available to export.');
        setLoading(false);
        return;
      }

      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'SavingsReport');

      // Export to Excel file
      XLSX.writeFile(workbook, `SavingsReport_${iki_id}.xlsx`);
      setMessage('Export successful.');
    } catch (error) {
      setMessage('Export failed.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Export Savings Report</h2>
      <button
        onClick={handleExport}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Exporting...' : 'Export to Excel'}
      </button>
      {message && <p className="mt-3 text-gray-700">{message}</p>}
    </div>
  );
};

export default ExportSavingReport;
