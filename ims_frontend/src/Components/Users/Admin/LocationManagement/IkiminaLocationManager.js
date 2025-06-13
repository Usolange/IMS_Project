//IkiminaLocationManager.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EditLocationModal from './EditLocationModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Toast from './Toast';

const IkiminaLocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const user = JSON.parse(localStorage.getItem('user'));
  const sad_id = user?.sad_id;

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/LocationManagerRoutes/select?sad_id=${sad_id}`);
      setLocations(res.data);
    } catch (err) {
      setToast({ message: 'Failed to fetch locations', type: 'error' });
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setShowEditModal(true);
  };

  const handleDelete = (location) => {
    setSelectedLocation(location);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = async (updatedData) => {
    try {
      await axios.put(`http://localhost:5000/api/LocationManagerRoutes/update/${selectedLocation.id}`, {
        ...updatedData,
        sad_id
      });
      setToast({ message: 'Location updated successfully', type: 'success' });
      setShowEditModal(false);
      fetchLocations();
    } catch (err) {
      setToast({ message: 'Failed to update location', type: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/LocationManagerRoutes/delete/${selectedLocation.id}`, {
        data: { sad_id }
      });
      setToast({ message: 'Location deleted successfully', type: 'success' });
      setShowDeleteModal(false);
      fetchLocations();
    } catch (err) {
      setToast({ message: 'Failed to delete location', type: 'error' });
    }
  };

  return (
    <div className="location-list">
      <h2>My Ikimina Locations</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Village</th>
            <th>Cell</th>
            <th>Sector</th>
            <th>District</th>
            <th>Province</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.id}>
              <td>{loc.ikimina_name}</td>
              <td>{loc.village}</td>
              <td>{loc.cell}</td>
              <td>{loc.sector}</td>
              <td>{loc.district}</td>
              <td>{loc.province}</td>
              <td>
                <button onClick={() => handleEdit(loc)}>Edit</button>
                <button onClick={() => handleDelete(loc)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEditModal && (
        <EditLocationModal
          data={selectedLocation}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          name={selectedLocation.ikimina_name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({})} />}
    </div>
  );
};

export default IkiminaLocationManager;
