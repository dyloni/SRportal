import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AGENTS, ADMINS } from '../constants';
import Button from '../components/ui/Button';
import { Admin, Agent } from '../types';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [selectedUser, setSelectedUser] = useState('');
  const [userType, setUserType] = useState<'agent' | 'admin'>('agent');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user to log in.');
      return;
    }

    const users: (Agent | Admin)[] = userType === 'agent' ? AGENTS : ADMINS;
    const userToLogin = users.find(u => u.id.toString() === selectedUser);

    if (userToLogin) {
      login({
        id: userToLogin.id,
        firstName: userToLogin.firstName,
        surname: userToLogin.surname,
        email: userToLogin.email,
        profilePictureUrl: userToLogin.profilePictureUrl,
        type: userType,
        ...(userType === 'admin' && 'role' in userToLogin && { role: userToLogin.role }),
      });
    } else {
        setError('User not found.');
    }
  };
  
  const users = userType === 'agent' ? AGENTS : ADMINS;

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-bg p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-brand-surface rounded-2xl shadow-xl">
        <div>
          <h2 className="text-3xl font-extrabold text-center text-brand-text-primary">
             <span className="text-brand-pink">Stone</span><span className="text-brand-gray">River</span> Portal
          </h2>
          <p className="mt-2 text-center text-brand-text-secondary">
            Select a user to begin your session
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
           <div className="space-y-4">
              <div className="flex border border-brand-border rounded-lg overflow-hidden">
                <button type="button" onClick={() => {setUserType('agent'); setSelectedUser('')}} className={`flex-1 p-3 text-sm font-bold transition-colors ${userType === 'agent' ? 'bg-brand-pink text-white' : 'bg-white text-brand-text-secondary hover:bg-gray-100'}`}>Agent</button>
                <button type="button" onClick={() => {setUserType('admin'); setSelectedUser('')}} className={`flex-1 p-3 text-sm font-bold transition-colors ${userType === 'admin' ? 'bg-brand-pink text-white' : 'bg-white text-brand-text-secondary hover:bg-gray-100'}`}>Admin</button>
              </div>
              <div>
                <label htmlFor="user-select" className="sr-only">Select User</label>
                <select
                  id="user-select"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="block w-full px-4 py-3 text-brand-text-primary placeholder-gray-400 bg-brand-surface border border-brand-border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink text-base"
                >
                  <option value="" disabled>Select a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{`${user.firstName} ${user.surname}`}</option>
                  ))}
                </select>
              </div>
           </div>

          {error && <p className="text-sm text-center text-red-500">{error}</p>}

          <div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;