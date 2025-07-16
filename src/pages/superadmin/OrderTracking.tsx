import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Quote } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import '../../components/layout/Dashboard.css';
import './OrderTracking.css';

interface OrderStatus {
  status: 'approved' | 'in-preparation' | 'ready' | 'delivered' | 'completed';
  label: string;
  color: string;
  description: string;
}

const orderStatuses: OrderStatus[] = [
  {
    status: 'approved',
    label: 'Order Confirmed',
    color: '#3b82f6',
    description: 'Order has been approved and payment confirmed'
  },
  {
    status: 'in-preparation',
    label: 'In Preparation',
    color: '#f59e0b',
    description: 'Food is being prepared by our chefs'
  },
  {
    status: 'ready',
    label: 'Ready for Delivery',
    color: '#8b5cf6',
    description: 'Order is ready and packed for delivery'
  },
  {
    status: 'delivered',
    label: 'Delivered',
    color: '#10b981',
    description: 'Order has been delivered to the venue'
  },
  {
    status: 'completed',
    label: 'Event Completed',
    color: '#059669',
    description: 'Event has been successfully completed'
  }
];

const OrderTracking: React.FC = () => {
  const { logout } = useAuth();
  const [orders, setOrders] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Quote | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let ordersQuery;
      if (filter === 'all') {
        ordersQuery = query(
          collection(db, 'quotes'),
          where('status', 'in', ['approved', 'in-preparation', 'ready', 'delivered', 'completed']),
          orderBy('eventDate', 'asc')
        );
      } else {
        ordersQuery = query(
          collection(db, 'quotes'),
          where('status', '==', filter),
          orderBy('eventDate', 'asc')
        );
      }
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersList: Quote[] = [];
      ordersSnapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Quote);
      });
      
      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedOrder) return;

    try {
      setUpdatingStatus(true);
      
      await updateDoc(doc(db, 'quotes', selectedOrder.id), {
        status: newStatus,
        updatedAt: new Date()
      });

      toast.success('Order status updated successfully');
      setShowStatusModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusInfo = (status: string): OrderStatus => {
    return orderStatuses.find(s => s.status === status) || orderStatuses[0];
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const currentIndex = orderStatuses.findIndex(s => s.status === currentStatus);
    return currentIndex < orderStatuses.length - 1 ? orderStatuses[currentIndex + 1].status : null;
  };

  const getPreviousStatus = (currentStatus: string): string | null => {
    const currentIndex = orderStatuses.findIndex(s => s.status === currentStatus);
    return currentIndex > 0 ? orderStatuses[currentIndex - 1].status : null;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time || 'Not specified';
  };

  const getDaysUntilEvent = (eventDate: Date) => {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past event';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Order Tracking</h1>
          <p>Monitor and update order status for active events</p>
        </div>
        <div className="dashboard-actions">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Orders</option>
            <option value="approved">Order Confirmed</option>
            <option value="in-preparation">In Preparation</option>
            <option value="ready">Ready for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
          </select>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="dashboard-content">
        {orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders found</h3>
            <p>No orders match the current filter criteria</p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const daysUntil = getDaysUntilEvent(order.eventDate);
              const nextStatus = getNextStatus(order.status);
              
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>#{order.quoteNumber}</h3>
                      <p className="customer-name">{order.customerName}</p>
                    </div>
                    <div className="order-timing">
                      <div className="event-date">{formatDate(order.eventDate)}</div>
                      <div className="days-until">{daysUntil}</div>
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="detail-row">
                      <span className="label">Event Type:</span>
                      <span className="value">{order.eventType}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Venue:</span>
                      <span className="value">{order.venue}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Guests:</span>
                      <span className="value">{order.guestCount} persons</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Time:</span>
                      <span className="value">{formatTime(order.eventTime)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Total:</span>
                      <span className="value total-amount">₹{order.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="status-section">
                    <div className="current-status">
                      <div 
                        className="status-indicator"
                        style={{ backgroundColor: statusInfo.color }}
                      ></div>
                      <div className="status-info">
                        <div className="status-label">{statusInfo.label}</div>
                        <div className="status-description">{statusInfo.description}</div>
                      </div>
                    </div>

                    <div className="status-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowStatusModal(true);
                        }}
                      >
                        Update Status
                      </Button>
                      {nextStatus && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStatusUpdate(nextStatus)}
                        >
                          Mark as {getStatusInfo(nextStatus).label}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-section">
                    <div className="progress-bar">
                      {orderStatuses.map((status, index) => {
                        const isCompleted = orderStatuses.findIndex(s => s.status === order.status) >= index;
                        return (
                          <div
                            key={status.status}
                            className={`progress-step ${isCompleted ? 'completed' : ''}`}
                            style={{ backgroundColor: isCompleted ? status.color : '#e5e7eb' }}
                          >
                            <div className="step-label">{status.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedOrder && (
          <div className="modal-overlay">
            <div className="modal-content status-modal">
              <div className="modal-header">
                <h2>Update Order Status</h2>
                <Button variant="outline" onClick={() => setShowStatusModal(false)}>×</Button>
              </div>

              <div className="modal-body">
                <div className="order-summary">
                  <h3>#{selectedOrder.quoteNumber} - {selectedOrder.customerName}</h3>
                  <p>Event Date: {formatDate(selectedOrder.eventDate)}</p>
                </div>

                <div className="status-options">
                  {orderStatuses.map((status) => {
                    const isCurrentStatus = status.status === selectedOrder.status;
                    return (
                      <div
                        key={status.status}
                        className={`status-option ${isCurrentStatus ? 'current' : ''}`}
                        onClick={() => !isCurrentStatus && handleStatusUpdate(status.status)}
                      >
                        <div 
                          className="status-color"
                          style={{ backgroundColor: status.color }}
                        ></div>
                        <div className="status-content">
                          <div className="status-name">{status.label}</div>
                          <div className="status-desc">{status.description}</div>
                        </div>
                        {isCurrentStatus && <div className="current-badge">Current</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-actions">
                <Button 
                  variant="outline" 
                  onClick={() => setShowStatusModal(false)}
                  disabled={updatingStatus}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
