import React, { useState, useEffect } from 'react';
import locations from './locations.json';
import { Link } from 'react-router-dom';
import '../../../CSS/AddLocation.css';
import axios from 'axios';

export default function LocationSelector({ onSelect }) {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCell, setSelectedCell] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [ikiminaName, setIkiminaName] = useState('');

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);

  const [errorMessages, setErrorMessages] = useState({
    province: '', district: '', sector: '', cell: '', village: '', ikiminaName: '', category: '',
  });

  const [loggedUserName, setLoggedUserName] = useState('');
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.name) setLoggedUserName(user.name);
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await axios.get(
          'http://localhost:5000/api/frequencyCategoryRoutes/selectCategories',
          { headers: { 'x-sad-id': user.id } }
        );
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    }
    fetchCategories();
  }, []);

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
      province: '', district: '', sector: '', cell: '', village: '', ikiminaName: '', category: '',
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
        'http://localhost:5000/api/locationManagerRoutes/newLocation',
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
    <form className="location-selector-form" onSubmit={handleSubmit} noValidate>
       <div className="form-group">
        <label>Logged in user: <strong>{loggedUserName}</strong></label>
      </div>
      <div className="flex-end">
        <a href="/FrequencyCategoryManagement" className="btn-add-category">+ Add Category</a>
      </div>

       <div className="form-group">
        <input
          type="text"
          name="ikiminaName"
          value={ikiminaName}
          onChange={e => setIkiminaName(e.target.value)}
          placeholder="Enter Ikimina Name"
          className="form-input"
          aria-describedby="ikiminaName-error"
        />
        {errorMessages.ikiminaName && (
          <p className="field-error">{errorMessages.ikiminaName}</p>
        )}
      </div>

      <div className="form-group">
        <select
          value={selectedCategoryId}
          onChange={e => setSelectedCategoryId(e.target.value)}
          className="form-select"
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.f_id} value={cat.f_id}>
              {cat.f_category}
            </option>
          ))}
        </select>
        {errorMessages.category && <p className="field-error">{errorMessages.category}</p>}
      </div>

      {[{
        label: 'Province', value: selectedProvince, set: setSelectedProvince, list: locations.provinces,
        error: errorMessages.province, disabled: false
      }, {
        label: 'District', value: selectedDistrict, set: setSelectedDistrict, list: districts,
        error: errorMessages.district, disabled: !districts.length
      }, {
        label: 'Sector', value: selectedSector, set: setSelectedSector, list: sectors,
        error: errorMessages.sector, disabled: !sectors.length
      }, {
        label: 'Cell', value: selectedCell, set: setSelectedCell, list: cells,
        error: errorMessages.cell, disabled: !cells.length
      }, {
        label: 'Village', value: selectedVillage, set: setSelectedVillage, list: villages,
        error: errorMessages.village, disabled: !villages.length
      }].map(({ label, value, set, list, error, disabled }) => (
        <div className="form-group" key={label}>
          <select
            className="form-select"
            value={value}
            onChange={e => set(e.target.value)}
            disabled={disabled}
          >
            <option value="">{`Select ${label}`}</option>
            {list.map(item => (
              <option key={item.name} value={item.name}>{item.name}</option>
            ))}
          </select>
          {error && <p className="field-error">{error}</p>}
        </div>
      ))}

      <div className="buttons-wrapper">
        <button type="submit" className="form-button submit-button">Submit</button>
        <button type="button" className="form-button reset-button" onClick={handleReset}>Reset</button>
        <Link to="/LocationManager" className="form-link back-link">⬅ Back</Link>
      </div>
    </form>
  );
}
