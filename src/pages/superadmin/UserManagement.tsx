import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy, where, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import '../../components/layout/Dashboard.css';
import './UserManagement.css';

interface UserStats {
  totalAdmins: number;
  activeAdmins: number;
  totalCustomers: number;
  activeCustomers: number;
}

const UserManagement: React.FC = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalAdmins: 0,
    activeAdmins: 0,
    totalCustomers: 0,
    activeCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'joinDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    role: 'admin' as 'admin' | 'customer',
    isActive: true
  });
  const [createForm, setCreateForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    role: 'admin' as 'admin' | 'customer',
    password: '',
    confirmPassword: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const usersList: User[] = [];
      usersSnapshot.forEach((doc) => {
        usersList.push({ uid: doc.id, ...doc.data() } as User);
      });
      
      // Calculate stats
      const userStats: UserStats = {
        totalAdmins: usersList.filter(u => u.role === 'admin').length,
        activeAdmins: usersList.filter(u => u.role === 'admin' && u.isActive).length,
        totalCustomers: usersList.filter(u => u.role === 'customer').length,
        activeCustomers: usersList.filter(u => u.role === 'customer' && u.isActive).length
      };
      
      setUsers(usersList);
      setStats(userStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      displayName: user.displayName || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      companyName: user.companyName || '',
      role: user.role as 'admin' | 'customer',
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        displayName: editForm.displayName,
        phoneNumber: editForm.phoneNumber,
        companyName: editForm.companyName,
        role: editForm.role,
        isActive: editForm.isActive,
        updatedAt: new Date()
      });

      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleCreateUser = async () => {
    // Validation
    if (!createForm.displayName.trim()) {
      toast.error('Please enter user name');
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
        role: createForm.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Send password reset email for admin users
      if (createForm.role === 'admin') {
        try {
          await sendPasswordResetEmail(auth, createForm.email);
          toast.success('User created successfully! Password reset email sent.');
        } catch (emailError) {
          console.warn('Could not send password reset email:', emailError);
          toast.success('User created successfully!');
        }
      } else {
        toast.success('User created successfully!');
      }
      
      // Reset form and close modal
      setCreateForm({
        displayName: '',
        email: '',
        phoneNumber: '',
        companyName: '',
        role: 'admin',
        password: '',
        confirmPassword: ''
      });
      setShowCreateModal(false);
      
      // Refresh the user list
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email address is already registered');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error('Failed to create user. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const filteredAndSortedUsers = users
    .filter(user => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!(
          user.displayName?.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.companyName?.toLowerCase().includes(searchLower)
        )) {
          return false;
        }
      }
      
      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }
      
      // Status filter
      if (statusFilter === 'active' && !user.isActive) {
        return false;
      }
      if (statusFilter === 'inactive' && user.isActive) {
        return false;
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
        case 'role':
          comparison = a.role.localeCompare(b.role);
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

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    
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
          <h1>User Management</h1>
          <p>Manage admin users and customer accounts</p>
        </div>
        <div className="dashboard-actions">
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
          >
            + Add User
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* User Stats */}
        <div className="user-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.totalAdmins}</div>
            <div className="stat-label">Total Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.activeAdmins}</div>
            <div className="stat-label">Active Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalCustomers}</div>
            <div className="stat-label">Total Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.activeCustomers}</div>
            <div className="stat-label">Active Customers</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="user-controls">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search users by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-section">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin Only</option>
              <option value="customer">Customer Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="role">Sort by Role</option>
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

        {/* Users Table */}
        <div className="users-table-container">
          {filteredAndSortedUsers.length === 0 ? (
            <div className="empty-state">
              <h3>No users found</h3>
              <p>No users match your current search criteria</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.uid} className={!user.isActive ? 'inactive' : ''}>
                    <td className="user-info">
                      <div className="user-name">{user.displayName || 'N/A'}</div>
                      <div className="user-email">{user.email}</div>
                    </td>
                    <td>{user.phoneNumber || 'N/A'}</td>
                    <td>{user.companyName || 'N/A'}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions">
                      <div className="action-buttons">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={user.isActive ? "danger" : "primary"}
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.uid, user.isActive)}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* User Details Modal */}
        {showDetailsModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content user-details-modal">
              <div className="modal-header">
                <h2>User Details - {selectedUser.displayName}</h2>
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>×</Button>
              </div>

              <div className="modal-body">
                <div className="user-summary">
                  <div className="summary-section">
                    <h3>Account Information</h3>
                    <div className="info-grid">
                      <div><strong>Name:</strong> {selectedUser.displayName || 'N/A'}</div>
                      <div><strong>Email:</strong> {selectedUser.email}</div>
                      <div><strong>Phone:</strong> {selectedUser.phoneNumber || 'N/A'}</div>
                      <div><strong>Company:</strong> {selectedUser.companyName || 'N/A'}</div>
                      <div><strong>Role:</strong> {selectedUser.role === 'admin' ? 'Admin' : 'Customer'}</div>
                      <div><strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}</div>
                      <div><strong>Joined:</strong> {formatDate(selectedUser.createdAt)}</div>
                      <div><strong>Last Updated:</strong> {formatDate(selectedUser.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditUser(selectedUser);
                  }}
                >
                  Edit User
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

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content edit-user-modal">
              <div className="modal-header">
                <h2>Edit User - {selectedUser.displayName}</h2>
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
                  <div className="form-row">
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'customer' }))}
                      >
                        <option value="admin">Admin</option>
                        <option value="customer">Customer</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editForm.isActive}
                          onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        />
                        Active User
                      </label>
                    </div>
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
                  onClick={handleSaveUser}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content create-user-modal">
              <div className="modal-header">
                <h2>Create New User</h2>
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
                        placeholder="Enter user's full name"
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
                      <label>Role *</label>
                      <select
                        value={createForm.role}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'customer' }))}
                        required
                      >
                        <option value="admin">Admin</option>
                        <option value="customer">Customer</option>
                      </select>
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
                      <small className="form-help">
                        {createForm.role === 'admin' 
                          ? 'Admin users will receive a password reset email to set their own password'
                          : 'Customer password for initial access'
                        }
                      </small>
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
                  onClick={handleCreateUser}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
