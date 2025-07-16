import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import '../../components/layout/Dashboard.css';

const OrderTracking: React.FC = () => {
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
          <h1>Order Tracking</h1>
          <p>Track confirmed orders and delivery status</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="dashboard-content">
        <div className="feature-placeholder">
          <h2>Order Tracking System</h2>
          <p>This feature will allow you to:</p>
          <ul>
            <li>View all confirmed orders</li>
            <li>Update order status and delivery tracking</li>
            <li>Manage order fulfillment</li>
            <li>Coordinate with delivery teams</li>
            <li>Handle order modifications</li>
          </ul>
          <p><strong>Status:</strong> Coming in Phase 5</p>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
