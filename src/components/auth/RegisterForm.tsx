import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import Button from '../ui/Button';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  phoneNumber?: string;
  companyName?: string;
  role: UserRole;
}

interface RegisterFormProps {
  onToggleMode: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      role: 'customer'
    }
  });

  const selectedRole = watch('role');

  const validateForm = (data: FormData): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!data.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords must match';
    }

    if (!data.displayName) {
      newErrors.displayName = 'Full name is required';
    } else if (data.displayName.length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }

    if (data.phoneNumber && !/^[6-9]\d{9}$/.test(data.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    if (!data.role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (data: FormData) => {
    if (!validateForm(data)) return;

    try {
      setIsLoading(true);
      await registerUser(data.email, data.password, {
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
        companyName: data.companyName,
        role: data.role
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Email is already registered' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: 'Password is too weak' });
      } else {
        setErrors({ root: error.message || 'Registration failed' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="auth-header">
        <h2>Create Account</h2>
        <p>Join Shivshakti Catering platform</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form-content">
        <div className="form-group">
          <label htmlFor="displayName">Full Name *</label>
          <input
            type="text"
            id="displayName"
            {...register('displayName')}
            className={`form-control ${errors.displayName ? 'error' : ''}`}
            placeholder="Enter your full name"
          />
          {errors.displayName && (
            <span className="error-message">{errors.displayName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            {...register('email')}
            className={`form-control ${errors.email ? 'error' : ''}`}
            placeholder="Enter your email"
          />
          {errors.email && (
            <span className="error-message">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            {...register('phoneNumber')}
            className={`form-control ${errors.phoneNumber ? 'error' : ''}`}
            placeholder="Enter 10-digit phone number"
          />
          {errors.phoneNumber && (
            <span className="error-message">{errors.phoneNumber}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="role">Account Type *</label>
          <select
            id="role"
            {...register('role')}
            className={`form-control ${errors.role ? 'error' : ''}`}
          >
            <option value="customer">Customer</option>
            {/* <option value="admin">Business Admin</option>
            <option value="superadmin">Super Admin</option> */}
          </select>
          {errors.role && (
            <span className="error-message">{errors.role}</span>
          )}
        </div>

        {(selectedRole === 'admin' || selectedRole === 'superadmin') && (
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              {...register('companyName')}
              className={`form-control ${errors.companyName ? 'error' : ''}`}
              placeholder="Enter company name"
            />
            {errors.companyName && (
              <span className="error-message">{errors.companyName}</span>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            {...register('password')}
            className={`form-control ${errors.password ? 'error' : ''}`}
            placeholder="Create a password (min 6 characters)"
          />
          {errors.password && (
            <span className="error-message">{errors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            type="password"
            id="confirmPassword"
            {...register('confirmPassword')}
            className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <span className="error-message">{errors.confirmPassword}</span>
          )}
        </div>

        {errors.root && (
          <div className="error-message">{errors.root}</div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="auth-link"
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
