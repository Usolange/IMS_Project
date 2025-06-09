import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function FrequencyForm() {
  const [frequencies, setFrequencies] = useState([]);
  const [category, setCategory] = useState('');
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // State for managing modal visibility

  useEffect(() => {
    fetchFrequencies();
  }, []);

  // Fetch frequencies from the backend
  const fetchFrequencies = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/frequencyCategory');
      setFrequencies(res.data);
      setLoading(false);
    } catch (error) {
      setMessage('Error fetching frequencies');
      setLoading(false);
    }
  };

  // Handle form submission for adding/updating a category
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        // Update the category if editId exists
        await axios.put(`http://localhost:5000/api/frequencyCategory/${editId}`, { f_category: category });
        setMessage('Category updated successfully!');
      } else {
        // Create a new category
        await axios.post('http://localhost:5000/api/frequencyCategory', { f_category: category });
        setMessage('Category added successfully!');
      }
      setCategory('');
      setEditId(null);
      fetchFrequencies();
      setIsModalOpen(false); // Close modal after successful submission
    } catch (error) {
      setMessage('Error saving category');
    } finally {
      setLoading(false);
    }
  };

  // Handle editing a category
  const handleEdit = (id, cat) => {
    setCategory(cat);
    setEditId(id);
    setIsModalOpen(true); // Open modal for editing
  };

  // Handle deleting a category
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/frequencyCategory/${id}`);
      setMessage('Category deleted successfully!');
      fetchFrequencies();
    } catch (error) {
      setMessage('Error deleting category');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the modal for adding a new category
  const openModal = () => {
    setCategory('');
    setEditId(null);
    setIsModalOpen(true); // Open modal for new category
  };

  // Handle closing the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4">Frequency Categories</h3>

      {/* Success/Failure message */}
      {message && <p className="mb-4 text-green-500">{message}</p>}

      {/* Button to open the modal for adding a new category */}
      <button onClick={openModal} className="bg-green-600 text-white px-4 py-2 rounded mb-4">
        Add New Category
      </button>

      {/* Modal for adding/editing a category */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h4 className="text-xl mb-4">{editId ? 'Edit Category' : 'Add New Category'}</h4>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category name"
                className="border px-3 py-2 w-full mb-4"
                required
              />
              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : editId ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && <p className="text-gray-500">Loading...</p>}

      <ul>
        {frequencies.map((f) => (
          <li key={f.f_id} className="mb-2 flex justify-between">
            <span>{f.f_category}</span>
            <div className="space-x-2">
              <button onClick={() => handleEdit(f.f_id, f.f_category)} className="text-yellow-600">
                Edit
              </button>
              <button onClick={() => handleDelete(f.f_id)} className="text-red-600">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
