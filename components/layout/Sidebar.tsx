import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const agentLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Customers', path: '/customers' },
  { name: 'New Policy', path: '/new-policy' },
  { name: 'Make Payment', path: '/payment' },
  { name: 'My Requests', path: '/requests' },
  { name: 'Messages', path: '/messages' },
  { name: 'My Profile', path: '/profile' },
];

const adminLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Agents', path: '/agents' },
  { name: 'Customers', path: '/customers' },
  { name: 'Manage Requests', path: '/requests' },
  { name: 'Messages', path: '/messages' },
  { name: 'My Profile', path: '/profile' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { state } = useData();
  const links = user?.type === 'agent' ? agentLinks : adminLinks;
  
  const currentUserId = user?.type === 'agent' ? user.id : 'admin';
  const unreadCount = state.messages.filter(m => m.recipientId === currentUserId && m.status === 'unread').length;

  const navLinkClasses = 'flex items-center justify-between px-4 py-2 mt-2 text-brand-text-secondary rounded-md hover:bg-gray-100';
  const activeNavLinkClasses = 'bg-brand-pink/10 text-brand-pink font-semibold';

  return (
    <>
      <div className={`fixed inset-0 z-20 bg-black opacity-50 transition-opacity md:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={onClose}></div>
      <div className={`fixed inset-y-0 left-0 z-30 w-64 px-2 py-4 overflow-y-auto bg-brand-surface border-r border-brand-border transform md:translate-x-0 md:static md:inset-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between px-2">
           <span className="text-2xl font-bold">
             <span className="text-brand-pink">Stone</span><span className="text-brand-gray">River</span>
           </span>
        </div>
        <nav className="mt-8">
          {links.map(link => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={onClose}
              className={({ isActive }) =>
                `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
              }
            >
              <span>{link.name}</span>
              {link.name === 'Messages' && unreadCount > 0 && (
                 <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;