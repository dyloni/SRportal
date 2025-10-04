import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Button from '../ui/Button';
import StatusIndicator from '../ui/StatusIndicator';

interface HeaderProps {
  onMenuButtonClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuButtonClick }) => {
  const { user, logout } = useAuth();
  const { state, refreshData } = useData();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const userName = user ? `${user.firstName} ${user.surname}` : '';

  const currentUserId = user?.type === 'agent' ? user.id : 'admin';
  const unreadCount = state.messages.filter(m => m.recipientId === currentUserId && m.status === 'unread').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

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
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-brand-text-secondary hover:text-brand-text-primary transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <svg
                className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Link to="/messages" className="relative text-brand-text-secondary hover:text-brand-text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
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