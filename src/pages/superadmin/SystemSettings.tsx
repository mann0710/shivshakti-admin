import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import '../../components/layout/Dashboard.css';
import './SystemSettings.css';

interface SystemConfig {
  companyInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    taxRate: number;
  };
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    username: string;
    fromEmail: string;
    replyToEmail: string;
  };
  businessSettings: {
    workingHours: {
      start: string;
      end: string;
    };
    advanceBookingDays: number;
    defaultGuestCount: number;
    minimumOrderValue: number;
    autoApprovalLimit: number;
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    adminAlerts: boolean;
    customerUpdates: boolean;
    lowStockAlerts: boolean;
  };
  securitySettings: {
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    twoFactorAuth: boolean;
    loginAttempts: number;
  };
}

const defaultConfig: SystemConfig = {
  companyInfo: {
    name: 'Shiv Shakti Catering',
    email: 'info@shivshakticatering.com',
    phone: '+91 98765 43210',
    address: '123 Main Street, City, State - 123456',
    website: 'www.shivshakticatering.com',
    taxRate: 18,
  },
  emailSettings: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    username: '',
    fromEmail: 'noreply@shivshakticatering.com',
    replyToEmail: 'support@shivshakticatering.com',
  },
  businessSettings: {
    workingHours: {
      start: '09:00',
      end: '18:00',
    },
    advanceBookingDays: 30,
    defaultGuestCount: 50,
    minimumOrderValue: 5000,
    autoApprovalLimit: 25000,
  },
  notificationSettings: {
    emailNotifications: true,
    smsNotifications: false,
    adminAlerts: true,
    customerUpdates: true,
    lowStockAlerts: true,
  },
  securitySettings: {
    sessionTimeout: 60,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false,
    },
    twoFactorAuth: false,
    loginAttempts: 5,
  },
};

const SystemSettings: React.FC = () => {
  const { logout } = useAuth();
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      setLoading(true);
      const configDoc = await getDoc(doc(db, 'systemConfig', 'main'));
      
      if (configDoc.exists()) {
        setConfig({ ...defaultConfig, ...configDoc.data() });
      } else {
        // Initialize with default config
        await updateDoc(doc(db, 'systemConfig', 'main'), { ...defaultConfig });
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching system config:', error);
      toast.error('Failed to load system configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'systemConfig', 'main'), {
        ...config,
        updatedAt: new Date(),
      });
      toast.success('System configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateNestedConfig = (section: keyof SystemConfig, nestedSection: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedSection]: {
          ...(prev[section] as any)[nestedSection],
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>System Settings</h1>
          <p>Configure application settings and business preferences</p>
        </div>
        <div className="dashboard-actions">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="settings-container">
          {/* Settings Navigation */}
          <div className="settings-nav">
            <button
              className={`nav-item ${activeTab === 'company' ? 'active' : ''}`}
              onClick={() => setActiveTab('company')}
            >
              Company Info
            </button>
            <button
              className={`nav-item ${activeTab === 'business' ? 'active' : ''}`}
              onClick={() => setActiveTab('business')}
            >
              Business Settings
            </button>
            <button
              className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
            <button
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button
              className={`nav-item ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              Email Settings
            </button>
          </div>

          {/* Settings Content */}
          <div className="settings-content">
            {/* Company Information */}
            {activeTab === 'company' && (
              <div className="settings-section">
                <h2>Company Information</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={config.companyInfo.name}
                      onChange={(e) => updateConfig('companyInfo', 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={config.companyInfo.email}
                      onChange={(e) => updateConfig('companyInfo', 'email', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={config.companyInfo.phone}
                      onChange={(e) => updateConfig('companyInfo', 'phone', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="url"
                      value={config.companyInfo.website}
                      onChange={(e) => updateConfig('companyInfo', 'website', e.target.value)}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <textarea
                      value={config.companyInfo.address}
                      onChange={(e) => updateConfig('companyInfo', 'address', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={config.companyInfo.taxRate}
                      onChange={(e) => updateConfig('companyInfo', 'taxRate', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Business Settings */}
            {activeTab === 'business' && (
              <div className="settings-section">
                <h2>Business Settings</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Working Hours Start</label>
                    <input
                      type="time"
                      value={config.businessSettings.workingHours.start}
                      onChange={(e) => updateNestedConfig('businessSettings', 'workingHours', 'start', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Working Hours End</label>
                    <input
                      type="time"
                      value={config.businessSettings.workingHours.end}
                      onChange={(e) => updateNestedConfig('businessSettings', 'workingHours', 'end', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Advance Booking Days</label>
                    <input
                      type="number"
                      min="1"
                      value={config.businessSettings.advanceBookingDays}
                      onChange={(e) => updateConfig('businessSettings', 'advanceBookingDays', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Default Guest Count</label>
                    <input
                      type="number"
                      min="1"
                      value={config.businessSettings.defaultGuestCount}
                      onChange={(e) => updateConfig('businessSettings', 'defaultGuestCount', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Minimum Order Value (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={config.businessSettings.minimumOrderValue}
                      onChange={(e) => updateConfig('businessSettings', 'minimumOrderValue', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Auto Approval Limit (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={config.businessSettings.autoApprovalLimit}
                      onChange={(e) => updateConfig('businessSettings', 'autoApprovalLimit', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2>Notification Settings</h2>
                <div className="toggle-grid">
                  <div className="toggle-item">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={config.notificationSettings.emailNotifications}
                        onChange={(e) => updateConfig('notificationSettings', 'emailNotifications', e.target.checked)}
                      />
                      <span>Email Notifications</span>
                    </label>
                    <p className="toggle-description">Send email notifications for important events</p>
                  </div>
                  <div className="toggle-item">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={config.notificationSettings.smsNotifications}
                        onChange={(e) => updateConfig('notificationSettings', 'smsNotifications', e.target.checked)}
                      />
                      <span>SMS Notifications</span>
                    </label>
                    <p className="toggle-description">Send SMS alerts for urgent updates</p>
                  </div>
                  <div className="toggle-item">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={config.notificationSettings.adminAlerts}
                        onChange={(e) => updateConfig('notificationSettings', 'adminAlerts', e.target.checked)}
                      />
                      <span>Admin Alerts</span>
                    </label>
                    <p className="toggle-description">Notify admins of system events</p>
                  </div>
                  <div className="toggle-item">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={config.notificationSettings.customerUpdates}
                        onChange={(e) => updateConfig('notificationSettings', 'customerUpdates', e.target.checked)}
                      />
                      <span>Customer Updates</span>
                    </label>
                    <p className="toggle-description">Send order status updates to customers</p>
                  </div>
                  <div className="toggle-item">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={config.notificationSettings.lowStockAlerts}
                        onChange={(e) => updateConfig('notificationSettings', 'lowStockAlerts', e.target.checked)}
                      />
                      <span>Low Stock Alerts</span>
                    </label>
                    <p className="toggle-description">Alert when inventory is running low</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <h2>Security Settings</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Session Timeout (minutes)</label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      value={config.securitySettings.sessionTimeout}
                      onChange={(e) => updateConfig('securitySettings', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Maximum Login Attempts</label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={config.securitySettings.loginAttempts}
                      onChange={(e) => updateConfig('securitySettings', 'loginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Minimum Password Length</label>
                    <input
                      type="number"
                      min="6"
                      max="50"
                      value={config.securitySettings.passwordPolicy.minLength}
                      onChange={(e) => updateNestedConfig('securitySettings', 'passwordPolicy', 'minLength', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="toggle-grid">
                  <div className="toggle-item">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={config.securitySettings.twoFactorAuth}
                        onChange={(e) => updateConfig('securitySettings', 'twoFactorAuth', e.target.checked)}
                      />
                      <span>Two-Factor Authentication</span>
                    </label>
                    <p className="toggle-description">Require 2FA for admin accounts</p>
                  </div>
                  <div className="toggle-item">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={config.securitySettings.passwordPolicy.requireUppercase}
                        onChange={(e) => updateNestedConfig('securitySettings', 'passwordPolicy', 'requireUppercase', e.target.checked)}
                      />
                      <span>Require Uppercase Letters</span>
                    </label>
                    <p className="toggle-description">Passwords must contain uppercase letters</p>
                  </div>
                  <div className="toggle-item">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={config.securitySettings.passwordPolicy.requireNumbers}
                        onChange={(e) => updateNestedConfig('securitySettings', 'passwordPolicy', 'requireNumbers', e.target.checked)}
                      />
                      <span>Require Numbers</span>
                    </label>
                    <p className="toggle-description">Passwords must contain numbers</p>
                  </div>
                  <div className="toggle-item">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={config.securitySettings.passwordPolicy.requireSymbols}
                        onChange={(e) => updateNestedConfig('securitySettings', 'passwordPolicy', 'requireSymbols', e.target.checked)}
                      />
                      <span>Require Special Characters</span>
                    </label>
                    <p className="toggle-description">Passwords must contain symbols</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="settings-section">
                <h2>Email Configuration</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>SMTP Host</label>
                    <input
                      type="text"
                      value={config.emailSettings.smtpHost}
                      onChange={(e) => updateConfig('emailSettings', 'smtpHost', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>SMTP Port</label>
                    <input
                      type="number"
                      value={config.emailSettings.smtpPort}
                      onChange={(e) => updateConfig('emailSettings', 'smtpPort', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={config.emailSettings.username}
                      onChange={(e) => updateConfig('emailSettings', 'username', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>From Email</label>
                    <input
                      type="email"
                      value={config.emailSettings.fromEmail}
                      onChange={(e) => updateConfig('emailSettings', 'fromEmail', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Reply-To Email</label>
                    <input
                      type="email"
                      value={config.emailSettings.replyToEmail}
                      onChange={(e) => updateConfig('emailSettings', 'replyToEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
