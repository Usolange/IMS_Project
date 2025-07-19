import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FaFileExcel } from 'react-icons/fa';
import { Auth } from '../../Auth/Auth';
import '../../CSS/adminDashboard.css';

export default function Dashboard() {
  const { user } = useContext(Auth);
  const [allIkiminas, setAllIkiminas] = useState([]);
  const [ikiminas, setIkiminas] = useState([]);
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

  // Format days based on category and JSON fields
  const formatDays = (item) => {
    if (!item.category_name) return '';

    const category = item.category_name.toLowerCase();

    if (category === 'daily') {
      return item.dayOfEvent || 'Daily';
    }

    if (category === 'weekly') {
      if (item.weekly_saving_days) {
        try {
          const days = JSON.parse(item.weekly_saving_days);
          if (Array.isArray(days) && days.length > 0) return days.join(', ');
        } catch {
          // ignore parse error
        }
      }
      return item.dayOfEvent || '';
    }

    if (category === 'monthly') {
      if (item.monthly_saving_days) {
        try {
          const dates = JSON.parse(item.monthly_saving_days);
          if (Array.isArray(dates) && dates.length > 0) return dates.join(', ');
        } catch {
          // ignore parse error
        }
      }
      return item.dayOfEvent || '';
    }

    return item.dayOfEvent || '';
  };

  // Format time string HH:mm:ss.0000000 to 12-hour format e.g. 2:00 PM
  const formatTime = (timeStr) => {
    if (!timeStr) return '';

    const [hourStr, minuteStr] = timeStr.split(':');
    if (!hourStr || !minuteStr) return timeStr;

    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Convert 0 to 12

    const minuteFormatted = minute < 10 ? `0${minute}` : minute;

    return `${hour}:${minuteFormatted} ${ampm}`;
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
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load Ikimina data.');
      } finally {
        setLoading(false);
      }
    };

    fetchIkiminas();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      if (!searchTerm.trim()) {
        setIkiminas(allIkiminas);
      } else {
        const filtered = allIkiminas.filter(item =>
          item.iki_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setIkiminas(filtered);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout.current);
  }, [searchTerm, allIkiminas]);

  const handleExportToExcel = () => {
    if (ikiminas.length === 0) return;

    const dataForExport = ikiminas.map((item, i) => ({
      Number: i + 1,
      Name: item.iki_name || '',
      Email: item.iki_email || '',
      Username: item.iki_username || '',
      Location: `${item.cell || ''}, ${item.village || ''}`,
      Day: formatDays(item),
      Time: formatTime(item.timeOfEvent),
      Events: item.numberOfEvents || '',
      Category: item.category_name || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ikiminas');
    XLSX.writeFile(workbook, 'ikimina_list.xlsx');
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Manage Saving Groups in your Sector</h2>

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
                  <th>Number</th>
                  <th>Name</th>
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
                    <td colSpan="9" className="no-data">No Ikimina records found.</td>
                  </tr>
                ) : (
                  ikiminas.map((item, index) => (
                    <tr key={item.iki_id}>
                      <td>{index + 1}</td>
                      <td>{item.iki_name}</td>
                      <td>{item.iki_email}</td>
                      <td>{item.iki_username}</td>
                      <td>{`${item.cell || ''}, ${item.village || ''}`}</td>
                      <td>{formatDays(item)}</td>
                      <td>{formatTime(item.timeOfEvent)}</td>
                      <td>{item.numberOfEvents}</td>
                      <td>{item.category_name}</td>
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
