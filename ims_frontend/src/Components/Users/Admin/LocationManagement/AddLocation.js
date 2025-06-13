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

  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);


  // Error messages keyed by field name
  const [errorMessages, setErrorMessages] = useState({
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    ikiminaName: '',
  });

  const [loggedUserName, setLoggedUserName] = useState('');
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.name) setLoggedUserName(user.name);
  }, []);



  useEffect(() => {
    const province = locations.provinces.find(p => p.name === selectedProvince);
    setDistricts(province ? province.districts : []);
    setSelectedDistrict('');
    setSelectedSector('');
    setSelectedCell('');
    setSelectedVillage('');
    setSectors([]);
    setCells([]);
    setVillages([]);
  }, [selectedProvince]);

  useEffect(() => {
    const district = districts.find(d => d.name === selectedDistrict);
    setSectors(district ? district.sectors : []);
    setSelectedSector('');
    setSelectedCell('');
    setSelectedVillage('');
    setCells([]);
    setVillages([]);
  }, [selectedDistrict]);

  useEffect(() => {
    const sector = sectors.find(s => s.name === selectedSector);
    setCells(sector ? sector.cells : []);
    setSelectedCell('');
    setSelectedVillage('');
    setVillages([]);
  }, [selectedSector]);

  useEffect(() => {
    const cell = cells.find(c => c.name === selectedCell);
    setVillages(cell ? cell.villages : []);
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
      });
    }
  }, [selectedVillage, selectedCell, selectedSector, selectedDistrict, selectedProvince, ikiminaName, onSelect]);

  const handleReset = () => {
    setSelectedProvince('');
    setSelectedDistrict('');
    setSelectedSector('');
    setSelectedCell('');
    setSelectedVillage('');
    setIkiminaName('');
    setErrorMessages({
      province: '',
      district: '',
      sector: '',
      cell: '',
      village: '',
      ikiminaName: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // get logged user sector
    const user = JSON.parse(localStorage.getItem('user'));
    const userLocation = user?.userLocation;

    // Validation errors
    const errors = {
      province: selectedProvince ? '' : 'Please select a Province.',
      district: selectedDistrict ? '' : 'Please select a District.',
      sector: selectedSector ? '' : 'Please select a Sector.',
      cell: selectedCell ? '' : 'Please select a Cell.',
      village: selectedVillage ? '' : 'Please select a Village.',
      ikiminaName: ikiminaName.trim() ? '' : 'Please enter Ikimina Name.'
    };

    // New validation for sector match ignoring case
    if (selectedSector && userLocation && selectedSector.toLowerCase() !== userLocation.toLowerCase()) {
      errors.sector = 'Please you can not Manage Ikimina outside your sector!';
    }

    setErrorMessages(errors);

    const hasErrors = Object.values(errors).some(msg => msg !== '');
    if (hasErrors) return;

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const sad_id = user?.id || user?.sad_id;
      if (!sad_id) {
        alert('User not logged in properly.');
        return;
      }

      const res = await axios.post('http://localhost:5000/api/LocationManagerRoutes/create', {
        ikiminaName,
        province: selectedProvince,
        district: selectedDistrict,
        sector: selectedSector,
        cell: selectedCell,
        village: selectedVillage,
        sad_id,
      });

      alert(res.data.message);
      handleReset();
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMessages(prev => ({
          ...prev,
          ikiminaName: 'This Ikimina name already exists in this Cell. Please use Other name!.'
        }));
      } else {
        alert('Failed to save: ' + (err.response?.data?.message || err.message));
      }
    }
  };



  return (
    <form className="location-selector" onSubmit={handleSubmit} noValidate>
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
      {errorMessages.ikiminaName && <p className="field-error" id="ikiminaName-error">{errorMessages.ikiminaName}</p>}
      <select
        name="province"
        value={selectedProvince}
        onChange={e => setSelectedProvince(e.target.value)}
        aria-describedby="province-error"
      >
        <option value="">Select Province</option>
        {locations.provinces.map(p => (
          <option key={p.name} value={p.name}>{p.name}</option>
        ))}
      </select>
      {errorMessages.province && <p className="field-error" id="province-error">{errorMessages.province}</p>}

      <select
        name="district"
        value={selectedDistrict}
        onChange={e => setSelectedDistrict(e.target.value)}
        disabled={!districts.length}
        aria-describedby="district-error"
      >
        <option value="">Select District</option>
        {districts.map(d => (
          <option key={d.name} value={d.name}>{d.name}</option>
        ))}
      </select>
      {errorMessages.district && <p className="field-error" id="district-error">{errorMessages.district}</p>}

      <select
        name="sector"
        value={selectedSector}
        onChange={e => setSelectedSector(e.target.value)}
        disabled={!sectors.length}
        aria-describedby="sector-error"
      >
        <option value="">Select Sector</option>
        {sectors.map(s => (
          <option key={s.name} value={s.name}>{s.name}</option>
        ))}
      </select>
      {errorMessages.sector && <p className="field-error" id="sector-error">{errorMessages.sector}</p>}

      <select
        name="cell"
        value={selectedCell}
        onChange={e => setSelectedCell(e.target.value)}
        disabled={!cells.length}
        aria-describedby="cell-error"
      >
        <option value="">Select Cell</option>
        {cells.map(c => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>
      {errorMessages.cell && <p className="field-error" id="cell-error">{errorMessages.cell}</p>}

      <select
        name="village"
        value={selectedVillage}
        onChange={e => setSelectedVillage(e.target.value)}
        disabled={!villages.length}
        aria-describedby="village-error"
      >
        <option value="">Select Village</option>
        {villages.map(v => (
          <option key={v.name} value={v.name}>{v.name}</option>
        ))}
      </select>
      {errorMessages.village && <p className="field-error" id="village-error">{errorMessages.village}</p>}



      <div className="buttons-wrapper" style={{ marginLeft: '10px' }}>
        <button type="submit" className="btn-submit">Submit</button>
        <button type="button" className="btn-reset" onClick={handleReset}>Reset</button>
        <Link to="/LocationManager" className="btn-back" style={{ marginLeft: '10px' }}>
          ⬅ Back
        </Link>
      </div>
    </form>
  );
}
