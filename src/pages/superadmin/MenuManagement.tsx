import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { MenuItem } from '../../types';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import './MenuManagement.css';

interface MenuFormData {
  name: string;
  category: string;
  description: string;
  basePrice: number;
  unit: string;
  isVegetarian: boolean;
  isVegan: boolean;
  allergens: string[];
  preparationTime: number;
  isAvailable: boolean;
}

const MenuManagement: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    category: '',
    description: '',
    basePrice: 0,
    unit: 'per person',
    isVegetarian: false,
    isVegan: false,
    allergens: [],
    preparationTime: 30,
    isAvailable: true,
  });

  const categories = [
    'Appetizers',
    'Main Course',
    'Desserts',
    'Beverages',
    'Salads',
    'Soups',
    'Snacks',
    'Traditional',
    'Continental',
    'Chinese',
    'South Indian',
    'North Indian',
  ];

  const commonAllergens = [
    'Nuts',
    'Dairy',
    'Gluten',
    'Soy',
    'Eggs',
    'Shellfish',
    'Fish',
    'Sesame',
  ];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const q = query(collection(db, 'menuItems'), orderBy('category'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const items: MenuItem[] = [];
      
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      
      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const menuItemData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingItem) {
        // Update existing item
        await updateDoc(doc(db, 'menuItems', editingItem.id), {
          ...menuItemData,
          updatedAt: new Date(),
        });
        toast.success('Menu item updated successfully');
      } else {
        // Create new item
        await addDoc(collection(db, 'menuItems'), menuItemData);
        toast.success('Menu item created successfully');
      }

      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    console.log('Edit clicked for item:', item.name);
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      basePrice: item.basePrice,
      unit: item.unit,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      allergens: item.allergens,
      preparationTime: item.preparationTime,
      isAvailable: item.isAvailable,
    });
    setIsFormOpen(true);
    console.log('Form should be open:', true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteDoc(doc(db, 'menuItems', id));
        toast.success('Menu item deleted successfully');
        fetchMenuItems();
      } catch (error) {
        console.error('Error deleting menu item:', error);
        toast.error('Failed to delete menu item');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      basePrice: 0,
      unit: 'per person',
      isVegetarian: false,
      isVegan: false,
      allergens: [],
      preparationTime: 30,
      isAvailable: true,
    });
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const handleAllergenToggle = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="menu-management">
      <div className="menu-header">
        <h1>Menu Management</h1>
        <Button 
          variant="primary" 
          onClick={() => setIsFormOpen(true)}
        >
          Add New Item
        </Button>
      </div>

      {/* Menu Items Display */}
      <div className="menu-categories">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            <div className="menu-items-grid">
              {items.map((item) => (
                <div key={item.id} className="menu-item-card">
                  <div className="menu-item-header">
                    <h3>{item.name}</h3>
                    <div className="item-actions">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p className="menu-item-description">{item.description}</p>
                  <div className="menu-item-details">
                    <span className="price">₹{item.basePrice} {item.unit}</span>
                    <span className="prep-time">{item.preparationTime} min</span>
                  </div>
                  <div className="menu-item-tags">
                    {item.isVegetarian && <span className="tag veg">Veg</span>}
                    {item.isVegan && <span className="tag vegan">Vegan</span>}
                    {!item.isAvailable && <span className="tag unavailable">Unavailable</span>}
                  </div>
                  {item.allergens.length > 0 && (
                    <div className="allergens">
                      <small>Contains: {item.allergens.join(', ')}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="menu-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name*</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category*</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description*</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Base Price (₹)*</label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    <option value="per person">Per Person</option>
                    <option value="per kg">Per Kg</option>
                    <option value="per piece">Per Piece</option>
                    <option value="per plate">Per Plate</option>
                    <option value="per liter">Per Liter</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Prep Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: Number(e.target.value) }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Dietary Options</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isVegetarian}
                      onChange={(e) => setFormData(prev => ({ ...prev, isVegetarian: e.target.checked }))}
                    />
                    Vegetarian
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isVegan}
                      onChange={(e) => setFormData(prev => ({ ...prev, isVegan: e.target.checked }))}
                    />
                    Vegan
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    />
                    Available
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Allergens</label>
                <div className="allergen-tags">
                  {commonAllergens.map(allergen => (
                    <button
                      key={allergen}
                      type="button"
                      className={`allergen-tag ${formData.allergens.includes(allergen) ? 'selected' : ''}`}
                      onClick={() => handleAllergenToggle(allergen)}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingItem ? 'Update Item' : 'Create Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
