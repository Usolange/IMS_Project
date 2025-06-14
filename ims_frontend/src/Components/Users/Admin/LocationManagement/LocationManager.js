import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditLocationModal from './EditLocationModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import '../../../CSS/LocationManager.css';

export default function LocationManager() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [toast, setToast] = useState({ type: '', message: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let sad_id = null;
    try {
      const user = JSON.parse(storedUser);
      sad_id = user?.id;
    } catch (err) {
      console.error("Invalid user object in localStorage");
    }

    if (sad_id) {
      fetchLocations(sad_id);
    } else {
      showToast('error', 'User ID missing. Please login again.');
    }
  }, []);

  const fetchLocations = async (sad_id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/LocationManagerRoutes/select?sad_id=${sad_id}`);
      setLocations(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load locations.');
    }
  };

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setShowEditModal(true);
  };

  const handleDeletePrompt = (location) => {
    setLocationToDelete(location);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    const storedUser = localStorage.getItem('user');
    let sad_id = null;
    try {
      const user = JSON.parse(storedUser);
      sad_id = user?.id;
    } catch (err) {
      console.error("Invalid user object in localStorage");
    }

    if (!sad_id) {
      showToast('error', 'User ID missing. Please login again.');
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/LocationManagerRoutes/delete/${locationToDelete.id}`, {
        data: { sad_id }
      });
      showToast('success', `${locationToDelete.ikimina_name} deleted successfully.`);
      fetchLocations(sad_id);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to delete the location.');
    } finally {
      setShowDeleteModal(false);
      setLocationToDelete(null);
    }
  };



const handleUpdated = (msg) => {
  const storedUser = localStorage.getItem('user');
  const user = JSON.parse(storedUser);
  const sad_id = user?.id;

  if (!sad_id) {
    showToast('error', 'User ID missing. Please login again.');
    return;
  }

  showToast('success', msg || 'Location updated successfully.');
  setShowEditModal(false); // ✅ CLOSE THE MODAL
  setSelectedLocation(null); // ✅ RESET SELECTION
  fetchLocations(sad_id);    // ✅ REFRESH THE DATA
};








  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3000);
  };




  return (
    <div className="location-manager">
      <div className="header-row">
        <h2>Ikimina Locations</h2>
        <div className="header-buttons">
          <a href="/AddLocation" className="btn-add-location">Add Location</a>
          <a href="/adminDashboard" className="btn-back-home">Back to Home</a>
        </div>
      </div>

      {toast.message && (
        <div className={`toast-message ${toast.type}`}>{toast.message}</div>
      )}

      <table className="locations-table">
        <thead>
          <tr>
            <th>#</th>
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
          {locations.length === 0 ? (
            <tr><td colSpan="8">No locations found.</td></tr>
          ) : (
            locations.map((loc, index) => (
              <tr key={loc.id || index}>
                <td>{index + 1}</td>
                <td>{loc.ikimina_name}</td>
                <td>{loc.province}</td>
                <td>{loc.district}</td>
                <td>{loc.sector}</td>
                <td>{loc.cell}</td>
                <td>{loc.village}</td>
                <td>
                  <button onClick={() => handleEdit(loc)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDeletePrompt(loc)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showEditModal && selectedLocation && (
        <EditLocationModal
          location={selectedLocation}
          onClose={() => setShowEditModal(false)}
          onUpdated={handleUpdated}
        />
      )}

      {showDeleteModal && locationToDelete && (
        <ConfirmDeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          locationName={locationToDelete.ikimina_name}
        />
      )}
    </div>
  );
}
