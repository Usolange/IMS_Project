import React from 'react';
import PropTypes from 'prop-types';
import DailyScheduleForm from './DailyScheduleForm';
import WeeklyScheduleForm from './WeeklyScheduleForm';
import MonthlyScheduleForm from './MonthlyScheduleForm';

const ScheduleManager = ({ category, sadId, ikiminaList, onClose }) => {
  if (!category) return null;

  const { f_category, f_id } = category;

  switch (f_category) {
    case 'Daily':
      return <DailyScheduleForm f_id={f_id} sadId={sadId} ikiminaList={ikiminaList} onClose={onClose} />;
    case 'Weekly':
      return <WeeklyScheduleForm f_id={f_id} sadId={sadId} ikiminaList={ikiminaList} onClose={onClose} />;
    case 'Monthly':
      return <MonthlyScheduleForm f_id={f_id} sadId={sadId} ikiminaList={ikiminaList} onClose={onClose} />;
    default:
      return (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <p>Unsupported frequency category: <strong>{f_category}</strong></p>
          <button onClick={onClose} className="action-button" style={{ marginTop: '1rem' }}>
            Close
          </button>
        </div>
      );
  }
};

ScheduleManager.propTypes = {
  category: PropTypes.shape({
    f_category: PropTypes.string.isRequired,
    f_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }),
  sadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  ikiminaList: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ScheduleManager;
