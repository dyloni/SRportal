import { Customer, AppRequest, RequestType, RequestStatus, Payment } from '../types';
import { supabase } from './supabase';

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

export const calculateAnalytics = async (
    customers: Customer[],
    requests: AppRequest[],
    payments: Payment[],
    period: TimePeriod,
    agentId?: number
): Promise<AnalyticsData> => {
    const filteredCustomers = agentId
        ? customers.filter(c => c.assignedAgentId === agentId)
        : customers;

    const filteredRequests = agentId
        ? requests.filter(r => r.agentId === agentId)
        : requests;

    const filteredPayments = agentId
        ? payments.filter(p => {
            const customer = customers.find(c => c.id === p.customer_id);
            return customer && customer.assignedAgentId === agentId;
        })
        : payments;

    const newCustomers = filteredCustomers.filter(c => isWithinPeriod(c.dateCreated, period)).length;

    const newPolicyRequests = filteredRequests.filter(
        r => r.requestType === RequestType.NEW_POLICY &&
             r.status === RequestStatus.APPROVED &&
             isWithinPeriod(r.createdAt, period)
    );
    const newPolicies = newPolicyRequests.length;

    const periodPayments = filteredPayments.filter(p => isWithinPeriod(p.payment_date, period));

    const totalRevenue = periodPayments.reduce((sum, payment) => {
        return sum + parseFloat(payment.payment_amount);
    }, 0);

    const paymentsReceived = periodPayments.length;

    let totalOutstandingBalance = 0;
    let activeCustomers = 0;
    let overdueCustomers = 0;
    let inactiveCustomers = 0;

    for (const customer of filteredCustomers) {
        const customerPayments = payments.filter(p => p.customer_id === customer.id);
        const paymentCount = customerPayments.length;
        const policyStartDate = new Date(customer.inceptionDate);
        const today = new Date();
        const monthsSinceStart = ((today.getFullYear() - policyStartDate.getFullYear()) * 12) + (today.getMonth() - policyStartDate.getMonth()) + 1;
        const monthsDue = monthsSinceStart - paymentCount;
        const outstandingBalance = monthsDue > 0 ? monthsDue * customer.totalPremium : 0;
        totalOutstandingBalance += outstandingBalance;

        if (customer.status === 'Cancelled') {
            continue;
        }

        if (monthsDue >= 2) {
            inactiveCustomers++;
        } else if (monthsDue === 1) {
            overdueCustomers++;
        } else {
            activeCustomers++;
        }
    }

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
