import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Customer } from '../../types';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import PolicyStatusBadge from '../../components/ui/PolicyStatusBadge';
import { getEffectivePolicyStatus } from '../../utils/statusHelpers';

const AgentCustomers: React.FC = () => {
    const { user } = useAuth();
    const { state } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const agentCustomers = useMemo(() => {
        if (!user) return [];
        return state.customers.filter(c => c.assignedAgentId === user.id);
    }, [state.customers, user]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return agentCustomers;
        const lowercasedTerm = searchTerm.toLowerCase();
        return agentCustomers.filter(c =>
            `${c.firstName} ${c.surname}`.toLowerCase().includes(lowercasedTerm) ||
            c.policyNumber.toLowerCase().includes(lowercasedTerm)
        );
    }, [searchTerm, agentCustomers]);

    if (!user) return null;

    return (
        <div>
            <h2 className="text-3xl font-extrabold text-brand-text-primary mb-6">My Customers</h2>
            <Card className="p-0">
              <>
                <div className="p-4">
                    <input
                        type="text"
                        placeholder="Search customers by name or policy number..."
                        className="block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Policy Number</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {filteredCustomers.map((customer: Customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{`${customer.firstName} ${customer.surname}`}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{customer.policyNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <PolicyStatusBadge status={getEffectivePolicyStatus(customer, state.requests)} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <span className="text-brand-pink hover:text-brand-light-pink">View</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </>
            </Card>
        </div>
    );
};

export default AgentCustomers;
