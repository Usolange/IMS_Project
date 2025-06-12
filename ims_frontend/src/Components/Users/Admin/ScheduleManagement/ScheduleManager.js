import React from 'react';
import DailyScheduleForm from './DailyScheduleForm';
import WeeklyScheduleForm from './WeeklyScheduleForm';
import MonthlyScheduleForm from './MonthlyScheduleForm';

const ScheduleManager = ({ category, sadId, onClose }) => {
    if (!category) return null;

    const { f_category, f_id } = category;

    switch (f_category) {
        case 'Daily':
            return <DailyScheduleForm f_id={f_id} onClose={onClose} />;
        case 'Weekly':
            return <WeeklyScheduleForm f_id={f_id} onClose={onClose} />;
        case 'Monthly':
            return <MonthlyScheduleForm f_id={f_id} onClose={onClose} />;
        default:
            return (
                <div>
                    <p>Unsupported frequency category: {f_category}</p>
                    <button onClick={onClose} className="action-button">
                        Close
                    </button>
                </div>
            );
    }
};

export default ScheduleManager;
