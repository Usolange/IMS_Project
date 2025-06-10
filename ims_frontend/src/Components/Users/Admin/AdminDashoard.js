import React from 'react';

export default function DashboardContent() {
  return (
    <div className="dashboard-content">
      <h2 className="content-title">Welcome to the Ikimina Admin Dashboard</h2>
      <p className="content-description">
        Here you can manage frequency categories, create Ikimina groups, and set time schedules.
      </p>

      {/* Example of displaying data */}
      <div className="content-section">
        <h3 className="section-title">Recent Ikimina Groups</h3>
        <ul className="content-list">
          <li>Group A - Weekly Savings</li>
          <li>Group B - Monthly Investment</li>
          <li>Group C - Emergency Fund</li>
        </ul>
      </div>

      <div className="content-section">
        <h3 className="section-title">Upcoming Payments</h3>
        <table className="content-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Amount</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Group A</td>
              <td>$100</td>
              <td>June 15</td>
            </tr>
            <tr>
              <td>Group B</td>
              <td>$250</td>
              <td>June 30</td>
            </tr>
            <tr>
              <td>Group C</td>
              <td>$75</td>
              <td>July 5</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
