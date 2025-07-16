import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import LoadingSpinner from '../ui/LoadingSpinner';
import './Auth.css';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <img src="/logo.png" alt="Shiv Shakti Catering" className="auth-logo" />
          <h1>Shiv Shakti Catering</h1>
          <p>Welcome to our catering management system</p>
        </div>

        <div className="auth-form-container">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <div className="auth-form">
            {isLogin ? 
              <LoginForm onToggleMode={() => setIsLogin(false)} /> : 
              <RegisterForm onToggleMode={() => setIsLogin(true)} />
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
