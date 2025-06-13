import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import menuData from '../common/menuitems_original.json';
import './MenuCreation.css';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  notes?: string;
}

// Transform the menu data into our MenuItem structure
const transformedMenuItems: MenuItem[] = Object.entries(menuData).flatMap(([category, items]) => 
  (items as string[]).map((name, index) => ({
    id: `${category}-${index}`,
    name,
    category,
    price: 0,
    quantity: 0,
    notes: ''
  }))
);

// Get unique categories from menuItems
const categories = Object.keys(menuData);

const MenuCreation: React.FC = () => {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);
  const [customItem, setCustomItem] = useState({ name: '', price: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Filter items based on search query across all categories
  const filteredItems = transformedMenuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Get categories that have matching items
  const matchingCategories = Object.keys(groupedItems);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleAddItem = (item: MenuItem) => {
    const existingItem = selectedItems.find(i => i.id === item.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1, notes: '' }]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      handleRemoveItem(itemId);
    } else {
      setSelectedItems(selectedItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const handleAddCustomItem = () => {
    if (customItem.name && customItem.price) {
      const newItem: MenuItem = {
        id: `custom-${Date.now()}`,
        name: customItem.name,
        category: categories[0],
        price: parseFloat(customItem.price),
        quantity: 1,
        notes: ''
      };
      setSelectedItems([...selectedItems, newItem]);
      setCustomItem({ name: '', price: '' });
      setShowCustomItemForm(false);
    }
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setSelectedItems(selectedItems.map(item =>
      item.id === itemId ? { ...item, notes } : item
    ));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleNext = () => {
    localStorage.setItem('selectedMenu', JSON.stringify(selectedItems));
    navigate('/summary');
  };

  const handlePriceEdit = (itemId: string, currentPrice: number) => {
    setEditingPriceId(itemId);
    setTempPrice(currentPrice.toString());
  };

  const handlePriceSave = (itemId: string) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      setSelectedItems(selectedItems.map(item =>
        item.id === itemId ? { ...item, price: newPrice } : item
      ));
    }
    setEditingPriceId(null);
  };

  const handlePriceCancel = () => {
    setEditingPriceId(null);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setTempPrice(value);
    }
  };

  return (
    <div className="menu-creation">
      <h2>Create Your Menu</h2>
      <div className="menu-layout">
        <div className="categories-panel">
          <h3>Menu Items</h3>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search all items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="accordion-container">
            {matchingCategories.map(category => (
              <div key={category} className="accordion-section">
                <div 
                  className="accordion-header"
                  onClick={() => toggleCategory(category)}
                >
                  <h4>{category}</h4>
                  <span className="accordion-icon">
                    {expandedCategories.has(category) ? '▼' : '▶'}
                  </span>
                </div>
                {expandedCategories.has(category) && (
                  <div className="accordion-content">
                    {groupedItems[category]?.map((item) => (
                      <div key={item.id} className="menu-item-card">
                        <h4>{item.name}</h4>
                        <span className="price">₹{item.price}</span>
                        <button 
                          className="add-button"
                          onClick={() => handleAddItem(item)}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {searchQuery && matchingCategories.length === 0 && (
              <div className="no-results">
                No items found matching "{searchQuery}"
              </div>
            )}
          </div>

          <div className="custom-item-section">
            <button 
              className="toggle-custom-item"
              onClick={() => setShowCustomItemForm(!showCustomItemForm)}
            >
              {showCustomItemForm ? 'Cancel' : 'Add Custom Item'}
            </button>
            
            {showCustomItemForm && (
              <div className="custom-item-form">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={customItem.name}
                  onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={customItem.price}
                  onChange={(e) => setCustomItem({ ...customItem, price: e.target.value })}
                />
                <button onClick={handleAddCustomItem}>Add Item</button>
              </div>
            )}
          </div>
        </div>

        <div className="selected-items-panel">
          <h3>Selected Items</h3>
          <div className="selected-items-list">
            {selectedItems.map((item) => (
              <div key={item.id} className="selected-item-card">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <span className="category-tag">{item.category}</span>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</button>
                </div>
                <div className="notes-section">
                  <textarea
                    placeholder="Add notes..."
                    value={item.notes || ''}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    className="notes-input"
                  />
                </div>
                <div className="price-info">
                  {editingPriceId === item.id ? (
                    <div className="price-edit-container">
                      <input
                        type="text"
                        value={tempPrice}
                        onChange={handlePriceChange}
                        className="price-edit-input"
                        autoFocus
                      />
                      <div className="price-edit-buttons">
                        <button 
                          className="save-button"
                          onClick={() => handlePriceSave(item.id)}
                        >
                          ✓
                        </button>
                        <button 
                          className="cancel-button"
                          onClick={handlePriceCancel}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="price-display" onClick={() => handlePriceEdit(item.id, item.price)}>
                      <span>₹{item.price * item.quantity}</span>
                      <span className="edit-hint">(click to edit)</span>
                    </div>
                  )}
                  <button 
                    className="remove-button"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="total-section">
            <h4>Total: ₹{calculateTotal()}</h4>
            <button className="next-button" onClick={handleNext}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCreation; 