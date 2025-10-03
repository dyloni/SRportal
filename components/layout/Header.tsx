import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import StatusIndicator from '../ui/StatusIndicator';

interface HeaderProps {
  onMenuButtonClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuButtonClick }) => {
  const { user, logout } = useAuth();
  const userName = user ? `${user.firstName} ${user.surname}` : '';

  return (
    <header className="bg-brand-surface shadow-sm border-b border-brand-border">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <button
              onClick={onMenuButtonClick}
              className="md:hidden mr-4 text-brand-text-secondary hover:text-brand-text-primary focus:outline-none"
              aria-label="Open sidebar"
            >
               <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
               </svg>
            </button>
            <h1 className="text-xl font-semibold text-brand-text-primary">
                <span className="text-brand-pink">Stone</span><span className="text-brand-gray">River</span> Insurance
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <StatusIndicator />
            <span className="text-brand-text-secondary hidden sm:block">Welcome, {userName}</span>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;