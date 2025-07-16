import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy, where, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { User, Quote } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import '../../components/layout/Dashboard.css';
import './CustomerManagement.css';

interface CustomerStats {
  totalQuotes: number;
  approvedQuotes: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
}

const CustomerManagement: React.FC = () => {
  const { logout } = useAuth();
  const [customers, setCustomers] = useState<User[]>([]);
  const [customerStats, setCustomerStats] = useState<Record<string, CustomerStats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'totalSpent' | 'joinDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    isActive: true
  });
  const [createForm, setCreateForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    password: '',
    confirmPassword: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCustomersAndStats();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchCustomersAndStats = async () => {
    try {
      setLoading(true);
      
      // Fetch customers
      const customersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'customer'),
        orderBy('createdAt', 'desc')
      );
      
      const customersSnapshot = await getDocs(customersQuery);
      const customersList: User[] = [];
      customersSnapshot.forEach((doc) => {
        customersList.push({ uid: doc.id, ...doc.data() } as User);
      });
      
      // Fetch all quotes to calculate customer stats
      const quotesSnapshot = await getDocs(collection(db, 'quotes'));
      const quotes: Quote[] = [];
      quotesSnapshot.forEach((doc) => {
        quotes.push({ id: doc.id, ...doc.data() } as Quote);
      });
      
      // Calculate stats for each customer
      const stats: Record<string, CustomerStats> = {};
      customersList.forEach(customer => {
        const customerQuotes = quotes.filter(q => q.customerId === customer.uid);
        const approvedQuotes = customerQuotes.filter(q => q.status === 'approved');
        const totalSpent = approvedQuotes.reduce((sum, q) => sum + q.total, 0);
        const lastOrder = customerQuotes.length > 0 
          ? customerQuotes.sort((a, b) => {
              const getDate = (date: any) => {
                if (date && typeof date.toDate === 'function') return date.toDate();
                if (date instanceof Date) return date;
                return new Date(date);
              };
              return getDate(b.createdAt).getTime() - getDate(a.createdAt).getTime();
            })[0]
          : null;
        
        stats[customer.uid] = {
          totalQuotes: customerQuotes.length,
          approvedQuotes: approvedQuotes.length,
          totalSpent,
          averageOrderValue: approvedQuotes.length > 0 ? totalSpent / approvedQuotes.length : 0,
          lastOrderDate: lastOrder ? (() => {
            const date = lastOrder.createdAt;
            if (date && typeof (date as any).toDate === 'function') {
              return (date as any).toDate();
            }
            if (date instanceof Date) {
              return date;
            }
            return new Date(date);
          })() : null
        };
      });
      
      setCustomers(customersList);
      setCustomerStats(stats);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer: User) => {
    setSelectedCustomer(customer);
    setEditForm({
      displayName: customer.displayName || '',
      email: customer.email,
      phoneNumber: customer.phoneNumber || '',
      companyName: customer.companyName || '',
      isActive: customer.isActive
    });
    setShowEditModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      await updateDoc(doc(db, 'users', selectedCustomer.uid), {
        displayName: editForm.displayName,
        phoneNumber: editForm.phoneNumber,
        companyName: editForm.companyName,
        isActive: editForm.isActive,
        updatedAt: new Date()
      });

      toast.success('Customer updated successfully');
      setShowEditModal(false);
      fetchCustomersAndStats();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', customerId), {
        isActive: false,
        updatedAt: new Date()
      });
      
      toast.success('Customer deactivated successfully');
      fetchCustomersAndStats();
    } catch (error) {
      console.error('Error deactivating customer:', error);
      toast.error('Failed to deactivate customer');
    }
  };

  const handleCreateCustomer = async () => {
    // Validation
    if (!createForm.displayName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    
    if (!createForm.email.trim()) {
      toast.error('Please enter email address');
      return;
    }
    
    if (!createForm.password) {
      toast.error('Please enter password');
      return;
    }
    
    if (createForm.password !== createForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setCreating(true);
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        createForm.email,
        createForm.password
      );
      
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: createForm.email,
        displayName: createForm.displayName,
        phoneNumber: createForm.phoneNumber || '',
        companyName: createForm.companyName || '',
        role: 'customer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Send password reset email so user can set their own password
      try {
        await sendPasswordResetEmail(auth, createForm.email);
        toast.success('Customer created successfully! Password reset email sent to customer.');
      } catch (emailError) {
        console.warn('Could not send password reset email:', emailError);
        toast.success('Customer created successfully!');
      }
      
      // Reset form and close modal
      setCreateForm({
        displayName: '',
        email: '',
        phoneNumber: '',
        companyName: '',
        password: '',
        confirmPassword: ''
      });
      setShowCreateModal(false);
      
      // Refresh the customer list
      fetchCustomersAndStats();
      
    } catch (error: any) {
      console.error('Error creating customer:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email address is already registered');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error('Failed to create customer. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const filteredAndSortedCustomers = customers
    .filter(customer => {
      if (searchTerm) {
        return (
          customer.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.displayName || '').localeCompare(b.displayName || '');
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'totalSpent':
          comparison = (customerStats[a.uid]?.totalSpent || 0) - (customerStats[b.uid]?.totalSpent || 0);
          break;
        case 'joinDate':
          const getDate = (date: any) => {
            if (date && typeof date.toDate === 'function') return date.toDate().getTime();
            if (date instanceof Date) return date.getTime();
            return new Date(date).getTime();
          };
          comparison = getDate(a.createdAt) - getDate(b.createdAt);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Never';
    
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    if (date instanceof Date) {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Customer Management</h1>
          <p>Manage customer accounts and relationships</p>
        </div>
        <div className="dashboard-actions">
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
          >
            + Add Customer
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Customer Stats */}
        <div className="customer-stats">
          <div className="stat-card">
            <div className="stat-value">{customers.length}</div>
            <div className="stat-label">Total Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{customers.filter(c => c.isActive).length}</div>
            <div className="stat-label">Active Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {formatCurrency(Object.values(customerStats).reduce((sum, stats) => sum + stats.totalSpent, 0))}
            </div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {Object.values(customerStats).reduce((sum, stats) => sum + stats.totalQuotes, 0)}
            </div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="customer-controls">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search customers by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-section">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="totalSpent">Sort by Total Spent</option>
              <option value="joinDate">Sort by Join Date</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="sort-order-btn"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="customers-table-container">
          {filteredAndSortedCustomers.length === 0 ? (
            <div className="empty-state">
              <h3>No customers found</h3>
              <p>No customers match your current search criteria</p>
            </div>
          ) : (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Last Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCustomers.map((customer) => {
                  const stats = customerStats[customer.uid] || {
                    totalQuotes: 0,
                    approvedQuotes: 0,
                    totalSpent: 0,
                    averageOrderValue: 0,
                    lastOrderDate: null
                  };
                  
                  return (
                    <tr key={customer.uid} className={!customer.isActive ? 'inactive' : ''}>
                      <td className="customer-info">
                        <div className="customer-name">{customer.displayName || 'N/A'}</div>
                        <div className="customer-email">{customer.email}</div>
                      </td>
                      <td>{customer.phoneNumber || 'N/A'}</td>
                      <td>{customer.companyName || 'Individual'}</td>
                      <td className="text-center">{stats.totalQuotes}</td>
                      <td className="amount">{formatCurrency(stats.totalSpent)}</td>
                      <td>{formatDate(stats.lastOrderDate)}</td>
                      <td>
                        <span className={`status-badge ${customer.isActive ? 'active' : 'inactive'}`}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="actions">
                        <div className="action-buttons">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowDetailsModal(true);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            Edit
                          </Button>
                          {customer.isActive && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.uid)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Customer Details Modal */}
        {showDetailsModal && selectedCustomer && (
          <div className="modal-overlay">
            <div className="modal-content customer-details-modal">
              <div className="modal-header">
                <h2>Customer Details - {selectedCustomer.displayName}</h2>
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>×</Button>
              </div>

              <div className="modal-body">
                <div className="customer-summary">
                  <div className="summary-section">
                    <h3>Contact Information</h3>
                    <div className="info-grid">
                      <div><strong>Name:</strong> {selectedCustomer.displayName || 'N/A'}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email}</div>
                      <div><strong>Phone:</strong> {selectedCustomer.phoneNumber || 'N/A'}</div>
                      <div><strong>Company:</strong> {selectedCustomer.companyName || 'Individual'}</div>
                      <div><strong>Status:</strong> {selectedCustomer.isActive ? 'Active' : 'Inactive'}</div>
                      <div><strong>Joined:</strong> {formatDate(selectedCustomer.createdAt)}</div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h3>Order Statistics</h3>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <div className="stat-number">{customerStats[selectedCustomer.uid]?.totalQuotes || 0}</div>
                        <div className="stat-label">Total Orders</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-number">{customerStats[selectedCustomer.uid]?.approvedQuotes || 0}</div>
                        <div className="stat-label">Completed Orders</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-number">{formatCurrency(customerStats[selectedCustomer.uid]?.totalSpent || 0)}</div>
                        <div className="stat-label">Total Spent</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-number">{formatCurrency(customerStats[selectedCustomer.uid]?.averageOrderValue || 0)}</div>
                        <div className="stat-label">Average Order</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditCustomer(selectedCustomer);
                  }}
                >
                  Edit Customer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditModal && selectedCustomer && (
          <div className="modal-overlay">
            <div className="modal-content edit-customer-modal">
              <div className="modal-header">
                <h2>Edit Customer - {selectedCustomer.displayName}</h2>
                <Button variant="outline" onClick={() => setShowEditModal(false)}>×</Button>
              </div>

              <div className="modal-body">
                <form className="edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editForm.displayName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email (Read-only)</label>
                      <input
                        type="email"
                        value={editForm.email}
                        disabled
                        className="readonly"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Company Name</label>
                      <input
                        type="text"
                        value={editForm.companyName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      Active Customer
                    </label>
                  </div>
                </form>
              </div>

              <div className="modal-actions">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveCustomer}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Customer Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content create-customer-modal">
              <div className="modal-header">
                <h2>Create New Customer</h2>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>×</Button>
              </div>

              <div className="modal-body">
                <form className="create-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={createForm.displayName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Enter customer's full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={createForm.phoneNumber}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Company Name</label>
                      <input
                        type="text"
                        value={createForm.companyName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Enter company name (optional)"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Temporary Password *</label>
                      <input
                        type="password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter temporary password (min 6 characters)"
                        required
                      />
                      <small className="form-help">Customer will receive a password reset email to set their own password</small>
                    </div>
                    <div className="form-group">
                      <label>Confirm Password *</label>
                      <input
                        type="password"
                        value={createForm.confirmPassword}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm temporary password"
                        required
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="modal-actions">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateCustomer}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Customer'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;
