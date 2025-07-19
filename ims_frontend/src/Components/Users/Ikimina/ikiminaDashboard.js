import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../../CSS/adminDashboard.css';

export default function IkiminaDashboard() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user.id) {
      setError('Login session is invalid or expired. Please log in again.');
      return;
    }

    if (user.role !== 'ikimina') {
      setError('You do not have access to this dashboard.');
      return;
    }

    fetchMembers(user.id);
  }, []);

  const fetchMembers = async (iki_id) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`http://localhost:5000/api/membersInfoRoutes/select?iki_id=${iki_id}`);

      if (res.data.success) {
        setMembers(res.data.data);
        if (res.data.data.length === 0) setError('No members found.');
      } else {
        setMembers([]);
        setError(res.data.message || 'No members found.');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setMembers([]);
      setError('Server error while fetching members.');
    }
    setLoading(false);
  };

  const filteredMembers = members.filter(
    (m) =>
      (m.member_names || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.member_Nid || '').includes(searchTerm) ||
      (m.member_phone_number || '').includes(searchTerm)
  );

  const exportToExcel = () => {
    if (filteredMembers.length === 0) {
      alert('No data to export.');
      return;
    }

    // Remove member_id and format phone to string (if needed)
    const dataToExport = filteredMembers.map(({ member_id, ...rest }) => ({
      ...rest,
      member_phone_number: rest.member_phone_number?.toString() || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, 'Ikimina_Members.xlsx');
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">👥 Members in Your Ikimina</h2>

      {error && <div className="dashboard-error" role="alert">{error}</div>}

      <div className="dashboard-actions">
        <input
          type="text"
          placeholder="🔍 Search by name, NID, or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="dashboard-search"
          aria-label="Search members"
        />
        <button
          className="dashboard-export-btn"
          onClick={exportToExcel}
          disabled={filteredMembers.length === 0}
          aria-disabled={filteredMembers.length === 0}
          title={filteredMembers.length === 0 ? 'No data to export' : 'Export to Excel'}
        >
          📥 Export to Excel
        </button>
      </div>

      {loading ? (
        <div className="dashboard-loading" aria-live="polite">Loading members...</div>
      ) : (
        <div className="table-wrapper" role="region" aria-label="Members Table">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Names</th>
                <th>National ID</th>
                <th>Guardian</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Type</th>
                <th>Access Code</th>
                <th>Ikimina</th>
                <th>Member Status</th>

              </tr>
            </thead>
            <tbody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m, i) => (
                  <tr key={m.member_id}>
                    <td>{i + 1}</td>
                    <td>{m.member_names}</td>
                    <td>{m.member_Nid || '—'}</td>
                    <td>{m.gm_Nid || '—'}</td>
                    <td>{m.member_phone_number}</td>
                    <td>{m.member_email || '—'}</td>
                    <td>{m.member_type || 'Unknown'}</td>
                    <td>{m.member_code || '—'}</td>
                    <td>{m.iki_name || '—'}</td>
                    <td>{m.m_status || '—'}</td>


                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-members" role="row">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
