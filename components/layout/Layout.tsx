import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useUnreadNotifications(); // Hook to update document title with unread count

  return (
    <div className="flex h-screen bg-brand-bg text-brand-text-primary">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuButtonClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-bg">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
