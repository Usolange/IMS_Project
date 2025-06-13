import React, { useState, useEffect } from 'react';
import axios from 'axios';
import locations from './locations.json'; 
import '../../../CSS/EditLocationModal.css'

export default function EditLocationModal({ location, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    ikimina_name: '',
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    sad_id: '',
  });

  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);

  const [error, setError] = useState('');

  useEffect(() => {
    if (location) {
      setFormData({
        ikimina_name: location.ikimina_name || '',
        province: location.province || '',
        district: location.district || '',
        sector: location.sector || '',
        cell: location.cell || '',
        village: location.village || '',
        sad_id: location.sad_id || '',
      });

      const provinceObj = locations.provinces.find(p => p.name === location.province);
      const initialDistricts = provinceObj ? provinceObj.districts : [];
      setDistricts(initialDistricts);

      const districtObj = initialDistricts.find(d => d.name === location.district);
      const initialSectors = districtObj ? districtObj.sectors : [];
      setSectors(initialSectors);

      const sectorObj = initialSectors.find(s => s.name === location.sector);
      const initialCells = sectorObj ? sectorObj.cells : [];
      setCells(initialCells);

      const cellObj = initialCells.find(c => c.name === location.cell);
      const initialVillages = cellObj ? cellObj.villages : [];
      setVillages(initialVillages);
    }
  }, [location]);

  // Cascading handlers (same as yours)
  const handleProvinceChange = e => {
    const province = e.target.value;
    setFormData(prev => ({
      ...prev,
      province,
      district: '',
      sector: '',
      cell: '',
      village: '',
    }));

    const provinceObj = locations.provinces.find(p => p.name === province);
    const newDistricts = provinceObj ? provinceObj.districts : [];
    setDistricts(newDistricts);
    setSectors([]);
    setCells([]);
    setVillages([]);
  };

  const handleDistrictChange = e => {
    const district = e.target.value;
    setFormData(prev => ({
      ...prev,
      district,
      sector: '',
      cell: '',
      village: '',
    }));

    const districtObj = districts.find(d => d.name === district);
    const newSectors = districtObj ? districtObj.sectors : [];
    setSectors(newSectors);
    setCells([]);
    setVillages([]);
  };

  const handleSectorChange = e => {
    const sector = e.target.value;
    setFormData(prev => ({
      ...prev,
      sector,
      cell: '',
      village: '',
    }));

    const sectorObj = sectors.find(s => s.name === sector);
    const newCells = sectorObj ? sectorObj.cells : [];
    setCells(newCells);
    setVillages([]);
  };

  const handleCellChange = e => {
    const cell = e.target.value;
    setFormData(prev => ({
      ...prev,
      cell,
      village: '',
    }));

    const cellObj = cells.find(c => c.name === cell);
    const newVillages = cellObj ? cellObj.villages : [];
    setVillages(newVillages);
  };

  const handleVillageChange = e => {
    const village = e.target.value;
    setFormData(prev => ({
      ...prev,
      village,
    }));
  };

  const handleInputChange = e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  // Update submit
  const handleUpdate = async () => {
    setError('');
    // Simple validation (you can expand)
    if (
      !formData.ikimina_name.trim() ||
      !formData.province ||
      !formData.district ||
      !formData.sector ||
      !formData.cell ||
      !formData.village
    ) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:5000/api/LocationManagerRoutes/update/${location.id}`,
        formData
      );
      onUpdated(res.data.message);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update.');
    }
  };

 return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Ikimina Location</h3>
        {error && <p className="error-message">{error}</p>}

        <input
          type="text"
          name="ikimina_name"
          value={formData.ikimina_name}
          onChange={handleInputChange}
          placeholder="Ikimina Name"
        />

        <select name="province" value={formData.province} onChange={handleProvinceChange}>
          <option value="">Select Province</option>
          {locations.provinces.map(p => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>

        <select
          name="district"
          value={formData.district}
          onChange={handleDistrictChange}
          disabled={!districts.length}
        >
          <option value="">Select District</option>
          {districts.map(d => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>

        <select
          name="sector"
          value={formData.sector}
          onChange={handleSectorChange}
          disabled={!sectors.length}
        >
          <option value="">Select Sector</option>
          {sectors.map(s => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>

        <select
          name="cell"
          value={formData.cell}
          onChange={handleCellChange}
          disabled={!cells.length}
        >
          <option value="">Select Cell</option>
          {cells.map(c => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select
          name="village"
          value={formData.village}
          onChange={handleVillageChange}
          disabled={!villages.length}
        >
          <option value="">Select Village</option>
          {villages.map(v => (
            <option key={v.name} value={v.name}>{v.name}</option>
          ))}
        </select>

        <div className="modal-buttons">
          <button onClick={handleUpdate}>Update</button>
          <button onClick={onClose} className="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}
