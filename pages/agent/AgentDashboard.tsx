import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/ui/Card';
import { Link } from 'react-router-dom';

const AgentDashboard: React.FC = () => {
    const { user } = useAuth();
    const { state } = useData();

    if (!user) return null;

    const myCustomers = state.customers.filter(c => c.assignedAgentId === user.id);
    const myRequests = state.requests.filter(r => r.agentId === user.id);
    const pendingRequests = myRequests.filter(r => r.status === 'Pending').length;

    return (
        <div>
            <h2 className="text-3xl font-extrabold text-brand-text-primary mb-6">Agent Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold">My Customers</h3>
                    <p className="text-4xl font-bold mt-2">{myCustomers.length}</p>
                    <Link to="/customers" className="text-brand-pink hover:underline mt-4 inline-block">View Customers</Link>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold">Total Requests</h3>
                    <p className="text-4xl font-bold mt-2">{myRequests.length}</p>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold">Pending Requests</h3>
                    <p className="text-4xl font-bold mt-2">{pendingRequests}</p>
                    <Link to="/requests" className="text-brand-pink hover:underline mt-4 inline-block">View Requests</Link>
                </Card>
            </div>
            <div className="mt-8">
              <Card title="Quick Actions">
                <div className="flex space-x-4">
                  <Link to="/new-policy" className="bg-brand-pink text-white px-4 py-2 rounded-md hover:bg-brand-light-pink">Create New Policy</Link>
                  <Link to="/payment" className="bg-gray-200 text-brand-text-secondary px-4 py-2 rounded-md hover:bg-gray-300">Make a Payment</Link>
                </div>
              </Card>
            </div>
        </div>
    );
};

export default AgentDashboard;
