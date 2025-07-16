import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import '../../components/layout/Dashboard.css';

const Analytics: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>View sales and performance analytics</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="dashboard-content">
        <div className="feature-placeholder">
          <h2>Analytics & Reporting System</h2>
          <p>This feature will allow you to:</p>
          <ul>
            <li>View sales performance metrics</li>
            <li>Analyze quote conversion rates</li>
            <li>Track revenue and profitability</li>
            <li>Generate custom reports</li>
            <li>Monitor business trends</li>
          </ul>
          <p><strong>Status:</strong> Coming in Phase 5</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
