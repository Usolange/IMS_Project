import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FaFileExcel } from 'react-icons/fa';
import '../../../CSS/adminDashboadMembers.css';

export default function Dashboard() {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const getSadId = () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      return storedUser?.sad_id || storedUser?.id || null;
    } catch {
      return null;
    }
  };

  const formatDays = (item) => {
    if (!item.category_name) return '';
    const category = item.category_name.toLowerCase();

    if (category === 'daily') return item.dayOfEvent || 'Daily';

    if (category === 'weekly') {
      if (item.weekly_saving_days) {
        try {
          const days = JSON.parse(item.weekly_saving_days);
          if (Array.isArray(days) && days.length > 0) return days.join(', ');
        } catch {}
      }
      return item.dayOfEvent || '';
    }

    if (category === 'monthly') {
      if (item.monthly_saving_days) {
        try {
          const dates = JSON.parse(item.monthly_saving_days);
          if (Array.isArray(dates) && dates.length > 0) return dates.join(', ');
        } catch {}
      }
      return item.dayOfEvent || '';
    }

    return item.dayOfEvent || '';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minuteStr] = timeStr.split(':');
    if (!hourStr || !minuteStr) return timeStr;

    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    const minuteFormatted = minute < 10 ? `0${minute}` : minute;
    return `${hour}:${minuteFormatted} ${ampm}`;
  };

  const getFilteredIkiminas = () => {
    if (!adminData) return [];
    if (!searchTerm.trim()) return adminData.ikimina;
    return adminData.ikimina.filter((ik) =>
      ik.iki_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const sad_id = getSadId();
      if (!sad_id) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await axios.get(
          `http://localhost:5000/api/membersInfoRoutes/allmembersInSector/${sad_id}`
        );
        setAdminData(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load Ikimina and members data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExportToExcel = () => {
    if (!adminData || !adminData.ikimina || adminData.ikimina.length === 0) return;

    const dataForExport = [];

    adminData.ikimina.forEach((ik) => {
      if (!ik.members || ik.members.length === 0) {
        dataForExport.push({
          Ikimina: ik.iki_name,
          MemberName: '(No members)',
          MemberPhone: '',
          Role: '',
        });
      } else {
        ik.members.forEach((m, i) => {
          dataForExport.push({
            Number: i + 1,
            Ikimina: ik.iki_name,
            MemberName: m.member_names,
            MemberPhone: m.member_phone_number,
            Role: m.member_names,
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ikiminas & Members');
    XLSX.writeFile(workbook, 'ikiminas_members_list.xlsx');
  };

  if (loading) return <p className="dashboard-loading">Loading Ikimina data...</p>;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (!adminData) return null;

  const filteredIkiminas = getFilteredIkiminas();

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Manage Saving Groups in your Sector</h2>

      <div className="dashboard-actions">
        <input
          type="text"
          placeholder="Search Ikimina by name..."
          className="dashboard-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="dashboard-export-btn" onClick={handleExportToExcel}>
          <FaFileExcel style={{ marginRight: '8px' }} />
          Export to Excel
        </button>
      </div>

      <div className="table-wrapper">
        {filteredIkiminas.length === 0 ? (
          <p className="no-data">No Ikimina records found.</p>
        ) : (
          filteredIkiminas.map((ik, index) => (
            <div key={ik.iki_id} className="ikimina-section">
              <h3>{index + 1}. {ik.iki_name}</h3>
              <p>Email: {ik.iki_email || 'N/A'} | Username: {ik.iki_username || 'N/A'}</p>

              {ik.members.length === 0 ? (
                <p className="no-members">No members found in this Ikimina.</p>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Member Name</th>
                      <th>Phone Number</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ik.members.map((m, i) => (
                      <tr key={m.member_id}>
                        <td>{i + 1}</td>
                        <td>{m.member_names}</td>
                        <td>{m.member_phone_number}</td>
                        <td>{m.member_type || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
