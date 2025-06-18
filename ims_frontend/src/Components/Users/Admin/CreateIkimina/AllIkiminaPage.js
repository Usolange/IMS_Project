import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import '../../../CSS/AllIkiminaPage.css';
import { FaTrash, FaEdit, FaFileExcel, FaSearch } from 'react-icons/fa';
import EditIkiminaModal from './EditIkiminaModal';
import * as XLSX from 'xlsx';

const AllIkiminaPage = () => {
  const [ikiminas, setIkiminas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingIkimina, setEditingIkimina] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getSadId = () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      const user = JSON.parse(storedUser);
      return user?.sad_id || user?.id || null;
    } catch {
      return null;
    }
  };

  const fetchIkiminas = async () => {
    const sad_id = getSadId();
    if (!sad_id) {
      setError('User not logged in.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/ikiminaInfo/select?sad_id=${sad_id}`);
      setIkiminas(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load Ikimina data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIkiminas();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Ikimina?')) return;
    const sad_id = getSadId();
    if (!sad_id) {
      setError('User not logged in.');
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/ikiminaInfo/delete/${id}`, {
        headers: { 'x-sad-id': sad_id }
      });
      setSuccess('Ikimina deleted successfully.');
      fetchIkiminas();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete Ikimina');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (ikimina) => {
    setEditingIkimina(ikimina);
  };

  const closeModal = () => {
    setEditingIkimina(null);
  };

  const onUpdateSuccess = () => {
    setSuccess('Ikimina updated successfully.');
    fetchIkiminas();
    closeModal();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleExportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(ikiminas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ikiminas');
    XLSX.writeFile(wb, 'ikiminas.xlsx');
  };

  const filteredIkiminas = ikiminas.filter((ikimina) =>
    ikimina.iki_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ikimina.iki_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ikimina.iki_username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ikimina-container">
      <h1>All Ikimina Accounts (Your Data)</h1>

      <div className="action-buttons">
        <a href="/IkiminaManagement" className="btn-primary">New Ikimina</a>
        <a href="/adminDashboard" className="btn-secondary">Back to Home</a>
        <button className="btn-primary" onClick={handleExportToExcel}><FaFileExcel /> Export</button>
      </div>

      <input
        type="text"
        placeholder="Search by name, email, or username..."
        className="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading && <p>Loading Ikimina data...</p>}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="table-scroll-container">
        <table className="ikimina-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ikimina Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Location (Cell, Village)</th>
              <th className="nowrap-col">Day of Event</th>
              <th>Time of Event</th>
              <th>Number of Events</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIkiminas.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">No matching Ikimina found.</td>
              </tr>
            ) : (
              filteredIkiminas.map((ikimina) => {
                const locationStr = `${ikimina.cell || ''}, ${ikimina.village || ''}`;
                return (
                  <tr key={ikimina.iki_id}>
                    <td>{ikimina.iki_id}</td>
                    <td>{ikimina.iki_name}</td>
                    <td>{ikimina.iki_email}</td>
                    <td>{ikimina.iki_username}</td>
                    <td>{locationStr}</td>
                    <td className="nowrap-col">{ikimina.dayOfEvent}</td>
                    <td>{ikimina.timeOfEvent}</td>
                    <td>{ikimina.numberOfEvents}</td>
                    <td>{ikimina.category_name}</td>
                    <td>
                      <button onClick={() => handleEdit(ikimina)} className="btn-edit" title="Edit">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(ikimina.iki_id)} className="btn-delete" title="Delete">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingIkimina && (
        <EditIkiminaModal
          ikimina={editingIkimina}
          onClose={closeModal}
          onSuccess={onUpdateSuccess}
        />
      )}
    </div>
  );
};

export default AllIkiminaPage;
