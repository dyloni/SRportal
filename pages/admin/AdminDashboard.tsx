import React from 'react';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/ui/Card';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    const { state } = useData();

    const totalCustomers = state.customers.length;
    const totalAgents = state.agents.length;
    const pendingRequests = state.requests.filter(r => r.status === 'Pending').length;

    return (
        <div>
            <h2 className="text-3xl font-extrabold text-brand-text-primary mb-6">Admin Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold">Total Customers</h3>
                    <p className="text-4xl font-bold mt-2">{totalCustomers}</p>
                    <Link to="/customers" className="text-brand-pink hover:underline mt-4 inline-block">View Customers</Link>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold">Total Agents</h3>
                    <p className="text-4xl font-bold mt-2">{totalAgents}</p>
                     <Link to="/agents" className="text-brand-pink hover:underline mt-4 inline-block">View Agents</Link>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold">Pending Requests</h3>
                    <p className="text-4xl font-bold mt-2">{pendingRequests}</p>
                    <Link to="/requests" className="text-brand-pink hover:underline mt-4 inline-block">Manage Requests</Link>
                </Card>
            </div>
             <div className="mt-8">
              <Card title="Recent Activity">
                  <ul>
                    {state.requests.slice(-5).reverse().map(req => (
                      <li key={req.id} className="border-b last:border-b-0 py-2">
                        <span className="font-semibold">{req.requestType}</span> request from Agent ID {req.agentId} is <span className="font-semibold">{req.status}</span>.
                      </li>
                    ))}
                  </ul>
              </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
