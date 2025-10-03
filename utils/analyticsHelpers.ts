import { Customer, AppRequest, RequestType, RequestStatus } from '../types';
import { calculateOutstandingBalance } from './policyHelpers';

export type TimePeriod = 'daily' | 'weekly' | 'monthly';

export interface AnalyticsData {
    newCustomers: number;
    newPolicies: number;
    totalRevenue: number;
    paymentsReceived: number;
    outstandingBalance: number;
    activeCustomers: number;
    overdueCustomers: number;
    inactiveCustomers: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
}

const getDateRangeForPeriod = (period: TimePeriod): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start: Date;

    switch (period) {
        case 'daily':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            break;
        case 'weekly':
            const dayOfWeek = now.getDay();
            start = new Date(now);
            start.setDate(now.getDate() - dayOfWeek);
            start.setHours(0, 0, 0, 0);
            break;
        case 'monthly':
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            break;
    }

    return { start, end };
};

const isWithinPeriod = (date: string, period: TimePeriod): boolean => {
    const { start, end } = getDateRangeForPeriod(period);
    const checkDate = new Date(date);
    return checkDate >= start && checkDate <= end;
};

export const calculateAnalytics = (
    customers: Customer[],
    requests: AppRequest[],
    period: TimePeriod,
    agentId?: number
): AnalyticsData => {
    const filteredCustomers = agentId
        ? customers.filter(c => c.assignedAgentId === agentId)
        : customers;

    const filteredRequests = agentId
        ? requests.filter(r => r.agentId === agentId)
        : requests;

    const newCustomers = filteredCustomers.filter(c => isWithinPeriod(c.dateCreated, period)).length;

    const newPolicyRequests = filteredRequests.filter(
        r => r.requestType === RequestType.NEW_POLICY &&
             r.status === RequestStatus.APPROVED &&
             isWithinPeriod(r.createdAt, period)
    );
    const newPolicies = newPolicyRequests.length;

    const paymentRequests = filteredRequests.filter(
        r => r.requestType === RequestType.MAKE_PAYMENT &&
             r.status === RequestStatus.APPROVED &&
             isWithinPeriod(r.createdAt, period)
    );

    const totalRevenue = paymentRequests.reduce((sum, req) => {
        if (req.requestType === RequestType.MAKE_PAYMENT) {
            return sum + req.paymentAmount;
        }
        return sum;
    }, 0);

    const paymentsReceived = paymentRequests.length;

    let totalOutstandingBalance = 0;
    let activeCustomers = 0;
    let overdueCustomers = 0;
    let inactiveCustomers = 0;

    filteredCustomers.forEach(customer => {
        const { balance, monthsDue } = calculateOutstandingBalance(customer, requests);
        totalOutstandingBalance += balance;

        if (customer.status === 'Cancelled') {
            return;
        }

        if (monthsDue >= 2) {
            inactiveCustomers++;
        } else if (monthsDue === 1) {
            overdueCustomers++;
        } else {
            activeCustomers++;
        }
    });

    const requestsInPeriod = filteredRequests.filter(r => isWithinPeriod(r.createdAt, period));
    const approvedRequests = requestsInPeriod.filter(r => r.status === RequestStatus.APPROVED).length;
    const pendingRequests = requestsInPeriod.filter(r => r.status === RequestStatus.PENDING).length;
    const rejectedRequests = requestsInPeriod.filter(r => r.status === RequestStatus.REJECTED).length;

    return {
        newCustomers,
        newPolicies,
        totalRevenue,
        paymentsReceived,
        outstandingBalance: totalOutstandingBalance,
        activeCustomers,
        overdueCustomers,
        inactiveCustomers,
        approvedRequests,
        pendingRequests,
        rejectedRequests,
    };
};

export const getPeriodLabel = (period: TimePeriod): string => {
    const { start, end } = getDateRangeForPeriod(period);

    switch (period) {
        case 'daily':
            return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        case 'weekly':
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        case 'monthly':
            return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
};
