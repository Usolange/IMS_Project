import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IkiminaForm from './IkiminaManagement';

export default function IkiminaTable() {
  const [ikiminas, setIkiminas] = useState([]);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ f_id: '', iki_location: '' });
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    axios.get('/api/categories').then(res => setCategories(res.data));
    axios.get('/api/locations').then(res => setLocations(res.data));
    fetchIkiminas();
  }, []);

  const fetchIkiminas = () => {
    axios.get('/api/ikimina-info', { params: filter }).then(res => setIkiminas(res.data));
  };

  const deleteIkimina = async (id) => {
    if (window.confirm('Delete this Ikimina?')) {
      await axios.delete(`/api/ikimina-info/${id}`);
      fetchIkiminas();
    }
  };

  return (
    <div className="p-4">
      {!editing ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Ikimina Records</h2>
            <button onClick={() => setEditing({})} className="bg-green-500 text-white px-4 py-1 rounded">+ New Ikimina</button>
          </div>

          <div className="flex gap-3 mb-4">
            <select onChange={e => setFilter({ ...filter, f_id: e.target.value })} className="select">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.f_id} value={c.f_id}>{c.f_category}</option>)}
            </select>
            <select onChange={e => setFilter({ ...filter, iki_location: e.target.value })} className="select">
              <option value="">All Locations</option>
              {locations.map(l => <option key={l.ikimina_id} value={l.ikimina_id}>{l.ikimina_name}</option>)}
            </select>
            <button onClick={fetchIkiminas} className="bg-blue-500 text-white px-3">Filter</button>
          </div>

          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Location</th><th>Category</th><th>Time</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ikiminas.map(i => (
                <tr key={i.iki_id} className="border-t">
                  <td>{i.iki_id}</td>
                  <td>{i.iki_name}</td>
                  <td>{i.iki_email}</td>
                  <td>{i.location_name}</td>
                  <td>{i.f_category}</td>
                  <td>{i.timeOfEven}</td>
                  <td>
                    <button onClick={() => setEditing(i)} className="text-blue-500 mr-2">Edit</button>
                    <button onClick={() => deleteIkimina(i.iki_id)} className="text-red-500">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <IkiminaForm editingData={editing.iki_id ? editing : null} onSuccess={() => { setEditing(null); fetchIkiminas(); }} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
