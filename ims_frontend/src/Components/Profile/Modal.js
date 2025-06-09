// src/Components/Profile/Modal.js
import React from 'react';
import '../CSS/Modal.css';

export default function Modal({ isOpen, closeModal, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="modal-close-button" onClick={closeModal}>×</button>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}
