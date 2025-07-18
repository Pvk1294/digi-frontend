
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  return (
    <img 
      src="/lovable-uploads/dd5d15ef-9cf4-484c-a960-54f8d7b86d32.png"
      alt="DigitalInclined"
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  );
};
