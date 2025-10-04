import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Customer } from '../../types';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import PolicyStatusBadge from '../../components/ui/PolicyStatusBadge';
import { supabase } from '../../utils/supabase';

const AgentCustomers: React.FC = () => {
    const { user } = useAuth();
    const { state } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [customerBalances, setCustomerBalances] = useState<Record<number, { balance: number; monthsDue: number }>>({});

    const agentCustomers = useMemo(() => {
        if (!user) return [];
        return state.customers.filter(c => c.assignedAgentId === user.id);
    }, [state.customers, user]);

    useEffect(() => {
        loadBalances();
    }, [agentCustomers]);

    const loadBalances = async () => {
        const balances: Record<number, { balance: number; monthsDue: number }> = {};

        for (const customer of agentCustomers) {
            const { data: payments } = await supabase
                .from('payments')
                .select('*')
                .eq('customer_id', customer.id);

            const paymentCount = payments?.length || 0;
            const policyStartDate = new Date(customer.inceptionDate);
            const today = new Date();
            const monthsSinceStart = ((today.getFullYear() - policyStartDate.getFullYear()) * 12) + (today.getMonth() - policyStartDate.getMonth()) + 1;
            const monthsDue = monthsSinceStart - paymentCount;
            const outstandingBalance = monthsDue > 0 ? monthsDue * customer.totalPremium : 0;

            balances[customer.id] = {
                balance: outstandingBalance,
                monthsDue: monthsDue > 0 ? monthsDue : 0,
            };
        }

        setCustomerBalances(balances);
    };

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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Phone</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Package</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Participants</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Premium</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Balance Due</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {filteredCustomers.map((customer: Customer) => {
                                const customerBalance = customerBalances[customer.id] || { balance: 0, monthsDue: 0 };
                                return (
                                    <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{`${customer.firstName} ${customer.surname}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{customer.policyNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{customer.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{customer.funeralPackage}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary text-center">{customer.participants.length}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary font-semibold">${customer.totalPremium.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {customerBalance.balance > 0 ? (
                                                <span className="font-semibold text-red-600">${customerBalance.balance.toFixed(2)} ({customerBalance.monthsDue} mo{customerBalance.monthsDue !== 1 ? 's' : ''})</span>
                                            ) : (
                                                <span className="text-green-600 font-semibold">Paid Up</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <PolicyStatusBadge status={customer.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <span className="text-brand-pink hover:text-brand-light-pink">View</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
              </>
            </Card>
        </div>
    );
};

export default AgentCustomers;
