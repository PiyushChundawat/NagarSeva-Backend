import React from 'react';

const Section = ({ 
  children, 
  className = '', 
  background = 'white',
  padding = 'large',
  ...props 
}) => {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    blue: 'bg-blue-50',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100'
  };
  
  const paddings = {
    small: 'py-8 px-4',
    medium: 'py-12 px-4',
    large: 'py-16 px-4',
    xlarge: 'py-20 px-4'
  };
  
  const classes = `${backgrounds[background]} ${paddings[padding]} ${className}`;
  
  return (
    <section className={classes} {...props}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
};

export default Section;