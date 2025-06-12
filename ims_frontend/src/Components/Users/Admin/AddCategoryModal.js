// AddCategoryModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddCategoryModal({ isOpen, onRequestClose, onCategoryAdded, userId }) {
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setCategoryName('');
      setMessage('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setMessage('Please enter a category name.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(
        '/api/frequencyCategory/newCategory',
        { categoryName: categoryName.trim() },
        { headers: { 'x-sad-id': userId.toString() } }
      );

      onCategoryAdded({
        value: res.data.id,
        label: res.data.categoryName,
        f_id: res.data.id,
        f_category: res.data.categoryName,
        sad_id: userId,
      });

      setCategoryName('');
      setMessage('Category added successfully!');
      onRequestClose();
    } catch (error) {
      setMessage('Failed to add category. Try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New Frequency Category</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Category name (e.g. Daily)"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            disabled={loading}
            autoFocus
          />
          {message && <p className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Category'}
          </button>
          <button type="button" onClick={onRequestClose} disabled={loading} style={{ marginLeft: '10px' }}>
            Cancel
          </button>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 300px;
          max-width: 90%;
        }
        input {
          width: 100%;
          padding: 8px;
          margin-bottom: 10px;
          box-sizing: border-box;
        }
        .message {
          margin-bottom: 10px;
        }
        .success {
          color: green;
        }
        .error {
          color: red;
        }
        button {
          padding: 8px 12px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
