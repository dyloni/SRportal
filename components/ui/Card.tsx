import React from 'react';

const Card: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className }) => {
  return (
    <div className={`bg-brand-surface rounded-xl shadow-md ${className}`}>
      {title && (
        <div className="px-4 py-4 border-b border-brand-border sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-brand-text-primary">
            {title}
          </h3>
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
};

export default Card;
