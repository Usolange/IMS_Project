import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ScheduleManager from './ScheduleManager'; // updated import
import '../../../CSS/TimeManager.css';

export default function TimeManager() {
  const [frequencies, setFrequencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sadId, setSadId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [ikiminaList, setIkiminaList] = useState([]);

  // On mount, parse user and set sadId as number
  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      localStorage.clear();
      navigate('/');
      return;
    }
    try {
      const user = JSON.parse(rawUser);
      if (!user?.id || isNaN(Number(user.id))) {
        localStorage.clear();
        navigate('/');
        return;
      }
      setSadId(Number(user.id));
    } catch {
      localStorage.clear();
      navigate('/');
    }
  }, [navigate]);

  // When sadId is set, fetch frequencies and ikimina names
  useEffect(() => {
    if (sadId) {
      fetchFrequencies(sadId);
      fetchIkinimaNames(sadId);
    }
  }, [sadId]);

  // Autofocus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fetchFrequencies = async (id) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.get('http://localhost:5000/api/frequencyCategoryRoutes/selectCategories', {
        headers: { 'x-sad-id': id },
      });
      setFrequencies(res.data);
    } catch (error) {
      setMessage('Error fetching categories');
      setFrequencies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIkinimaNames = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/ikimina/select?sad_id=${id}`);
      setIkiminaList(res.data);
    } catch (err) {
      console.error('Failed to fetch Ikimina names', err);
    }
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  const closeScheduleForm = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="container">
      <div className="header-actions">
        <button
          className="action-button"
          onClick={() => navigate('/adminDashboard')}
        >
          Back to Dashboard
        </button>

        <button
          className="action-button primary"
          onClick={() => navigate('/AvailableDailySchedules')}
        >
          AvailableSchedules
        </button>
      </div>

      {message && <p className="info-message">{message}</p>}
      {loading ? (
        <p className="loading-text">Loading categories...</p>
      ) : (
        <>
          <h1 className="page-title">Registered Frequency Categories</h1>

          <table className="table">
            <thead>
              <tr>
                <th>Category ID</th>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Schedule</th>
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
                  <tr key={f.f_id} className="table-row">
                    <td>{index + 1}</td>
                    <td>{f.f_category}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="action-button"
                        onClick={() => handleSelectCategory(f)}
                      >
                        Set Schedule
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {selectedCategory && (
            <div className="schedule-form-container">
              <div className="flex items-center justify-between mb-2">
                <h3>
                  Set Schedule for Category: <em>{selectedCategory.f_category}</em>
                </h3>
                <button
                  className="action-button back-button"
                  onClick={closeScheduleForm}
                >
                  ← Back
                </button>
              </div>

              <ScheduleManager
                category={selectedCategory}
                sadId={sadId}
                ikiminaList={ikiminaList}
                onClose={closeScheduleForm}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
