import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../CSS/CategoryManagement.css';

export default function CategoryManagement() {
  const [frequencies, setFrequencies] = useState([]);
  const [category, setCategory] = useState('');
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sadId, setSadId] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Check login status on mount
  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    console.log('Raw user from localStorage:', rawUser);

    if (!rawUser) {
      console.warn('No user in localStorage. Redirecting to login...');
      localStorage.clear();
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      if (!user?.id) {
        console.warn('User ID missing. Redirecting to login...');
        localStorage.clear();
        navigate('/login');
        return;
      }

      setSadId(user.id);
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  // Fetch frequency categories when sadId is set
  useEffect(() => {
    if (sadId) {
      fetchFrequencies(sadId);
    }
  }, [sadId]);

  // Autofocus input when modal is opened
  useEffect(() => {
    if (modalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [modalOpen]);

  const fetchFrequencies = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/frequencyCategory', {
        headers: { 'x-sad-id': id }
      });
      setFrequencies(res.data);
      setMessage('');
    } catch (error) {
      setMessage('Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  const openModalForAdd = () => {
    setCategory('');
    setEditId(null);
    setModalOpen(true);
    setMessage('');
  };

  const openModalForEdit = (id, cat) => {
    setEditId(id);
    setCategory(cat);
    setModalOpen(true);
    setMessage('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setCategory('');
    setEditId(null);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedCategory = category.trim();
    if (!trimmedCategory) {
      setMessage('⚠️ Category name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        await axios.put(
          `http://localhost:5000/api/frequencyCategory/${editId}`,
          { categoryName: trimmedCategory },
          { headers: { 'x-sad-id': sadId } }
        );
        setMessage('✅ Category updated');
      } else {
        await axios.post('http://localhost:5000/api/frequencyCategory/newCategory',
          { categoryName: trimmedCategory },
          { headers: { 'x-sad-id': sadId } }
        );
        setMessage('✅ Category added');
      }
      fetchFrequencies(sadId);
      closeModal();
    } catch (error) {
      setMessage('❌ Error saving category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/frequencyCategory/${id}`, {
        headers: { 'x-sad-id': sadId }
      });
      setMessage('🗑️ Category deleted');
      fetchFrequencies(sadId);
    } catch (error) {
      setMessage('❌ Error deleting category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">Manage Frequency Categories</div>

      {message && <p className="message">{message}</p>}

      <div className="button-group">
        <button className="button" onClick={openModalForAdd}>Add New Category</button>
        <button className="button back-button" onClick={() => navigate('/adminDashboard')}>Back to Dashboard</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {frequencies.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center' }}>No categories found</td>
              </tr>
            ) : (
              frequencies.map((f, index) => (
                <tr key={f.f_id} className="table-row">
                  <td>{index + 1}</td>
                  <td>{f.f_category}</td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <button className="action-button" onClick={() => openModalForEdit(f.f_id, f.f_category)}>Edit</button>
                    <button className="action-button delete-button" onClick={() => handleDelete(f.f_id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Enter category"
                value={category}
                ref={inputRef}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
              <div className="modal-buttons">
                <button type="button" className="button back-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="button" disabled={loading}>
                  {loading ? 'Saving...' : editId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
