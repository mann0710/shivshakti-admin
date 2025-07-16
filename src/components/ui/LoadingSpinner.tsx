import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = '#4a90e2',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`loading-spinner ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${sizeClasses[size]}`}
        style={{ borderTopColor: color }}
      />
    </div>
  );
};

export default LoadingSpinner;
