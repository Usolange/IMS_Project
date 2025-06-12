import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function FrequencyCategoryManager({ userId, selectedCategoryId, onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchCategories = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/frequencyCategory/selectCategories', {
          headers: { 'x-sad-id': userId.toString() },
        });
        const sorted = res.data.sort((a, b) => a.f_category.localeCompare(b.f_category));
        setCategories(sorted);
      } catch (err) {
        setError('Failed to load categories');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [userId]);

  const handleChange = (e) => {
    const fId = e.target.value;
    onSelectCategory(fId);
  };

  if (!userId) return <p>Please log in to load categories.</p>;

  if (loading) return <p>Loading categories...</p>;

  if (error) return <p className="error">{error}</p>;

  return (
    <select value={selectedCategoryId || ''} onChange={handleChange} disabled={loading || categories.length === 0}>
      <option value="" disabled>
        -- Select Category --
      </option>
      {categories.map(({ f_id, f_category }) => (
        <option key={f_id} value={f_id}>
          {f_category}
        </option>
      ))}
    </select>
  );
}
