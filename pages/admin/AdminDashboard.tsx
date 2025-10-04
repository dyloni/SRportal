import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import TimePeriodSelector from '../../components/analytics/TimePeriodSelector';
import AnalyticsCard from '../../components/analytics/AnalyticsCard';
import { calculateAnalytics, getPeriodLabel, TimePeriod } from '../../utils/analyticsHelpers';

const AdminDashboard: React.FC = () => {
    const { state } = useData();
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');

    const totalCustomers = state.customers.length;
    const totalAgents = state.agents.length;
    const pendingClaims = state.claims.filter(c => c.status === 'Pending').length;

    const analytics = useMemo(() =>
        calculateAnalytics(state.customers, [], selectedPeriod),
        [state.customers, selectedPeriod]
    );

    const periodLabel = getPeriodLabel(selectedPeriod);

    const topAgents = useMemo(() => {
        const agentStats = state.agents.map(agent => {
            const agentCustomers = state.customers.filter(c => c.assignedAgentId === agent.id);
            const agentAnalytics = calculateAnalytics(state.customers, [], selectedPeriod, agent.id);
            return {
                agent,
                customerCount: agentCustomers.length,
                newCustomers: agentAnalytics.newCustomers,
                revenue: agentAnalytics.totalRevenue,
            };
        });
        return agentStats.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [state.agents, state.customers, selectedPeriod]);

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
                    title="Pending Claims"
                    value={pendingClaims}
                    subtitle={`${state.claims.filter(c => c.status === 'Approved').length} approved, ${state.claims.filter(c => c.status === 'Paid').length} paid`}
                    color="orange"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

                <Card title="Recent Claims">
                    <ul className="space-y-3">
                        {state.claims.slice(-8).reverse().map(claim => {
                            const statusColor = claim.status === 'Paid' ? 'text-green-600' : claim.status === 'Approved' ? 'text-blue-600' : claim.status === 'Pending' ? 'text-orange-600' : 'text-red-600';
                            return (
                                <li key={claim.id} className="border-b last:border-b-0 pb-3 last:pb-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm text-brand-text-primary">{claim.deceasedName}</p>
                                            <p className="text-xs text-brand-text-secondary">
                                                Policy: {claim.policyNumber} · Filed by {claim.filedByName}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-semibold ${statusColor}`}>{claim.status}</span>
                                            <p className="text-xs text-brand-text-secondary">${claim.claimAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                        {state.claims.length === 0 && (
                            <li className="text-center py-4 text-brand-text-secondary">
                                No claims yet
                            </li>
                        )}
                    </ul>
                </Card>
            </div>

            <div className="mt-8">
                <Card title="Quick Actions">
                    <div className="flex flex-wrap gap-4">
                        <Link to="/customers" className="bg-brand-pink text-white px-6 py-3 rounded-md hover:bg-brand-light-pink font-medium transition-colors">View Customers</Link>
                        <Link to="/agents" className="bg-gray-200 text-brand-text-secondary px-6 py-3 rounded-md hover:bg-gray-300 font-medium transition-colors">Manage Agents</Link>
                        <Link to="/claims" className="bg-gray-200 text-brand-text-secondary px-6 py-3 rounded-md hover:bg-gray-300 font-medium transition-colors">Manage Claims</Link>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
