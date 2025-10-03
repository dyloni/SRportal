import React, { useState } from 'react';
import { Customer, RequestType, MakePaymentRequest, RequestStatus, PaymentMethod } from '../../types';
import Button from '../ui/Button';
import { getNextPaymentPeriod, calculatePremium } from '../../utils/policyHelpers';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`} />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`}>
        {props.children}
    </select>
);

interface MakePaymentModalProps {
    customer: Customer;
    onClose: () => void;
}

const MakePaymentModal: React.FC<MakePaymentModalProps> = ({ customer, onClose }) => {
    const { user } = useAuth();
    const { state, dispatchWithOffline } = useData();
    const nextPaymentPeriod = getNextPaymentPeriod(customer, state.requests);
    
    const [paymentAmount, setPaymentAmount] = useState(calculatePremium(customer).toFixed(2));
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [receiptFilename, setReceiptFilename] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        const newPayment: MakePaymentRequest = {
            id: Date.now(),
            agentId: user.id,
            customerId: customer.id,
            requestType: RequestType.MAKE_PAYMENT,
            status: RequestStatus.PENDING,
            createdAt: new Date().toISOString(),
            paymentAmount: parseFloat(paymentAmount),
            paymentType: 'Renewal',
            paymentMethod: paymentMethod,
            paymentPeriod: nextPaymentPeriod,
            receiptFilename: receiptFilename,
        };
        
        dispatchWithOffline({ type: 'ADD_REQUEST', payload: newPayment });
        alert('Payment request submitted successfully!');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-brand-surface rounded-2xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-2xl font-bold text-brand-text-primary mb-4">Make Payment for {`${customer.firstName} ${customer.surname}`}</h3>
                <p className="text-base text-brand-text-secondary mb-6">Next payment is for period: <strong>{nextPaymentPeriod}</strong></p>
                <div className="space-y-4">
                     <div>
                        <label className="block text-base font-semibold text-brand-text-secondary mb-2">Payment Amount</label>
                        <FormInput type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required />
                     </div>
                      <div>
                        <label className="block text-base font-semibold text-brand-text-secondary mb-2">Payment Method</label>
                        <FormSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
                            {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </FormSelect>
                     </div>
                     <div>
                        <label className="block text-base font-semibold text-brand-text-secondary mb-2">Receipt Reference/Filename</label>
                        <FormInput type="text" value={receiptFilename} onChange={e => setReceiptFilename(e.target.value)} required />
                     </div>
                </div>
                 <div className="flex flex-col-reverse sm:flex-row sm:justify-end pt-4 mt-6 space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                    <Button variant="secondary" type="button" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
                    <Button type="submit" className="w-full sm:w-auto">Submit Payment Request</Button>
                </div>
            </form>
        </div>
    );
};

export default MakePaymentModal;