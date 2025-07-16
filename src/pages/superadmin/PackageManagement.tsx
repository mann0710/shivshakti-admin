import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PackageTemplate, MenuItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import '../../components/layout/Dashboard.css';
import './PackageManagement.css';

const PackageManagement: React.FC = () => {
  const { logout } = useAuth();
  const [packages, setPackages] = useState<PackageTemplate[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    guestCount: '',
    category: '',
    selectedItems: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch packages
      const packagesSnapshot = await getDocs(collection(db, 'packages'));
      const packagesList: PackageTemplate[] = [];
      packagesSnapshot.forEach((doc) => {
        packagesList.push({ id: doc.id, ...doc.data() } as PackageTemplate);
      });
      
      // Fetch menu items
      const menuSnapshot = await getDocs(collection(db, 'menuItems'));
      const menuList: MenuItem[] = [];
      menuSnapshot.forEach((doc) => {
        menuList.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      
      setPackages(packagesList);
      setMenuItems(menuList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.guestCount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const packageData = {
        name: formData.name,
        description: formData.description,
        basePrice: parseFloat(formData.price),
        guestCount: parseInt(formData.guestCount),
        category: formData.category,
        menuItems: formData.selectedItems,
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingPackage) {
        await updateDoc(doc(db, 'packages', editingPackage.id), {
          ...packageData,
          updatedAt: new Date(),
        });
        toast.success('Package updated successfully!');
      } else {
        await addDoc(collection(db, 'packages'), packageData);
        toast.success('Package created successfully!');
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Failed to save package');
    }
  };

  const handleEdit = (pkg: PackageTemplate) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.basePrice.toString(),
      guestCount: pkg.guestCount.toString(),
      category: pkg.category || '',
      selectedItems: pkg.menuItems || [],
      isActive: pkg.isActive,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (packageId: string) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;

    try {
      await deleteDoc(doc(db, 'packages', packageId));
      toast.success('Package deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      guestCount: '',
      category: '',
      selectedItems: [],
      isActive: true,
    });
    setEditingPackage(null);
    setShowCreateModal(false);
  };

  const toggleMenuItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(itemId)
        ? prev.selectedItems.filter(id => id !== itemId)
        : [...prev.selectedItems, itemId]
    }));
  };

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Package Management</h1>
          <p>Create and manage catering packages for different events</p>
        </div>
        <div className="dashboard-actions">
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Package
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="packages-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`package-card ${!pkg.isActive ? 'inactive' : ''}`}>
              <div className="package-header">
                <h3>{pkg.name}</h3>
                <div className="package-status">
                  <span className={`status-badge ${pkg.isActive ? 'active' : 'inactive'}`}>
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="package-details">
                <p className="package-description">{pkg.description}</p>
                <div className="package-info">
                  <div className="info-item">
                    <span className="label">Price:</span>
                    <span className="value">₹{pkg.basePrice.toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Guest Count:</span>
                    <span className="value">{pkg.guestCount} persons</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Category:</span>
                    <span className="value">{pkg.category || 'General'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Items:</span>
                    <span className="value">{pkg.menuItems?.length || 0} items</span>
                  </div>
                </div>
              </div>

              <div className="package-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(pkg)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(pkg.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          
          {packages.length === 0 && (
            <div className="empty-state">
              <h3>No packages created yet</h3>
              <p>Create your first catering package to get started</p>
            </div>
          )}
        </div>

        {/* Create/Edit Package Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content package-modal">
              <div className="modal-header">
                <h2>{editingPackage ? 'Edit Package' : 'Create New Package'}</h2>
                <Button variant="outline" onClick={resetForm}>×</Button>
              </div>

              <form onSubmit={handleSubmit} className="package-form">
                <div className="form-group">
                  <label>Package Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter package name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter package description"
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Base Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Guest Count *</label>
                    <input
                      type="number"
                      value={formData.guestCount}
                      onChange={(e) => setFormData({...formData, guestCount: e.target.value})}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="">Select category</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Festival">Festival</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Menu Items</label>
                  <div className="menu-items-selection">
                    {Object.entries(groupedMenuItems).map(([category, items]) => (
                      <div key={category} className="menu-category">
                        <h4>{category}</h4>
                        <div className="menu-items-grid">
                          {items.map(item => (
                            <div
                              key={item.id}
                              className={`menu-item-card ${formData.selectedItems.includes(item.id) ? 'selected' : ''}`}
                              onClick={() => toggleMenuItem(item.id)}
                            >
                              <span className="item-name">{item.name}</span>
                              <span className="item-price">₹{item.basePrice}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    Active Package
                  </label>
                </div>

                <div className="modal-actions">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageManagement;
