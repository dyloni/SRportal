import { Customer, PolicyStatus, PaymentMethod } from '../types';
import { supabase } from './supabase';

export interface PaymentHistoryItem {
    date: string;
    description: string;
    amount: number | null;
    status: 'Paid' | 'Pending' | 'Overdue';
    paymentMethod?: PaymentMethod;
    receiptFilename?: string;
}

export const getPaymentHistory = async (customer: Customer): Promise<PaymentHistoryItem[]> => {
    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('payment_date', { ascending: false });

    if (!payments) return [];

    return payments.map(payment => ({
        date: payment.payment_date,
        description: `Payment for ${payment.payment_period}`,
        amount: parseFloat(payment.payment_amount),
        status: 'Paid' as const,
        paymentMethod: payment.payment_method as PaymentMethod,
        receiptFilename: payment.receipt_filename,
    }));
};

export const getEffectivePolicyStatus = async (customer: Customer): Promise<PolicyStatus> => {
    if (customer.status === PolicyStatus.CANCELLED) {
        return customer.status;
    }

    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customer.id);

    const paymentCount = payments?.length || 0;
    const policyStartDate = new Date(customer.inceptionDate);
    const today = new Date();
    const monthsSinceStart = ((today.getFullYear() - policyStartDate.getFullYear()) * 12) + (today.getMonth() - policyStartDate.getMonth()) + 1;
    const monthsDue = monthsSinceStart - paymentCount;

    if (monthsDue >= 2) {
        return PolicyStatus.INACTIVE;
    }

    if (monthsDue === 1) {
        return PolicyStatus.OVERDUE;
    }

    if (customer.status === PolicyStatus.INACTIVE) {
        return PolicyStatus.INACTIVE;
    }

    return PolicyStatus.ACTIVE;
};
