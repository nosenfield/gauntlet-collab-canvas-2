import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = 'Loading...' 
}) => {
  const sizeMap = {
    small: 16,
    medium: 32,
    large: 48
  };

  const spinnerSize = sizeMap[size];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '16px'
    }}>
      <div 
        style={{
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {message && (
        <div style={{ 
          color: '#6b7280', 
          fontSize: '14px', 
          fontWeight: '500' 
        }}>
          {message}
        </div>
      )}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  message, 
  children 
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}>
        <LoadingSpinner message={message} />
      </div>
    </div>
  );
};

export default LoadingSpinner;
