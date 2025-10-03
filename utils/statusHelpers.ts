// FIX: Moved status-related helper functions here from other files to centralize logic.
// FIX: Imported the AppRequest union type.
import { Customer, AppRequest, PolicyStatus, RequestType, MakePaymentRequest, RequestStatus, PaymentMethod } from '../types';
import { calculateOutstandingBalance } from './policyHelpers';

export interface PaymentHistoryItem {
    date: string;
    description: string;
    amount: number | null;
    status: 'Paid' | 'Pending' | 'Overdue';
    paymentMethod?: PaymentMethod;
    receiptFilename?: string;
}

export const getPaymentHistory = (customer: Customer, requests: AppRequest[]): PaymentHistoryItem[] => {
    const history: PaymentHistoryItem[] = [];

    // Find all payment-related requests for this customer
    const paymentRequests = requests.filter(
        (req): req is MakePaymentRequest => 'customerId' in req && req.customerId === customer.id && req.requestType === RequestType.MAKE_PAYMENT
    );
    
    // Add payments to history
    paymentRequests.forEach(req => {
        history.push({
            date: req.createdAt,
            description: req.paymentType === 'Initial' ? 'Initial Policy Payment' : `Payment for ${req.paymentPeriod}`,
            amount: req.paymentAmount,
            status: req.status === RequestStatus.APPROVED ? 'Paid' : 'Pending',
            paymentMethod: req.paymentMethod,
            receiptFilename: req.receiptFilename
        });
    });

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getEffectivePolicyStatus = (customer: Customer, requests: AppRequest[]): PolicyStatus => {
    // These are manual, terminal states. Don't override them.
    if (customer.status === PolicyStatus.CANCELLED) {
        return customer.status;
    }

    const { monthsDue } = calculateOutstandingBalance(customer, requests);

    if (monthsDue >= 2) {
        return PolicyStatus.INACTIVE; // Deactivated after 2 months
    }
    
    if (monthsDue === 1) {
        return PolicyStatus.OVERDUE;
    }

    // If no months are due, it should be active, unless an admin manually set it to inactive.
    if (customer.status === PolicyStatus.INACTIVE) {
        return PolicyStatus.INACTIVE;
    }

    return PolicyStatus.ACTIVE;
};