import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  className = '', 
  disabled = false,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    // primary: 'bg-blue-900 hover:bg-blue-800 text-white focus:ring-blue-500 shadow-md hover:shadow-lg',
    // secondary: 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500 shadow-md hover:shadow-lg',
    // outline: 'border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white focus:ring-blue-500',
    // ghost: 'text-blue-900 hover:bg-blue-50 focus:ring-blue-500',
    // success: 'bg-green-700 hover:bg-green-800 text-white focus:ring-green-500 shadow-md hover:shadow-lg',
    // warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500 shadow-md hover:shadow-lg',
    // danger: 'bg-red-700 hover:bg-red-800 text-white focus:ring-red-500 shadow-md hover:shadow-lg'
  };
  
  const sizes = {
  //   sm: 'px-3 py-2 text-sm',
  //   md: 'px-4 py-2 text-base',
  //   lg: 'px-6 py-3 text-lg',
  //   xl: 'px-8 py-4 text-xl'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;