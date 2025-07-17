import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../../CSS/FrequencyCategoryManagement.css';

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

  // Check user auth on mount
  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      localStorage.clear();
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      if (!user?.id) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      setSadId(user.id);
    } catch {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  // Fetch categories when sadId is ready
  useEffect(() => {
    if (sadId) {
      fetchFrequencies(sadId);
    }
  }, [sadId]);

  // Autofocus input when modal opens
  useEffect(() => {
    if (modalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [modalOpen]);

  // Close modal on ESC key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && modalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  // Fetch frequency categories for current admin
  const fetchFrequencies = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/frequencyCategoryRoutes/selectCategories', {
        headers: { 'x-sad-id': id }
      });
      setFrequencies(res.data);
      setMessage('');
    } catch {
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

  // Save or update category
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
          `http://localhost:5000/api/frequencyCategoryRoutes/${editId}`,
          { categoryName: trimmedCategory },
          { headers: { 'x-sad-id': sadId } }
        );
        setMessage('✅ Category updated');
      } else {
        await axios.post(
          'http://localhost:5000/api/frequencyCategoryRoutes/newCategory',
          { categoryName: trimmedCategory },
          { headers: { 'x-sad-id': sadId } }
        );
        setMessage('✅ Category added');
      }
      fetchFrequencies(sadId);
      closeModal();
    } catch {
      setMessage('❌ Error saving category');
    } finally {
      setLoading(false);
    }
  };

  // Delete a category
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/frequencyCategoryRoutes/${id}`, {
        headers: { 'x-sad-id': sadId }
      });
      setMessage('🗑️ Category deleted');
      fetchFrequencies(sadId);
    } catch {
      setMessage('❌ Error deleting category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="freqcat-container">
      <h1 className="freqcat-header">Manage Frequency Categories</h1>

      {message && <p className="freqcat-message">{message}</p>}

      <div className="freqcat-button-group">
        <button className="freqcat-action-button" onClick={openModalForAdd}>
          + Add New Category
        </button>
        <button className="freqcat-action-button" onClick={() => navigate('/AddLocation')}>
          ← Back
        </button>
      </div>

      <div className="freqcat-table-container">
        <table className="freqcat-table" aria-label="Frequency categories table">
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
                <td colSpan="3" style={{ textAlign: 'center' }}>
                  No categories found
                </td>
              </tr>
            ) : (
              frequencies.map((f, index) => (
                <tr key={f.f_id} className="freqcat-table-row">
                  <td>{index + 1}</td>
                  <td>{f.f_category}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="freqcat-action-button"
                      onClick={() => openModalForEdit(f.f_id, f.f_category)}
                      aria-label={`Edit category ${f.f_category}`}
                    >
                      Edit
                    </button>
                    <button
                      className="freqcat-action-button freqcat-delete-button"
                      onClick={() => handleDelete(f.f_id)}
                      aria-label={`Delete category ${f.f_category}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="freqcat-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            if (e.target.classList.contains('freqcat-modal-overlay')) {
              closeModal();
            }
          }}
        >
          <div className="freqcat-modal" tabIndex={-1}>
            <h3 id="modal-title">{editId ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category Name"
                aria-label="Category Name"
                autoFocus
                disabled={loading}
                className="freqcat-input"
              />
              <div className="freqcat-modal-buttons">
                <button type="submit" disabled={loading} className="freqcat-submit-button">
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={closeModal} disabled={loading} className="freqcat-cancel-button">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
