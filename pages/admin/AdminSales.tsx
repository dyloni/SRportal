import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/ui/Card';
import TimePeriodSelector from '../../components/analytics/TimePeriodSelector';
import AnalyticsCard from '../../components/analytics/AnalyticsCard';
import { calculateAnalytics, getPeriodLabel, TimePeriod, AnalyticsData } from '../../utils/analyticsHelpers';
import { RequestType, RequestStatus, FuneralPackage } from '../../types';

const AdminSales: React.FC = () => {
    const { state } = useData();
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('monthly');
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
    const [agentPerformance, setAgentPerformance] = useState<any[]>([]);

    useEffect(() => {
        const loadAnalytics = async () => {
            const data = await calculateAnalytics(state.customers, state.requests, state.payments, selectedPeriod);
            setAnalytics(data);
        };
        loadAnalytics();
    }, [state.customers, state.requests, state.payments, selectedPeriod]);

    useEffect(() => {
        const loadAgentPerformance = async () => {
            const performance = await Promise.all(state.agents.map(async (agent) => {
                const agentCustomers = state.customers.filter(c => c.assignedAgentId === agent.id);
                const agentAnalytics = await calculateAnalytics(state.customers, state.requests, state.payments, selectedPeriod, agent.id);

                const totalPremiumValue = agentCustomers.reduce((sum, c) => sum + c.totalPremium, 0);

                return {
                    agent,
                    customerCount: agentCustomers.length,
                    newCustomers: agentAnalytics.newCustomers,
                    revenue: agentAnalytics.totalRevenue,
                    newPolicies: agentAnalytics.newPolicies,
                    totalPremiumValue,
                    activeCustomers: agentAnalytics.activeCustomers,
                    overdueCustomers: agentAnalytics.overdueCustomers,
                };
            }));
            setAgentPerformance(performance.sort((a, b) => b.revenue - a.revenue));
        };
        loadAgentPerformance();
    }, [state.agents, state.customers, state.requests, state.payments, selectedPeriod]);

    const periodLabel = getPeriodLabel(selectedPeriod);

    const packageBreakdown = useMemo(() => {
        const breakdown: Record<string, { count: number; revenue: number }> = {
            [FuneralPackage.LITE]: { count: 0, revenue: 0 },
            [FuneralPackage.STANDARD]: { count: 0, revenue: 0 },
            [FuneralPackage.PREMIUM]: { count: 0, revenue: 0 },
        };

        state.customers.forEach(customer => {
            if (customer.funeralPackage && breakdown[customer.funeralPackage]) {
                breakdown[customer.funeralPackage].count++;
                breakdown[customer.funeralPackage].revenue += customer.totalPremium;
            }
        });

        return breakdown;
    }, [state.customers]);

    const revenueByPaymentMethod = useMemo(() => {
        const methodRevenue: Record<string, number> = {};

        state.payments.forEach(payment => {
            const method = payment.payment_method;
            methodRevenue[method] = (methodRevenue[method] || 0) + parseFloat(payment.payment_amount);
        });

        return Object.entries(methodRevenue).sort((a, b) => b[1] - a[1]);
    }, [state.payments]);

    const monthlyTrend = useMemo(() => {
        const last6Months = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            const monthPayments = state.payments
                .filter(p => {
                    const paymentDate = new Date(p.payment_date);
                    return paymentDate >= monthStart && paymentDate <= monthEnd;
                })
                .reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0);

            const monthCustomers = state.customers.filter(c => {
                const createdDate = new Date(c.dateCreated);
                return createdDate >= monthStart && createdDate <= monthEnd;
            }).length;

            last6Months.push({
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                revenue: monthPayments,
                customers: monthCustomers,
            });
        }

        return last6Months;
    }, [state.payments, state.customers]);

    const totalPremiumValue = useMemo(() => {
        return state.customers.reduce((sum, c) => sum + c.totalPremium, 0);
    }, [state.customers]);

    const averagePremium = state.customers.length > 0 ? totalPremiumValue / state.customers.length : 0;

    const conversionRate = useMemo(() => {
        const newPolicyRequests = state.requests.filter(r => r.requestType === RequestType.NEW_POLICY);
        const approvedPolicies = newPolicyRequests.filter(r => r.status === RequestStatus.APPROVED);
        return newPolicyRequests.length > 0 ? (approvedPolicies.length / newPolicyRequests.length) * 100 : 0;
    }, [state.requests]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-extrabold text-brand-text-primary">Sales Analytics</h2>
                <TimePeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
            </div>

            <div className="mb-4">
                <p className="text-sm text-brand-text-secondary">
                    Analytics for <span className="font-semibold">{periodLabel}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <AnalyticsCard
                    title="Total Revenue"
                    value={`$${analytics.totalRevenue.toFixed(2)}`}
                    subtitle={`${analytics.paymentsReceived} payments`}
                    color="green"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <AnalyticsCard
                    title="New Customers"
                    value={analytics.newCustomers}
                    subtitle="acquired in period"
                    color="blue"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    }
                />
                <AnalyticsCard
                    title="New Policies"
                    value={analytics.newPolicies}
                    subtitle="policies sold"
                    color="purple"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                />
                <AnalyticsCard
                    title="Average Premium"
                    value={`$${averagePremium.toFixed(2)}`}
                    subtitle="per customer"
                    color="orange"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                />
            </div>

            <h3 className="text-xl font-bold text-brand-text-primary mb-4">Key Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <AnalyticsCard
                    title="Total Premium Value"
                    value={`$${totalPremiumValue.toFixed(2)}`}
                    subtitle="monthly recurring"
                    color="green"
                />
                <AnalyticsCard
                    title="Outstanding Balance"
                    value={`$${analytics.outstandingBalance.toFixed(2)}`}
                    subtitle="to be collected"
                    color="red"
                />
                <AnalyticsCard
                    title="Conversion Rate"
                    value={`${conversionRate.toFixed(1)}%`}
                    subtitle="policy approval rate"
                    color="blue"
                />
                <AnalyticsCard
                    title="Active Customers"
                    value={analytics.activeCustomers}
                    subtitle={`${analytics.overdueCustomers} overdue`}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card title="Package Distribution">
                    <div className="space-y-4">
                        {Object.entries(packageBreakdown).map(([pkg, data]) => {
                            const total = Object.values(packageBreakdown).reduce((sum, d) => sum + d.count, 0);
                            const percentage = total > 0 ? (data.count / total) * 100 : 0;

                            const colors: Record<string, string> = {
                                Bronze: 'bg-orange-400',
                                Silver: 'bg-gray-400',
                                Gold: 'bg-yellow-400',
                                Platinum: 'bg-blue-400',
                            };

                            return (
                                <div key={pkg}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded ${colors[pkg]}`}></div>
                                            <span className="font-semibold text-brand-text-primary">{pkg}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-brand-text-primary">{data.count}</span>
                                            <span className="text-xs text-brand-text-secondary ml-2">
                                                (${data.revenue.toFixed(2)}/mo)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${colors[pkg]}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <Card title="Revenue by Payment Method">
                    <div className="space-y-4">
                        {revenueByPaymentMethod.length > 0 ? (
                            revenueByPaymentMethod.map(([method, revenue]) => {
                                const total = revenueByPaymentMethod.reduce((sum, [, rev]) => sum + rev, 0);
                                const percentage = total > 0 ? (revenue / total) * 100 : 0;

                                return (
                                    <div key={method}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-brand-text-primary">{method}</span>
                                            <div className="text-right">
                                                <span className="font-bold text-green-600">${revenue.toFixed(2)}</span>
                                                <span className="text-xs text-brand-text-secondary ml-2">
                                                    ({percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-green-500"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-brand-text-secondary text-center py-4">No payment data available</p>
                        )}
                    </div>
                </Card>
            </div>

            <Card title="6-Month Trend" className="mb-8">
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-semibold text-brand-text-secondary mb-3">Revenue Trend</h4>
                        <div className="flex items-end justify-between gap-2 h-48">
                            {monthlyTrend.map((month, index) => {
                                const maxRevenue = Math.max(...monthlyTrend.map(m => m.revenue));
                                const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;

                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div className="w-full flex items-end justify-center h-40">
                                            <div
                                                className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                                                style={{ height: `${height}%`, minHeight: height > 0 ? '8px' : '0' }}
                                                title={`$${month.revenue.toFixed(2)}`}
                                            ></div>
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className="text-xs font-semibold text-brand-text-primary">{month.month}</p>
                                            <p className="text-xs text-brand-text-secondary">${month.revenue.toFixed(0)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-brand-text-secondary mb-3">New Customers Trend</h4>
                        <div className="flex items-end justify-between gap-2 h-32">
                            {monthlyTrend.map((month, index) => {
                                const maxCustomers = Math.max(...monthlyTrend.map(m => m.customers));
                                const height = maxCustomers > 0 ? (month.customers / maxCustomers) * 100 : 0;

                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div className="w-full flex items-end justify-center h-24">
                                            <div
                                                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                                                style={{ height: `${height}%`, minHeight: height > 0 ? '8px' : '0' }}
                                                title={`${month.customers} customers`}
                                            ></div>
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className="text-xs font-semibold text-brand-text-primary">{month.month}</p>
                                            <p className="text-xs text-brand-text-secondary">{month.customers}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Agent Performance Breakdown">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Agent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Customers</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">New ({selectedPeriod})</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">New Policies</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Revenue</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Premium Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {agentPerformance.map((item, index) => (
                                <tr key={item.agent.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                                        }`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">
                                        {item.agent.firstName} {item.agent.surname}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                        {item.customerCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                        <span className="font-semibold text-blue-600">+{item.newCustomers}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                        <span className="font-semibold text-purple-600">{item.newPolicies}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                        ${item.revenue.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-text-primary">
                                        ${item.totalPremiumValue.toFixed(2)}/mo
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="text-xs">
                                            <span className="text-green-600 font-semibold">{item.activeCustomers} active</span>
                                            {item.overdueCustomers > 0 && (
                                                <span className="text-orange-600 font-semibold ml-2">{item.overdueCustomers} overdue</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminSales;
