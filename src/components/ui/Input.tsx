import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface BaseInputProps {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

// Input Component
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, BaseInputProps {}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  fullWidth = false,
  inputSize = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const classes = [
    'input',
    `input-${inputSize}`,
    fullWidth && 'input-full-width',
    error && 'input-error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={classes}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
      {helpText && !error && <span className="input-help-text">{helpText}</span>}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseInputProps {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helpText,
  fullWidth = false,
  inputSize = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  const classes = [
    'textarea',
    `textarea-${inputSize}`,
    fullWidth && 'textarea-full-width',
    error && 'textarea-error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={classes}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
      {helpText && !error && <span className="input-help-text">{helpText}</span>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Select Component
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>, BaseInputProps {
  options?: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helpText,
  fullWidth = false,
  inputSize = 'md',
  options = [],
  placeholder,
  className = '',
  id,
  children,
  ...props
}, ref) => {
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  const classes = [
    'select',
    `select-${inputSize}`,
    fullWidth && 'select-full-width',
    error && 'select-error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="select-wrapper">
        <select
          ref={ref}
          id={inputId}
          className={classes}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <div className="select-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {helpText && !error && <span className="input-help-text">{helpText}</span>}
    </div>
  );
});

Select.displayName = 'Select';

export { Input, Textarea, Select };
export default Input;
