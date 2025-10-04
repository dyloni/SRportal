import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import TimePeriodSelector from '../../components/analytics/TimePeriodSelector';
import AnalyticsCard from '../../components/analytics/AnalyticsCard';
import { calculateAnalytics, getPeriodLabel, TimePeriod } from '../../utils/analyticsHelpers';

const AgentDashboard: React.FC = () => {
    const { user } = useAuth();
    const { state } = useData();
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');

    if (!user) return null;

    const myCustomers = state.customers.filter(c => c.assignedAgentId === user.id);
    const myRequests = state.requests.filter(r => r.agentId === user.id);
    const pendingRequests = myRequests.filter(r => r.status === 'Pending').length;

    const analytics = useMemo(() =>
        calculateAnalytics(state.customers, state.requests, selectedPeriod, user.id),
        [state.customers, state.requests, selectedPeriod, user.id]
    );

    const periodLabel = getPeriodLabel(selectedPeriod);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-extrabold text-brand-text-primary">Agent Dashboard</h2>
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
                    title="Revenue Generated"
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

            <h3 className="text-xl font-bold text-brand-text-primary mb-4">Customer Status Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <AnalyticsCard
                    title="Total Customers"
                    value={myCustomers.length}
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
                    title="Outstanding Balance"
                    value={`$${analytics.outstandingBalance.toFixed(2)}`}
                    color="red"
                />
            </div>

            <div className="mt-8">
              <Card title="Quick Actions">
                <div className="flex flex-wrap gap-4">
                  <Link to="/new-policy" className="bg-brand-pink text-white px-6 py-3 rounded-md hover:bg-brand-light-pink font-medium transition-colors">Create New Policy</Link>
                  <Link to="/payment" className="bg-gray-200 text-brand-text-secondary px-6 py-3 rounded-md hover:bg-gray-300 font-medium transition-colors">Make a Payment</Link>
                  <Link to="/customers" className="bg-gray-200 text-brand-text-secondary px-6 py-3 rounded-md hover:bg-gray-300 font-medium transition-colors">View Customers</Link>
                  <Link to="/requests" className="bg-gray-200 text-brand-text-secondary px-6 py-3 rounded-md hover:bg-gray-300 font-medium transition-colors">View Requests</Link>
                </div>
              </Card>
            </div>
        </div>
    );
};

export default AgentDashboard;
