import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FaFileExcel } from 'react-icons/fa';
import { Auth } from '../../Auth/Auth';
import '../../CSS/adminDashboard.css';

export default function Dashboard() {
  const { user } = useContext(Auth);
  const [allIkiminas, setAllIkiminas] = useState([]); // original data
  const [ikiminas, setIkiminas] = useState([]); // filtered
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debounceTimeout = useRef(null);

  const getSadId = () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      return storedUser?.sad_id || storedUser?.id || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchIkiminas = async () => {
      const sad_id = getSadId();
      if (!sad_id) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get(`http://localhost:5000/api/ikiminaInfoRoutes/select?sad_id=${sad_id}`);
        setAllIkiminas(data);
        setIkiminas(data);
      } catch {
        setError('Failed to load Ikimina data.');
      } finally {
        setLoading(false);
      }
    };
    fetchIkiminas();
  }, []);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (!searchTerm.trim()) {
        setIkiminas(allIkiminas);
      } else {
        const filtered = allIkiminas.filter(item =>
          item.iki_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setIkiminas(filtered);
      }
    }, 300);
    return () => clearTimeout(debounceTimeout.current);
  }, [searchTerm, allIkiminas]);

  const handleExportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(ikiminas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ikiminas');
    XLSX.writeFile(wb, 'ikimina_list.xlsx');
  };

  return (
    <div className="dashboard-container">
      <p className="text-right text-sm text-gray-600 mb-4">
        Welcome, <span className="font-semibold">{user?.name}</span> ({user?.role})
      </p>

      <h2 className="dashboard-title">Your Ikimina Accounts</h2>

      {loading ? (
        <p className="dashboard-loading">Loading Ikimina data...</p>
      ) : error ? (
        <p className="dashboard-error">{error}</p>
      ) : (
        <>
          <div className="dashboard-actions">
            <input
              type="text"
              placeholder="Search by name..."
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
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ikimina Name</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Location</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Events</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {ikiminas.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', fontStyle: 'italic', color: '#888' }}>
                      No Ikimina records available.
                    </td>
                  </tr>
                ) : (
                  ikiminas.map(iki => (
                    <tr key={iki.iki_id}>
                      <td>{iki.iki_id}</td>
                      <td>{iki.iki_name}</td>
                      <td>{iki.iki_email}</td>
                      <td>{iki.iki_username}</td>
                      <td>{`${iki.cell || ''}, ${iki.village || ''}`}</td>
                      <td>{iki.dayOfEvent}</td>
                      <td>{iki.timeOfEvent}</td>
                      <td>{iki.numberOfEvents}</td>
                      <td>{iki.category_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
