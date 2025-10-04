import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import TimePeriodSelector from '../../components/analytics/TimePeriodSelector';
import AnalyticsCard from '../../components/analytics/AnalyticsCard';
import { calculateAnalytics, getPeriodLabel, TimePeriod, AnalyticsData } from '../../utils/analyticsHelpers';
import { RequestType } from '../../types';

const AdminDashboard: React.FC = () => {
    const { state } = useData();
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        newCustomers: 0,
        newPolicies: 0,
        totalRevenue: 0,
        paymentsReceived: 0,
        outstandingBalance: 0,
        activeCustomers: 0,
        overdueCustomers: 0,
        inactiveCustomers: 0,
        approvedRequests: 0,
        pendingRequests: 0,
        rejectedRequests: 0,
    });
    const [topAgents, setTopAgents] = useState<any[]>([]);

    const totalCustomers = state.customers.length;
    const totalAgents = state.agents.length;
    const pendingRequests = state.requests.filter(r => r.status === 'Pending').length;

    useEffect(() => {
        const loadAnalytics = async () => {
            const data = await calculateAnalytics(state.customers, state.requests, state.payments, selectedPeriod);
            setAnalytics(data);
        };
        loadAnalytics();
    }, [state.customers, state.requests, state.payments, selectedPeriod]);

    useEffect(() => {
        const loadTopAgents = async () => {
            const agentStats = await Promise.all(state.agents.map(async (agent) => {
                const agentCustomers = state.customers.filter(c => c.assignedAgentId === agent.id);
                const agentAnalytics = await calculateAnalytics(state.customers, state.requests, state.payments, selectedPeriod, agent.id);
                return {
                    agent,
                    customerCount: agentCustomers.length,
                    newCustomers: agentAnalytics.newCustomers,
                    revenue: agentAnalytics.totalRevenue,
                };
            }));
            setTopAgents(agentStats.sort((a, b) => b.revenue - a.revenue).slice(0, 5));
        };
        loadTopAgents();
    }, [state.agents, state.customers, state.requests, state.payments, selectedPeriod]);

    const periodLabel = getPeriodLabel(selectedPeriod);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-extrabold text-brand-text-primary">Admin Dashboard</h2>
                <TimePeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
            </div>

            <div className="mb-4">
                <p className="text-sm text-brand-text-secondary">
                    Analytics for <span className="font-semibold">{periodLabel}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <AnalyticsCard
                    title="New Customers"
                    value={analytics.newCustomers}
                    subtitle={`in ${selectedPeriod === 'daily' ? 'today' : selectedPeriod === 'weekly' ? 'this week' : 'this month'}`}
                    color="blue"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    }
                />
                <AnalyticsCard
                    title="Total Revenue"
                    value={`$${analytics.totalRevenue.toFixed(2)}`}
                    subtitle={`${analytics.paymentsReceived} payments received`}
                    color="green"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <AnalyticsCard
                    title="New Policies"
                    value={analytics.newPolicies}
                    subtitle="policies approved"
                    color="purple"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                />
                <AnalyticsCard
                    title="Pending Requests"
                    value={analytics.pendingRequests}
                    subtitle={`${analytics.approvedRequests} approved, ${analytics.rejectedRequests} rejected`}
                    color="orange"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
            </div>

            <h3 className="text-xl font-bold text-brand-text-primary mb-4">Organization Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <AnalyticsCard
                    title="Total Customers"
                    value={totalCustomers}
                    color="blue"
                />
                <AnalyticsCard
                    title="Active Customers"
                    value={analytics.activeCustomers}
                    color="green"
                />
                <AnalyticsCard
                    title="Overdue Customers"
                    value={analytics.overdueCustomers}
                    color="orange"
                />
                <AnalyticsCard
                    title="Total Agents"
                    value={totalAgents}
                    color="purple"
                />
                <AnalyticsCard
                    title="Outstanding Balance"
                    value={`$${analytics.outstandingBalance.toFixed(2)}`}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card title="Top Performing Agents">
                    <div className="space-y-4">
                        {topAgents.map((item, index) => (
                            <Link
                                key={item.agent.id}
                                to={`/agents/${item.agent.id}`}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-brand-text-primary">
                                            {item.agent.firstName} {item.agent.surname}
                                        </p>
                                        <p className="text-xs text-brand-text-secondary">
                                            {item.customerCount} customers · {item.newCustomers} new
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">${item.revenue.toFixed(2)}</p>
                                    <p className="text-xs text-brand-text-secondary">revenue</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </Card>

                <Card title="Recent Payments">
                    <ul className="space-y-3">
                        {state.payments.slice(-8).reverse().map(payment => {
                            const customer = state.customers.find(c => c.id === payment.customer_id);
                            const agent = state.agents.find(a => a.id === payment.recorded_by_agent_id);
                            return (
                                <li key={payment.id} className="border-b last:border-b-0 pb-3 last:pb-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm text-brand-text-primary">
                                                {customer ? `${customer.firstName} ${customer.surname}` : payment.policy_number}
                                            </p>
                                            <p className="text-xs text-brand-text-secondary">
                                                {payment.payment_period} · {payment.payment_method}
                                            </p>
                                            {agent && (
                                                <p className="text-xs text-brand-text-secondary">
                                                    by {agent.firstName} {agent.surname}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">${parseFloat(payment.payment_amount).toFixed(2)}</p>
                                            <p className="text-xs text-brand-text-secondary">
                                                {new Date(payment.payment_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            </div>

            <div className="mt-8">
                <Card title="Quick Actions">
                    <div className="flex flex-wrap gap-4">
                        <Link to="/customers" className="bg-brand-pink text-white px-6 py-3 rounded-md hover:bg-brand-light-pink font-medium transition-colors">View Customers</Link>
                        <Link to="/agents" className="bg-gray-200 text-brand-text-secondary px-6 py-3 rounded-md hover:bg-gray-300 font-medium transition-colors">Manage Agents</Link>
                        <Link to="/requests" className="bg-gray-200 text-brand-text-secondary px-6 py-3 rounded-md hover:bg-gray-300 font-medium transition-colors">Review Requests</Link>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
