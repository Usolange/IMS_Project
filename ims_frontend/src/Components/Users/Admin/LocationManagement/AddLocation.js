import React, { useState, useEffect } from 'react';
import locations from './locations.json';
import { Link } from "react-router-dom";
import '../../../CSS/AddLocation.css';
import axios from 'axios';

export default function LocationSelector({ onSelect }) {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCell, setSelectedCell] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [ikiminaName, setIkiminaName] = useState('');

  // fetched categories and selected f_id
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);

  const [errorMessages, setErrorMessages] = useState({
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    ikiminaName: '',
    category: '',
  });

  const [loggedUserName, setLoggedUserName] = useState('');
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.name) setLoggedUserName(user.name);
  }, []);

  // fetch categories once
  useEffect(() => {
    async function fetchCategories() {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await axios.get(
          'http://localhost:5000/api/frequencyCategory/selectCategories',
          { headers: { 'x-sad-id': user.id } }
        );
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    }
    fetchCategories();
  }, []);

  // cascade selects
  useEffect(() => {
    const p = locations.provinces.find(p => p.name === selectedProvince);
    setDistricts(p ? p.districts : []);
    setSelectedDistrict(''); setSelectedSector(''); setSelectedCell(''); setSelectedVillage('');
    setSectors([]); setCells([]); setVillages([]);
  }, [selectedProvince]);

  useEffect(() => {
    const d = districts.find(d => d.name === selectedDistrict);
    setSectors(d ? d.sectors : []);
    setSelectedSector(''); setSelectedCell(''); setSelectedVillage('');
    setCells([]); setVillages([]);
  }, [selectedDistrict]);

  useEffect(() => {
    const s = sectors.find(s => s.name === selectedSector);
    setCells(s ? s.cells : []);
    setSelectedCell(''); setSelectedVillage('');
    setVillages([]);
  }, [selectedSector]);

  useEffect(() => {
    const c = cells.find(c => c.name === selectedCell);
    setVillages(c ? c.villages : []);
    setSelectedVillage('');
  }, [selectedCell]);

  // notify parent if needed
  useEffect(() => {
    if (onSelect) {
      onSelect({
        province: selectedProvince,
        district: selectedDistrict,
        sector: selectedSector,
        cell: selectedCell,
        village: selectedVillage,
        ikiminaName,
        f_id: selectedCategoryId,
      });
    }
  }, [
    selectedProvince, selectedDistrict, selectedSector,
    selectedCell, selectedVillage, ikiminaName,
    selectedCategoryId, onSelect
  ]);

  const handleReset = () => {
    setSelectedProvince(''); setSelectedDistrict(''); setSelectedSector('');
    setSelectedCell(''); setSelectedVillage(''); setIkiminaName('');
    setSelectedCategoryId('');
    setErrorMessages({
      province: '', district: '', sector: '',
      cell: '', village: '', ikiminaName: '',
      category: '',
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    const userLocation = user?.userLocation;

    const errors = {
      province: selectedProvince ? '' : 'Select a Province.',
      district: selectedDistrict ? '' : 'Select a District.',
      sector: selectedSector ? '' : 'Select a Sector.',
      cell: selectedCell ? '' : 'Select a Cell.',
      village: selectedVillage ? '' : 'Select a Village.',
      ikiminaName: ikiminaName.trim() ? '' : 'Enter Ikimina Name.',
      category: selectedCategoryId ? '' : 'Select a Category.',
    };
    if (
      selectedSector &&
      userLocation &&
      selectedSector.toLowerCase() !== userLocation.toLowerCase()
    ) {
      errors.sector = 'Cannot manage outside your sector!';
    }
    setErrorMessages(errors);
    if (Object.values(errors).some(m => m)) return;

    try {
      await axios.post(
        'http://localhost:5000/api/LocationManagerRoutes/create',
        {
          ikiminaName,
          f_id: selectedCategoryId,
          province: selectedProvince,
          district: selectedDistrict,
          sector: selectedSector,
          cell: selectedCell,
          village: selectedVillage,
          sad_id: user.id,
        }
      );
      alert('Ikimina saved successfully.');
      handleReset();
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMessages(prev => ({
          ...prev,
          ikiminaName: 'Name exists in this Cell. Choose another.',
        }));
      } else {
        alert('Save failed: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <form className="location-selector" onSubmit={handleSubmit} noValidate>
      <a href="/FrequencyCategoryManagement" className="btn-add-location">
        + Add Category
      </a>
      <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
        Logged in user: {loggedUserName}
      </div>

      <input
        type="text"
        name="ikiminaName"
        value={ikiminaName}
        onChange={e => setIkiminaName(e.target.value)}
        placeholder="Enter Ikimina Name"
        aria-describedby="ikiminaName-error"
      />
      {errorMessages.ikiminaName && (
        <p className="field-error" id="ikiminaName-error">
          {errorMessages.ikiminaName}
        </p>
      )}

      <select
        value={selectedCategoryId}
        onChange={e => setSelectedCategoryId(e.target.value)}
        aria-describedby="category-error"
        required
      >
        <option value="">Select Category</option>
        {categories.map(cat => (
          <option key={cat.f_id} value={cat.f_id}>
            {cat.f_category}
          </option>
        ))}
      </select>
      {errorMessages.category && (
        <p className="field-error" id="category-error">
          {errorMessages.category}
        </p>
      )}

      <select
        name="province"
        value={selectedProvince}
        onChange={e => setSelectedProvince(e.target.value)}
        aria-describedby="province-error"
      >
        <option value="">Select Province</option>
        {locations.provinces.map(p => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
      {errorMessages.province && (
        <p className="field-error" id="province-error">
          {errorMessages.province}
        </p>
      )}

      <select
        name="district"
        value={selectedDistrict}
        onChange={e => setSelectedDistrict(e.target.value)}
        disabled={!districts.length}
        aria-describedby="district-error"
      >
        <option value="">Select District</option>
        {districts.map(d => (
          <option key={d.name} value={d.name}>
            {d.name}
          </option>
        ))}
      </select>
      {errorMessages.district && (
        <p className="field-error" id="district-error">
          {errorMessages.district}
        </p>
      )}

      <select
        name="sector"
        value={selectedSector}
        onChange={e => setSelectedSector(e.target.value)}
        disabled={!sectors.length}
        aria-describedby="sector-error"
      >
        <option value="">Select Sector</option>
        {sectors.map(s => (
          <option key={s.name} value={s.name}>
            {s.name}
          </option>
        ))}
      </select>
      {errorMessages.sector && (
        <p className="field-error" id="sector-error">
          {errorMessages.sector}
        </p>
      )}

      <select
        name="cell"
        value={selectedCell}
        onChange={e => setSelectedCell(e.target.value)}
        disabled={!cells.length}
        aria-describedby="cell-error"
      >
        <option value="">Select Cell</option>
        {cells.map(c => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      {errorMessages.cell && (
        <p className="field-error" id="cell-error">
          {errorMessages.cell}
        </p>
      )}

      <select
        name="village"
        value={selectedVillage}
        onChange={e => setSelectedVillage(e.target.value)}
        disabled={!villages.length}
        aria-describedby="village-error"
      >
        <option value="">Select Village</option>
        {villages.map(v => (
          <option key={v.name} value={v.name}>
            {v.name}
          </option>
        ))}
      </select>
      {errorMessages.village && (
        <p className="field-error" id="village-error">
          {errorMessages.village}
        </p>
      )}

      <div className="buttons-wrapper" style={{ marginLeft: '10px' }}>
        <button type="submit" className="btn-submit">
          Submit
        </button>
        <button
          type="button"
          className="btn-reset"
          onClick={handleReset}
        >
          Reset
        </button>
        <Link to="/LocationManager" className="btn-back" style={{ marginLeft: '10px' }}>
          ⬅ Back
        </Link>
      </div>
    </form>
  );
}
