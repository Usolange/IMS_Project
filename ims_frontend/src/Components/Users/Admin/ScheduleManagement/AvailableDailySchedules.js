import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../../../CSS/AvailableSchedules.css';

const AvailableSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let sad_id = null;

    try {
      const user = JSON.parse(storedUser);
      sad_id = user?.id;
    } catch (err) {
      setError("Invalid user data. Please log in again.");
      setLoading(false);
      return;
    }

    if (!sad_id) {
      setError("User ID missing. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchSchedules = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/ScheduleManagerRoutes/allSchedules?sad_id=${sad_id}`);
        setSchedules(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load schedules');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm]);

  // Filtering and sorting
  const filteredSortedSchedules = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    const filtered = schedules.filter(sch => {
      const matchesType = filterType === 'all' || sch.scheduleType === filterType;
      const matchesSearch =
        sch.ikimina_name?.toLowerCase().includes(lowerSearch) ||
        sch.cell?.toLowerCase().includes(lowerSearch) ||
        sch.village?.toLowerCase().includes(lowerSearch) ||
        sch.scheduleType?.toLowerCase().includes(lowerSearch);

      return matchesType && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (a.scheduleType < b.scheduleType) return -1;
      if (a.scheduleType > b.scheduleType) return 1;

      const cellA = a.cell || '';
      const cellB = b.cell || '';
      if (cellA < cellB) return -1;
      if (cellA > cellB) return 1;

      const nameA = a.ikimina_name || '';
      const nameB = b.ikimina_name || '';
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;

      // Sort by schedule as last criteria
      const scheduleA = a.schedule || '';
      const scheduleB = b.schedule || '';
      if (scheduleA < scheduleB) return -1;
      if (scheduleA > scheduleB) return 1;

      return 0;
    });
  }, [schedules, filterType, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredSortedSchedules.length / itemsPerPage);

  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSortedSchedules.slice(start, start + itemsPerPage);
  }, [filteredSortedSchedules, currentPage, itemsPerPage]);

  // Export filtered & sorted (full, not paginated) to Excel
  const handleExportExcel = () => {
    const exportData = filteredSortedSchedules.map(({ id, ikimina_name, schedule, cell, village, scheduleType }) => ({
      ID: id,
      'Ikimina Name': ikimina_name,
      Schedule: schedule,
      Cell: cell || 'N/A',
      Village: village || 'N/A',
      Type: scheduleType.charAt(0).toUpperCase() + scheduleType.slice(1),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Schedules");
    XLSX.writeFile(workbook, "AvailableSchedules.xlsx");
  };

  return (
    <div className="schedules-container">
      <Link to="/TimeManager" className="nav-link">⬅ Back to Time Manager</Link>
      <h2>Available Ikimina Schedules</h2>

      <div className="controls">
        <input
          type="text"
          placeholder="Search by Ikimina, Cell, Village or Type..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Types</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <button onClick={handleExportExcel} className="export-button">Export to Excel</button>
      </div>

      {loading ? (
        <p>Loading schedules...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : filteredSortedSchedules.length === 0 ? (
        <p>No schedules found.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Ikimina Name</th>
                <th>Schedule</th>
                <th>Cell</th>
                <th>Village</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSchedules.map((item, index) => (
                <tr key={item.id + '-' + index}>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{item.ikimina_name}</td>
                  <td>{item.schedule}</td>
                  <td>{item.cell || 'N/A'}</td>
                  <td>{item.village || 'N/A'}</td>
                  <td>{item.scheduleType.charAt(0).toUpperCase() + item.scheduleType.slice(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>

            <span> Page {currentPage} of {totalPages} </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AvailableSchedules;
