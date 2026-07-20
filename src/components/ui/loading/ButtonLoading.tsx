import React from 'react';
import InlineSpinner from './InlineSpinner';
import styles from './Skeleton.module.css';

interface ButtonLoadingProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  spinnerSize?: number;
  children: React.ReactNode;
}

export default function ButtonLoading({
  isLoading = false,
  loadingText,
  spinnerSize = 14,
  disabled,
  children,
  className = '',
  ...props
}: ButtonLoadingProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${className} ${isLoading ? styles.btnLoading : ''}`}
    >
      {isLoading ? (
        <>
          <InlineSpinner size={spinnerSize} />
          {loadingText ? <span>{loadingText}</span> : children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
