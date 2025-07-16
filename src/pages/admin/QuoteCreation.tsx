import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { MenuItem, User, Quote, QuoteItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import './QuoteCreation.css';

interface QuoteFormData {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  guestCount: number;
  specialRequests: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

const QuoteCreation: React.FC = () => {
  const { currentUser } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [formData, setFormData] = useState<QuoteFormData>({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventType: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    guestCount: 50,
    specialRequests: '',
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
  });
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    companyName: ''
  });

  const eventTypes = [
    'Wedding',
    'Birthday Party',
    'Corporate Event',
    'Anniversary',
    'Religious Ceremony',
    'Conference',
    'Meeting',
    'Festival',
    'Other',
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.discount]);

  const fetchData = async () => {
    try {
      // Fetch menu items
      const menuQuery = query(collection(db, 'menuItems'), orderBy('category'), orderBy('name'));
      const menuSnapshot = await getDocs(menuQuery);
      const menuList: MenuItem[] = [];
      menuSnapshot.forEach((doc) => {
        menuList.push({ id: doc.id, ...doc.data() } as MenuItem);
      });

      // Fetch customers
      const customerQuery = query(collection(db, 'users'), where('role', '==', 'customer'));
      const customerSnapshot = await getDocs(customerQuery);
      const customerList: User[] = [];
      customerSnapshot.forEach((doc) => {
        customerList.push({ uid: doc.id, ...doc.data() } as User);
      });

      setMenuItems(menuList);
      setCustomers(customerList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.uid === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customerId: customer.uid,
        customerName: customer.displayName || '',
        customerEmail: customer.email,
        customerPhone: customer.phoneNumber || '',
      }));
    }
  };

  const addMenuItem = (menuItem: MenuItem) => {
    const existingItemIndex = formData.items.findIndex(item => item.menuItemId === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      
      setFormData(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Add new item
      const newItem: QuoteItem = {
        menuItemId: menuItem.id,
        name: menuItem.name,
        category: menuItem.category,
        unitPrice: menuItem.basePrice,
        quantity: 1,
        unit: menuItem.unit,
        total: menuItem.basePrice,
        specialInstructions: '',
      };
      
      setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    const updatedItems = [...formData.items];
    updatedItems[index].quantity = quantity;
    updatedItems[index].total = quantity * updatedItems[index].unitPrice;
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const updateItemPrice = (index: number, price: number) => {
    const updatedItems = [...formData.items];
    updatedItems[index].unitPrice = price;
    updatedItems[index].total = updatedItems[index].quantity * price;
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax - formData.discount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      total: Math.max(0, total),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showNewCustomerForm && !selectedCustomer) {
      toast.error('Please select a customer or create a new one');
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one menu item');
      return;
    }

    setSaving(true);
    
    try {
      const quoteData: Omit<Quote, 'id'> = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        eventType: formData.eventType,
        eventDate: new Date(formData.eventDate),
        eventTime: formData.eventTime,
        venue: formData.venue,
        guestCount: formData.guestCount,
        specialRequests: formData.specialRequests,
        items: formData.items,
        subtotal: formData.subtotal,
        tax: formData.tax,
        discount: formData.discount,
        total: formData.total,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.uid || '',
        quoteNumber: `QT${Date.now()}`,
      };

      await addDoc(collection(db, 'quotes'), quoteData);
      toast.success('Quote created successfully!');
      
      // Reset form
      setFormData({
        customerId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        eventType: '',
        eventDate: '',
        eventTime: '',
        venue: '',
        guestCount: 50,
        specialRequests: '',
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
      });
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote');
    } finally {
      setSaving(false);
    }
  };

  const handleNewCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    
    try {
      // Create new customer document
      const newCustomer: Omit<User, 'uid'> = {
          displayName: newCustomerData.displayName,
          email: newCustomerData.email,
          phoneNumber: newCustomerData.phoneNumber,
          role: 'customer',
          companyName: newCustomerData.companyName,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: false
      };

      const docRef = await addDoc(collection(db, 'users'), newCustomer);
      toast.success('Customer created successfully!');
      
      // Add customer to local state
      setCustomers(prev => [...prev, { uid: docRef.id, ...newCustomer } as User]);
      
      // Select the new customer
      handleCustomerSelect(docRef.id);
      
      // Reset new customer form
      setNewCustomerData({
        displayName: '',
        email: '',
        phoneNumber: '',
        companyName: ''
      });
      setShowNewCustomerForm(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  const createNewCustomer = async () => {
    if (!newCustomerData.displayName || !newCustomerData.email) {
      toast.error('Please fill in customer name and email');
      return;
    }

    try {
      const newCustomer: Omit<User, 'uid'> = {
        displayName: newCustomerData.displayName,
        email: newCustomerData.email,
        phoneNumber: newCustomerData.phoneNumber,
        role: 'customer',
        companyName: newCustomerData.companyName,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'users'), newCustomer);
      const createdCustomer = { uid: docRef.id, ...newCustomer };
      
      setCustomers(prev => [...prev, createdCustomer]);
      setSelectedCustomer(createdCustomer);
      setFormData(prev => ({
        ...prev,
        customerId: createdCustomer.uid,
        customerName: createdCustomer.displayName || '',
        customerEmail: createdCustomer.email,
        customerPhone: createdCustomer.phoneNumber || ''
      }));
      
      setShowNewCustomerForm(false);
      setNewCustomerData({
        displayName: '',
        email: '',
        phoneNumber: '',
        companyName: ''
      });
      
      toast.success('Customer created successfully!');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  };

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Create New Quote</h1>
          <p>Design a comprehensive catering quote for your customer</p>
        </div>
      </div>

      <div className="dashboard-content">
        <form onSubmit={handleSubmit} className="quote-form">
          {/* Customer Selection */}
          <Card variant="elevated">
            <CardHeader>
              <h2>Customer Information</h2>
            </CardHeader>
            <CardContent>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Customer*</label>
                  <div className="customer-select-wrapper">
                    <select
                      value={formData.customerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      required={!showNewCustomerForm}
                      className="form-select"
                    >
                      <option value="">Choose a customer...</option>
                      {customers.map(customer => (
                        <option key={customer.uid} value={customer.uid}>
                          {customer.displayName} ({customer.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {selectedCustomer && (
                <div className="customer-details">
                  <div className="customer-info">
                    <h3>Selected Customer Details</h3>
                    <div className="info-grid">
                      <div><strong>Name:</strong> {selectedCustomer.displayName}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email}</div>
                      <div><strong>Phone:</strong> {selectedCustomer.phoneNumber || 'Not provided'}</div>
                      <div><strong>Company:</strong> {selectedCustomer.companyName || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Customer Form */}
          {showNewCustomerForm && (
            <Card variant="elevated">
              <CardHeader>
                <h3>Create New Customer</h3>
              </CardHeader>
              <CardContent>
                <div className="form-row">
                  <div className="form-group">
                    <label>Customer Name*</label>
                    <input
                      type="text"
                      value={newCustomerData.displayName}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email*</label>
                    <input
                      type="email"
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
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
                      value={newCustomerData.phoneNumber}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={newCustomerData.companyName}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Enter company name (optional)"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewCustomerForm(false);
                    setNewCustomerData({ displayName: '', email: '', phoneNumber: '', companyName: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={createNewCustomer}
                >
                  Create Customer
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Event Details */}
          <Card variant="elevated">
            <CardHeader>
              <h2>Event Information</h2>
            </CardHeader>
            <CardContent>
              <div className="form-row">
                <div className="form-group">
                  <label>Event Type*</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
                    required
                    className="form-select"
                  >
                    <option value="">Select event type...</option>
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Event Date*</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Event Time</label>
                  <input
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Venue*</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                    placeholder="Event venue address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Guest Count*</label>
                  <input
                    type="number"
                    value={formData.guestCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, guestCount: Number(e.target.value) }))}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Special Requests</label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  rows={3}
                  placeholder="Any special dietary requirements, setup instructions, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Menu Selection */}
          <Card variant="elevated">
            <CardHeader>
              <h2>Menu Selection</h2>
            </CardHeader>
            <CardContent>
              <div className="menu-selection">
                <div className="menu-items-panel">
                  <h3>Available Menu Items</h3>
                  <div className="menu-categories">
                    {Object.entries(groupedMenuItems).map(([category, items]) => (
                      <div key={category} className="category-section">
                        <h4>{category}</h4>
                        <div className="menu-items-list">
                          {items.map(item => (
                            <div key={item.id} className="menu-item">
                              <div className="menu-item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">₹{item.basePrice} {item.unit}</span>
                              </div>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => addMenuItem(item)}
                              >
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="selected-items-panel">
                  <h3>Selected Items ({formData.items.length})</h3>
                  {formData.items.length === 0 ? (
                    <p className="empty-state">No items selected yet</p>
                  ) : (
                    <div className="selected-items">
                      {formData.items.map((item, index) => (
                        <div key={index} className="selected-item">
                          <div className="item-details">
                            <span className="item-name">{item.name}</span>
                            <span className="item-category">{item.category}</span>
                          </div>
                          <div className="item-controls">
                            <div className="quantity-control">
                              <label>Qty:</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                                min="1"
                              />
                            </div>
                            <div className="price-control">
                              <label>Price:</label>
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItemPrice(index, Number(e.target.value))}
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="total-display">
                              ₹{item.total.toFixed(2)}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Summary */}
          <Card variant="elevated">
            <CardHeader>
              <h2>Quote Summary</h2>
            </CardHeader>
            <CardContent>
              <div className="quote-totals">
                <div className="totals-row">
                  <span>Subtotal:</span>
                  <span>₹{formData.subtotal.toFixed(2)}</span>
                </div>
                <div className="totals-row">
                  <span>Tax (18% GST):</span>
                  <span>₹{formData.tax.toFixed(2)}</span>
                </div>
                <div className="totals-row">
                  <span>Discount:</span>
                  <div className="discount-input">
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="totals-row total">
                  <span>Total:</span>
                  <span>₹{formData.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Quote'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default QuoteCreation;
