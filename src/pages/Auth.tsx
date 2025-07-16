import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import Card from '../components/ui/Card';
import './Auth.css';

const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-pattern"></div>
      </div>
      
      <div className="auth-container">
        <Card variant="elevated" padding="none" className="auth-card">
          <div className="auth-header">
            <img src="/logo.png" alt="Shiv Shakti Catering" className="auth-logo" />
            <h1 className="auth-title">Shiv Shakti Catering</h1>
            <p className="auth-subtitle">Admin Management System</p>
          </div>
          
          <div className="auth-content">
            {isLoginMode ? (
              <LoginForm onToggleMode={toggleMode} />
            ) : (
              <RegisterForm onToggleMode={toggleMode} />
            )}
          </div>
        </Card>
        
        <div className="auth-footer">
          <p>&copy; 2025 Shiv Shakti Catering. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
