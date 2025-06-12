import React, { useEffect, useState } from 'react';
import '../CSS/Modal.css';

export default function Modal({ isOpen, closeModal, children }) {
  const [visible, setVisible] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (visible) {
      // Start closing animation
      setClosing(true);
      // After animation duration, hide modal and restore scroll
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
        document.body.style.overflow = '';
      }, 300); // match animation duration in CSS

      return () => clearTimeout(timer);
    }
  }, [isOpen, visible]);

  if (!visible) return null;

  return (
    <div className={`modal-container ${closing ? 'modal-close' : 'modal-open'}`}>
      <button className="modal-close-button" onClick={closeModal}>×</button>
      <div className="modal-content">
        {children}
      </div>
    </div>
  );
}
