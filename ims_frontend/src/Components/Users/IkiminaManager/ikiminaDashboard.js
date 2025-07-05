import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../CSS/adminDashboard.css';

export default function IkiminaDashboard() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const res = await axios.get(
        `http://localhost:5000/api/membersInfoRoutes/selectByIkiId?iki_id=${iki_id}`
      );

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

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">👥 Members in Your Ikimina</h2>

      {error && <div className="dashboard-error">{error}</div>}

      {loading ? (
        <div className="dashboard-loading">Loading members...</div>
      ) : (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Names</th>
                <th>National ID</th>
                <th>Guardian</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Type</th>
                <th>Access Code</th>
                <th>Ikimina</th>
              </tr>
            </thead>
            <tbody>
              {members.length > 0 ? (
                members.map((m, i) => (
                  <tr key={m.member_id}>
                    <td>{i + 1}</td>
                    <td>{m.member_names}</td>
                    <td>{m.member_Nid || m.guardian_name || '—'}</td>
                    <td>{m.member_Nid ? 'None' : m.gm_Nid || '—'}</td>
                    <td>{m.member_phone_number}</td>
                    <td>{m.member_email || '—'}</td>
                    <td>{m.member_type || 'Unknown'}</td>
                    <td>{m.member_code || '—'}</td>
                    <td>{m.iki_name || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-members">
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
