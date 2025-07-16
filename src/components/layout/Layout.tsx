import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGoBack = () => {
    if (location.pathname === '/dashboard') {
      return; // Already on dashboard
    }
    navigate('/dashboard');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const routes: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/menu-management': 'Menu Management',
      '/create-quote': 'Create Quote',
      '/manage-quotes': 'Manage Quotes',
      '/customers': 'Customer Management',
      '/orders': 'Order Tracking',
      '/reports': 'Analytics & Reports',
      '/users': 'User Management',
      '/pricing': 'Dynamic Pricing',
      '/packages': 'Package Management',
      '/settings': 'System Settings',
      '/my-quotes': 'My Quotes'
    };
    return routes[path] || 'Dashboard';
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'superadmin': 'Super Admin',
      'admin': 'Admin',
      'customer': 'Customer'
    };
    return roleNames[role] || role;
  };

  const getNavigationItems = () => {
    if (!currentUser) return [];

    const role = currentUser.role;
    const items: Array<{ path: string; label: string; icon: string; divider?: boolean }> = [];

    // Common items for admin and superadmin
    if (role === 'admin' || role === 'superadmin') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { path: '/create-quote', label: 'Create Quote', icon: '📝' },
        { path: '/manage-quotes', label: 'Manage Quotes', icon: '📋' },
        { path: '/customers', label: 'Customer Management', icon: '👥' },
        { path: '/orders', label: 'Order Tracking', icon: '📦' },
        { path: '/reports', label: 'Analytics & Reports', icon: '📊' }
      );
    }

    // SuperAdmin only items
    if (role === 'superadmin') {
      items.push(
        { path: '/menu-management', label: 'Menu Management', icon: '🍽️', divider: true },
        { path: '/users', label: 'User Management', icon: '👤' },
        { path: '/pricing', label: 'Dynamic Pricing', icon: '💰' },
        { path: '/packages', label: 'Package Management', icon: '📦' },
        { path: '/settings', label: 'System Settings', icon: '⚙️' }
      );
    }

    // Customer only items
    if (role === 'customer') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { path: '/my-quotes', label: 'My Quotes', icon: '📋' }
      );
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="layout">
      {/* Header */}
      <header className="layout-header">
        <div className="header-container">
          {/* Left Section: Back Button + Business Details */}
          <div className="header-left">
            {location.pathname !== '/dashboard' && (
              <button className="back-button" onClick={handleGoBack}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <img src="/logo.png" alt="Shiv Shakti Catering" className="header-logo" />
            <div className="business-info">
              <span className="business-name">Shiv Shakti Catering</span>
              <span className="business-tagline">Perfect Service</span>
            </div>
          </div>

          {/* Center Section: Current Page + Navigation */}
          <div className="header-center">
            <div className="current-page">
              <h1 className="page-title-header">{getPageTitle()}</h1>
            </div>
            {currentUser && (
              <div className="nav-dropdown">
                <button 
                  className="nav-toggle"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Menu</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`dropdown-arrow ${isMenuOpen ? 'open' : ''}`}>
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                {isMenuOpen && (
                  <div className="nav-menu">
                    {navigationItems.map((item, index) => (
                      <React.Fragment key={item.path}>
                        {item.divider && <div className="menu-divider"></div>}
                        <button
                          className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                          onClick={() => {
                            navigate(item.path);
                            setIsMenuOpen(false);
                          }}
                        >
                          <span className="menu-icon">{item.icon}</span>
                          <span className="menu-label">{item.label}</span>
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Section: User Dropdown */}
          <div className="header-right">
            {currentUser && (
              <div className="user-dropdown">
                <button 
                  className="user-button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div className="user-info">
                    <span className="user-name">{currentUser.displayName}</span>
                    <span className="user-role">{getRoleDisplayName(currentUser.role)}</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`dropdown-arrow ${isUserDropdownOpen ? 'open' : ''}`}>
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                {isUserDropdownOpen && (
                  <div className="user-menu">
                    <div className="user-menu-header">
                      <div className="user-name">{currentUser.displayName}</div>
                      <div className="user-role">{getRoleDisplayName(currentUser.role)}</div>
                    </div>
                    <div className="menu-divider"></div>
                    <button className="menu-item" onClick={() => {
                      setIsUserDropdownOpen(false);
                      // Add profile navigation here if needed
                    }}>
                      <span className="menu-icon">👤</span>
                      <span className="menu-label">Profile</span>
                    </button>
                    <button className="menu-item" onClick={() => {
                      setIsUserDropdownOpen(false);
                      // Add settings navigation here if needed
                    }}>
                      <span className="menu-icon">⚙️</span>
                      <span className="menu-label">Settings</span>
                    </button>
                    <div className="menu-divider"></div>
                    <button className="menu-item logout-item" onClick={() => {
                      setIsUserDropdownOpen(false);
                      handleLogout();
                    }}>
                      <span className="menu-icon">🚪</span>
                      <span className="menu-label">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="layout-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="layout-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Shiv Shakti Catering</h4>
              <p>Making your special moments memorable with delicious food and perfect service.</p>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>📧 info@shivshakticatering.com</p>
              <p>📞 +91 98765 43210</p>
            </div>
            <div className="footer-section">
              <h4>Services</h4>
              <p>Wedding Catering</p>
              <p>Corporate Events</p>
              <p>Private Parties</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Shiv Shakti Catering. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
