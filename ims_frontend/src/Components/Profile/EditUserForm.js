import React, { useState } from 'react';
import '../CSS/EditUserForm.css';

export default function EditUserForm({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    username: user.username || '',
    phone: user.phone || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (formData.phone && !/^[0-9]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10–15 digits';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="edit-user-form" noValidate>
      <h3>Edit Profile</h3>

      <label htmlFor="name">
        Full Name:
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'input-error' : ''}
          autoComplete="name"
          required
        />
        {errors.name && <div className="form-error">{errors.name}</div>}
      </label>

      <label htmlFor="email">
        Email:
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'input-error' : ''}
          autoComplete="email"
          required
        />
        {errors.email && <div className="form-error">{errors.email}</div>}
      </label>

      <label htmlFor="username">
        Username:
        <input
          id="username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className={errors.username ? 'input-error' : ''}
          autoComplete="username"
          required
        />
        {errors.username && <div className="form-error">{errors.username}</div>}
      </label>

      <label htmlFor="phone">
        Phone:
        <input
          id="phone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={errors.phone ? 'input-error' : ''}
          autoComplete="tel"
          placeholder="Optional"
          pattern="[0-9]{10,15}"
        />
        {errors.phone && <div className="form-error">{errors.phone}</div>}
      </label>

      <div className="form-buttons">
        <button type="submit" className="save-btn">Save</button>
        <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
      </div>
    </form>
  );
}
