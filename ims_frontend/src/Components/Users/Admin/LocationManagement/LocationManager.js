// components/Ikimina/LocationManager.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EditLocationModal from './EditLocationModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom"; 
import '../../../CSS/LocationManager.css';

export default function LocationManager() {
  const [locations, setLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteLocation, setDeleteLocation] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const sad_id = user?.id || user?.sad_id;
  const navigate = useNavigate();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/LocationManagerRoutes/select', {
        params: { sad_id },
      });
      setLocations(res.data);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleEdit = (location) => {
    setEditingLocation(location);
    setShowEditModal(true);
  };

  const handleDelete = (location) => {
    setDeleteLocation(location);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/LocationManagerRoutes/delete/${deleteLocation.id}`, {
        data: { sad_id },
      });
      setToastMessage('Location deleted successfully.');
      fetchLocations();
    } catch (err) {
      console.error('Delete error:', err);
      setToastMessage('Error deleting location.');
    } finally {
      setShowDeleteModal(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleUpdateSuccess = () => {
    setToastMessage('Location updated successfully.');
    fetchLocations();
    setShowEditModal(false);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="location-manager">
      <div className="header-row">
        <h2>Ikimina Location Management</h2>
         <div className="location-manager-header-buttons">
        <Link to="/AddLocation" className="btn-add-location">
          ➕ Add New Location
        </Link>
        <Link to="/adminDashboard" className="btn-back-home">
          ⬅ Back to Home Page
        </Link>
      </div>
      </div>

      {toastMessage && <div className="toast-message">{toastMessage}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : locations.length === 0 ? (
        <p>No Ikimina locations found.</p>
      ) : (
        <table className="locations-table">
          <thead>
            <tr>
              <th>Ikimina Name</th>
              <th>Province</th>
              <th>District</th>
              <th>Sector</th>
              <th>Cell</th>
              <th>Village</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map(loc => (
              <tr key={loc.id}>
                <td>{loc.ikimina_name}</td>
                <td>{loc.province}</td>
                <td>{loc.district}</td>
                <td>{loc.sector}</td>
                <td>{loc.cell}</td>
                <td>{loc.village}</td>
                <td>
                  <button onClick={() => handleEdit(loc)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(loc)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <EditLocationModal
        show={showEditModal}
        location={editingLocation}
        onClose={() => setShowEditModal(false)}
        onUpdateSuccess={handleUpdateSuccess}
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        locationName={deleteLocation?.ikimina_name}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
