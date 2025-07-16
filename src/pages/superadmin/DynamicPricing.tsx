import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import '../../components/layout/Dashboard.css';
import './DynamicPricing.css';

interface PricingRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'guest_count' | 'event_type' | 'seasonal' | 'bulk' | 'day_of_week';
  condition: {
    operator: 'greater_than' | 'less_than' | 'equal_to' | 'between' | 'in';
    value: string | number;
    secondaryValue?: string | number;
  };
  adjustment: {
    type: 'percentage' | 'fixed_amount';
    value: number;
    operation: 'add' | 'subtract' | 'multiply';
  };
  isActive: boolean;
  priority: number;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PricingTemplate {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  rules: string[]; // IDs of pricing rules
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DynamicPricing: React.FC = () => {
  const { logout } = useAuth();
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'simulator'>('rules');
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PricingTemplate | null>(null);
  
  // Form states
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    ruleType: 'guest_count' as PricingRule['ruleType'],
    operator: 'greater_than' as PricingRule['condition']['operator'],
    value: '',
    secondaryValue: '',
    adjustmentType: 'percentage' as PricingRule['adjustment']['type'],
    adjustmentValue: 0,
    operation: 'add' as PricingRule['adjustment']['operation'],
    priority: 1,
    validFrom: '',
    validTo: ''
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    basePrice: 0,
    selectedRules: [] as string[]
  });

  // Simulator state
  const [simulator, setSimulator] = useState({
    guestCount: 50,
    eventType: 'Wedding',
    eventDate: '',
    dayOfWeek: 'Saturday',
    basePrice: 1000,
    calculatedPrice: 1000,
    appliedRules: [] as PricingRule[]
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
      
      // Fetch pricing rules
      const rulesQuery = query(collection(db, 'pricingRules'), orderBy('priority'), orderBy('createdAt', 'desc'));
      const rulesSnapshot = await getDocs(rulesQuery);
      const rulesList: PricingRule[] = [];
      rulesSnapshot.forEach((doc) => {
        rulesList.push({ id: doc.id, ...doc.data() } as PricingRule);
      });

      // Fetch pricing templates
      const templatesQuery = query(collection(db, 'pricingTemplates'), orderBy('createdAt', 'desc'));
      const templatesSnapshot = await getDocs(templatesQuery);
      const templatesList: PricingTemplate[] = [];
      templatesSnapshot.forEach((doc) => {
        templatesList.push({ id: doc.id, ...doc.data() } as PricingTemplate);
      });
      
      setPricingRules(rulesList);
      setPricingTemplates(templatesList);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!ruleForm.name.trim()) {
      toast.error('Please enter rule name');
      return;
    }

    try {
      const newRule: Omit<PricingRule, 'id'> = {
        name: ruleForm.name,
        description: ruleForm.description,
        ruleType: ruleForm.ruleType,
        condition: {
          operator: ruleForm.operator,
          value: ruleForm.ruleType === 'guest_count' ? Number(ruleForm.value) : ruleForm.value,
          secondaryValue: ruleForm.secondaryValue ? Number(ruleForm.secondaryValue) : undefined
        },
        adjustment: {
          type: ruleForm.adjustmentType,
          value: ruleForm.adjustmentValue,
          operation: ruleForm.operation
        },
        isActive: true,
        priority: ruleForm.priority,
        validFrom: ruleForm.validFrom ? new Date(ruleForm.validFrom) : undefined,
        validTo: ruleForm.validTo ? new Date(ruleForm.validTo) : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'pricingRules'), newRule);
      toast.success('Pricing rule created successfully');
      setShowCreateRuleModal(false);
      resetRuleForm();
      fetchData();
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      toast.error('Failed to create pricing rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!selectedRule) return;

    try {
      await updateDoc(doc(db, 'pricingRules', selectedRule.id), {
        name: ruleForm.name,
        description: ruleForm.description,
        ruleType: ruleForm.ruleType,
        condition: {
          operator: ruleForm.operator,
          value: ruleForm.ruleType === 'guest_count' ? Number(ruleForm.value) : ruleForm.value,
          secondaryValue: ruleForm.secondaryValue ? Number(ruleForm.secondaryValue) : undefined
        },
        adjustment: {
          type: ruleForm.adjustmentType,
          value: ruleForm.adjustmentValue,
          operation: ruleForm.operation
        },
        priority: ruleForm.priority,
        validFrom: ruleForm.validFrom ? new Date(ruleForm.validFrom) : undefined,
        validTo: ruleForm.validTo ? new Date(ruleForm.validTo) : undefined,
        updatedAt: new Date()
      });

      toast.success('Pricing rule updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      toast.error('Failed to update pricing rule');
    }
  };

  const handleToggleRule = async (ruleId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'pricingRules', ruleId), {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      
      toast.success(`Rule ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to update rule status');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this pricing rule?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'pricingRules', ruleId));
      toast.success('Pricing rule deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      toast.error('Failed to delete pricing rule');
    }
  };

  const handleEditRule = (rule: PricingRule) => {
    setSelectedRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      operator: rule.condition.operator,
      value: rule.condition.value.toString(),
      secondaryValue: rule.condition.secondaryValue?.toString() || '',
      adjustmentType: rule.adjustment.type,
      adjustmentValue: rule.adjustment.value,
      operation: rule.adjustment.operation,
      priority: rule.priority,
      validFrom: rule.validFrom ? new Date(rule.validFrom).toISOString().split('T')[0] : '',
      validTo: rule.validTo ? new Date(rule.validTo).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      description: '',
      ruleType: 'guest_count',
      operator: 'greater_than',
      value: '',
      secondaryValue: '',
      adjustmentType: 'percentage',
      adjustmentValue: 0,
      operation: 'add',
      priority: 1,
      validFrom: '',
      validTo: ''
    });
  };

  const calculatePrice = () => {
    let finalPrice = simulator.basePrice;
    const appliedRules: PricingRule[] = [];

    // Sort rules by priority
    const activeRules = pricingRules
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of activeRules) {
      let ruleApplies = false;

      // Check if rule conditions are met
      switch (rule.ruleType) {
        case 'guest_count':
          ruleApplies = checkCondition(simulator.guestCount, rule.condition);
          break;
        case 'event_type':
          ruleApplies = rule.condition.operator === 'equal_to' && rule.condition.value === simulator.eventType;
          break;
        case 'day_of_week':
          ruleApplies = rule.condition.operator === 'equal_to' && rule.condition.value === simulator.dayOfWeek;
          break;
        case 'seasonal':
          // Simplified seasonal logic
          ruleApplies = Boolean(simulator.eventDate && checkSeasonalCondition(simulator.eventDate, rule.condition));
          break;
      }

      if (ruleApplies) {
        appliedRules.push(rule);
        
        // Apply price adjustment
        switch (rule.adjustment.operation) {
          case 'add':
            if (rule.adjustment.type === 'percentage') {
              finalPrice += (finalPrice * rule.adjustment.value) / 100;
            } else {
              finalPrice += rule.adjustment.value;
            }
            break;
          case 'subtract':
            if (rule.adjustment.type === 'percentage') {
              finalPrice -= (finalPrice * rule.adjustment.value) / 100;
            } else {
              finalPrice -= rule.adjustment.value;
            }
            break;
          case 'multiply':
            finalPrice *= rule.adjustment.value;
            break;
        }
      }
    }

    setSimulator(prev => ({
      ...prev,
      calculatedPrice: Math.max(0, finalPrice),
      appliedRules
    }));
  };

  const checkCondition = (value: number, condition: PricingRule['condition']): boolean => {
    const conditionValue = Number(condition.value);
    
    switch (condition.operator) {
      case 'greater_than':
        return value > conditionValue;
      case 'less_than':
        return value < conditionValue;
      case 'equal_to':
        return value === conditionValue;
      case 'between':
        const secondaryValue = Number(condition.secondaryValue);
        return value >= conditionValue && value <= secondaryValue;
      default:
        return false;
    }
  };

  const checkSeasonalCondition = (date: string, condition: PricingRule['condition']): boolean => {
    const eventDate = new Date(date);
    const month = eventDate.getMonth() + 1; // 1-12
    
    // Simplified seasonal logic
    const seasons: Record<string, number[]> = {
      'winter': [12, 1, 2],
      'spring': [3, 4, 5],
      'summer': [6, 7, 8],
      'autumn': [9, 10, 11]
    };
    
    const season = condition.value as string;
    return seasons[season]?.includes(month) || false;
  };

  useEffect(() => {
    if (activeTab === 'simulator') {
      calculatePrice();
    }
  }, [simulator.guestCount, simulator.eventType, simulator.eventDate, simulator.dayOfWeek, simulator.basePrice, activeTab]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    
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
          <h1>Dynamic Pricing System</h1>
          <p>Manage pricing rules and strategies</p>
        </div>
        <div className="dashboard-actions">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            Pricing Rules
          </button>
          <button
            className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button
            className={`tab-button ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            Price Simulator
          </button>
        </div>

        {/* Pricing Rules Tab */}
        {activeTab === 'rules' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Pricing Rules ({pricingRules.length})</h2>
              <Button
                variant="primary"
                onClick={() => setShowCreateRuleModal(true)}
              >
                + Create Rule
              </Button>
            </div>

            <div className="rules-grid">
              {pricingRules.length === 0 ? (
                <div className="empty-state">
                  <h3>No pricing rules found</h3>
                  <p>Create your first pricing rule to get started</p>
                </div>
              ) : (
                pricingRules.map((rule) => (
                  <div key={rule.id} className={`rule-card ${!rule.isActive ? 'inactive' : ''}`}>
                    <div className="rule-header">
                      <h3>{rule.name}</h3>
                      <div className="rule-priority">Priority: {rule.priority}</div>
                    </div>
                    
                    <div className="rule-details">
                      <p className="rule-description">{rule.description}</p>
                      
                      <div className="rule-condition">
                        <strong>Condition:</strong> {rule.ruleType.replace('_', ' ')} {rule.condition.operator.replace('_', ' ')} {rule.condition.value}
                        {rule.condition.secondaryValue && ` - ${rule.condition.secondaryValue}`}
                      </div>
                      
                      <div className="rule-adjustment">
                        <strong>Adjustment:</strong> {rule.adjustment.operation} {rule.adjustment.value}
                        {rule.adjustment.type === 'percentage' ? '%' : ' INR'}
                      </div>
                      
                      {(rule.validFrom || rule.validTo) && (
                        <div className="rule-validity">
                          <strong>Valid:</strong> {formatDate(rule.validFrom)} - {formatDate(rule.validTo)}
                        </div>
                      )}
                    </div>

                    <div className="rule-status">
                      <span className={`status-badge ${rule.isActive ? 'active' : 'inactive'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="rule-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={rule.isActive ? "danger" : "primary"}
                        size="sm"
                        onClick={() => handleToggleRule(rule.id, rule.isActive)}
                      >
                        {rule.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Price Simulator Tab */}
        {activeTab === 'simulator' && (
          <div className="tab-content">
            <div className="simulator-container">
              <div className="simulator-inputs">
                <h2>Price Simulator</h2>
                <p>Test how pricing rules affect the final price</p>
                
                <div className="simulator-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Base Price (INR)</label>
                      <input
                        type="number"
                        value={simulator.basePrice}
                        onChange={(e) => setSimulator(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Guest Count</label>
                      <input
                        type="number"
                        value={simulator.guestCount}
                        onChange={(e) => setSimulator(prev => ({ ...prev, guestCount: Number(e.target.value) }))}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Event Type</label>
                      <select
                        value={simulator.eventType}
                        onChange={(e) => setSimulator(prev => ({ ...prev, eventType: e.target.value }))}
                      >
                        <option value="Wedding">Wedding</option>
                        <option value="Birthday Party">Birthday Party</option>
                        <option value="Corporate Event">Corporate Event</option>
                        <option value="Anniversary">Anniversary</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Day of Week</label>
                      <select
                        value={simulator.dayOfWeek}
                        onChange={(e) => setSimulator(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Event Date (Optional)</label>
                    <input
                      type="date"
                      value={simulator.eventDate}
                      onChange={(e) => setSimulator(prev => ({ ...prev, eventDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="simulator-results">
                <h3>Pricing Calculation</h3>
                
                <div className="price-breakdown">
                  <div className="price-item">
                    <span>Base Price:</span>
                    <span>{formatCurrency(simulator.basePrice)}</span>
                  </div>
                  
                  {simulator.appliedRules.map((rule, index) => (
                    <div key={index} className="price-item applied-rule">
                      <span>{rule.name}:</span>
                      <span>
                        {rule.adjustment.operation === 'add' ? '+' : rule.adjustment.operation === 'subtract' ? '-' : '×'}
                        {rule.adjustment.value}
                        {rule.adjustment.type === 'percentage' ? '%' : ' INR'}
                      </span>
                    </div>
                  ))}
                  
                  <div className="price-item total">
                    <span><strong>Final Price:</strong></span>
                    <span><strong>{formatCurrency(simulator.calculatedPrice)}</strong></span>
                  </div>
                </div>

                {simulator.appliedRules.length === 0 && (
                  <div className="no-rules-applied">
                    <p>No pricing rules applied to this configuration</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Rule Modal */}
        {showCreateRuleModal && (
          <div className="modal-overlay">
            <div className="modal-content create-rule-modal">
              <div className="modal-header">
                <h2>Create Pricing Rule</h2>
                <Button variant="outline" onClick={() => setShowCreateRuleModal(false)}>×</Button>
              </div>

              <div className="modal-body">
                <form className="rule-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Rule Name *</label>
                      <input
                        type="text"
                        value={ruleForm.name}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter rule name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <input
                        type="number"
                        value={ruleForm.priority}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, priority: Number(e.target.value) }))}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={ruleForm.description}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe when this rule applies"
                      rows={2}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Rule Type</label>
                      <select
                        value={ruleForm.ruleType}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, ruleType: e.target.value as any }))}
                      >
                        <option value="guest_count">Guest Count</option>
                        <option value="event_type">Event Type</option>
                        <option value="day_of_week">Day of Week</option>
                        <option value="seasonal">Seasonal</option>
                        <option value="bulk">Bulk Discount</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Condition</label>
                      <select
                        value={ruleForm.operator}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, operator: e.target.value as any }))}
                      >
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="equal_to">Equal To</option>
                        <option value="between">Between</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Value</label>
                      <input
                        type={ruleForm.ruleType === 'guest_count' ? 'number' : 'text'}
                        value={ruleForm.value}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, value: e.target.value }))}
                        placeholder={ruleForm.ruleType === 'event_type' ? 'Wedding' : '100'}
                      />
                    </div>
                    {ruleForm.operator === 'between' && (
                      <div className="form-group">
                        <label>Second Value</label>
                        <input
                          type="number"
                          value={ruleForm.secondaryValue}
                          onChange={(e) => setRuleForm(prev => ({ ...prev, secondaryValue: e.target.value }))}
                          placeholder="200"
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Adjustment Type</label>
                      <select
                        value={ruleForm.adjustmentType}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, adjustmentType: e.target.value as any }))}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed_amount">Fixed Amount</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Operation</label>
                      <select
                        value={ruleForm.operation}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, operation: e.target.value as any }))}
                      >
                        <option value="add">Add</option>
                        <option value="subtract">Subtract</option>
                        <option value="multiply">Multiply</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Adjustment Value</label>
                    <input
                      type="number"
                      value={ruleForm.adjustmentValue}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, adjustmentValue: Number(e.target.value) }))}
                      placeholder={ruleForm.adjustmentType === 'percentage' ? '10' : '500'}
                      step="0.01"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Valid From (Optional)</label>
                      <input
                        type="date"
                        value={ruleForm.validFrom}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, validFrom: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Valid To (Optional)</label>
                      <input
                        type="date"
                        value={ruleForm.validTo}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, validTo: e.target.value }))}
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="modal-actions">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateRuleModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateRule}
                >
                  Create Rule
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Rule Modal */}
        {showEditModal && selectedRule && (
          <div className="modal-overlay">
            <div className="modal-content edit-rule-modal">
              <div className="modal-header">
                <h2>Edit Pricing Rule - {selectedRule.name}</h2>
                <Button variant="outline" onClick={() => setShowEditModal(false)}>×</Button>
              </div>

              <div className="modal-body">
                <form className="rule-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Rule Name *</label>
                      <input
                        type="text"
                        value={ruleForm.name}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter rule name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <input
                        type="number"
                        value={ruleForm.priority}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, priority: Number(e.target.value) }))}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={ruleForm.description}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe when this rule applies"
                      rows={2}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Rule Type</label>
                      <select
                        value={ruleForm.ruleType}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, ruleType: e.target.value as any }))}
                      >
                        <option value="guest_count">Guest Count</option>
                        <option value="event_type">Event Type</option>
                        <option value="day_of_week">Day of Week</option>
                        <option value="seasonal">Seasonal</option>
                        <option value="bulk">Bulk Discount</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Condition</label>
                      <select
                        value={ruleForm.operator}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, operator: e.target.value as any }))}
                      >
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="equal_to">Equal To</option>
                        <option value="between">Between</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Value</label>
                      <input
                        type={ruleForm.ruleType === 'guest_count' ? 'number' : 'text'}
                        value={ruleForm.value}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, value: e.target.value }))}
                        placeholder={ruleForm.ruleType === 'event_type' ? 'Wedding' : '100'}
                      />
                    </div>
                    {ruleForm.operator === 'between' && (
                      <div className="form-group">
                        <label>Second Value</label>
                        <input
                          type="number"
                          value={ruleForm.secondaryValue}
                          onChange={(e) => setRuleForm(prev => ({ ...prev, secondaryValue: e.target.value }))}
                          placeholder="200"
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Adjustment Type</label>
                      <select
                        value={ruleForm.adjustmentType}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, adjustmentType: e.target.value as any }))}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed_amount">Fixed Amount</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Operation</label>
                      <select
                        value={ruleForm.operation}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, operation: e.target.value as any }))}
                      >
                        <option value="add">Add</option>
                        <option value="subtract">Subtract</option>
                        <option value="multiply">Multiply</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Adjustment Value</label>
                    <input
                      type="number"
                      value={ruleForm.adjustmentValue}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, adjustmentValue: Number(e.target.value) }))}
                      placeholder={ruleForm.adjustmentType === 'percentage' ? '10' : '500'}
                      step="0.01"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Valid From (Optional)</label>
                      <input
                        type="date"
                        value={ruleForm.validFrom}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, validFrom: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Valid To (Optional)</label>
                      <input
                        type="date"
                        value={ruleForm.validTo}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, validTo: e.target.value }))}
                      />
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
                  onClick={handleUpdateRule}
                >
                  Update Rule
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicPricing;
