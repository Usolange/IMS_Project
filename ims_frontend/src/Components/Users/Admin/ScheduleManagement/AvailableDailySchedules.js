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
  const [modalData, setModalData] = useState(null);

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
        const res = await axios.get(`http://localhost:5000/api/ScheduleManagerRoutes/allSchedules`, {
          headers: { 'x-sad-id': sad_id }
        });
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm]);

  const filteredSortedSchedules = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const order = { daily: 1, weekly: 2, monthly: 3 };

    return schedules
      .filter(sch => {
        const matchesType = filterType === 'all' || sch.scheduleType === filterType;
        const matchesSearch =
          sch.ikimina_name?.toLowerCase().includes(lowerSearch) ||
          sch.cell?.toLowerCase().includes(lowerSearch) ||
          sch.village?.toLowerCase().includes(lowerSearch) ||
          sch.scheduleType?.toLowerCase().includes(lowerSearch);
        return matchesType && matchesSearch;
      })
      .sort((a, b) => {
        return (order[a.scheduleType] || 99) - (order[b.scheduleType] || 99);
      });
  }, [schedules, filterType, searchTerm]);

  const totalPages = Math.ceil(filteredSortedSchedules.length / itemsPerPage);

  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSortedSchedules.slice(start, start + itemsPerPage);
  }, [filteredSortedSchedules, currentPage, itemsPerPage]);

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

  const closeModal = () => setModalData(null);

  return (
    <div className="schedules-container">
      <Link to="/TimeManager" className="nav-link">⬅ Back to Time Manager</Link>
      <h2>Available Ikimina Schedules</h2>

      <div className="controls">
        <input
          type="text"
          placeholder="Search Ikimina, Cell, Village, or Type..."
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
          <table className="schedules-table">
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
                <tr
                  key={item.id + '-' + index}
                  className="clickable-row"
                  onClick={() => setModalData(item)}
                >
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
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
          </div>
        </>
      )}

      {modalData && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Schedule Details</h3>
            <p><strong>Ikimina:</strong> {modalData.ikimina_name}</p>
            <p><strong>Schedule:</strong> {modalData.schedule}</p>
            <p><strong>Cell:</strong> {modalData.cell || 'N/A'}</p>
            <p><strong>Village:</strong> {modalData.village || 'N/A'}</p>
            <p><strong>Type:</strong> {modalData.scheduleType}</p>
            <button onClick={closeModal} className="close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableSchedules;
