import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useData } from '../../contexts/DataContext';
import { Customer, RequestType, MakePaymentRequest, RequestStatus, PaymentMethod } from '../../types';
import { calculatePremium, calculateOutstandingBalance, getNextPaymentPeriod } from '../../utils/policyHelpers';
import { useAuth } from '../../contexts/AuthContext';

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`} />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`}>
        {props.children}
    </select>
);


const PaymentPage: React.FC = () => {
    const { user } = useAuth();
    const { state, dispatchWithOffline } = useData();
    const navigate = useNavigate();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [receiptFilename, setReceiptFilename] = useState('');

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return [];
        const lowercasedTerm = searchTerm.toLowerCase();
        return state.customers.filter(c =>
            `${c.firstName} ${c.surname}`.toLowerCase().includes(lowercasedTerm) ||
            c.policyNumber.toLowerCase().includes(lowercasedTerm)
        );
    }, [searchTerm, state.customers]);

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        const premium = calculatePremium(customer);
        setPaymentAmount(premium.toFixed(2));
        setSearchTerm('');
    };
    
    const handleSubmitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !user) return;

        const newPaymentRequest: MakePaymentRequest = {
            id: Date.now(),
            agentId: user.id,
            customerId: selectedCustomer.id,
            requestType: RequestType.MAKE_PAYMENT,
            status: RequestStatus.PENDING,
            createdAt: new Date().toISOString(),
            paymentAmount: parseFloat(paymentAmount),
            paymentType: 'Renewal',
            paymentMethod: paymentMethod,
            paymentPeriod: getNextPaymentPeriod(selectedCustomer, state.requests),
            receiptFilename: receiptFilename,
        };

        dispatchWithOffline({ type: 'ADD_REQUEST', payload: newPaymentRequest });
        alert('Payment request submitted successfully!');
        navigate(`/requests`);
    };

    const balance = selectedCustomer ? calculateOutstandingBalance(selectedCustomer, state.requests) : null;
    
    return (
        <div>
            <h2 className="text-3xl font-extrabold text-brand-text-primary mb-6">Make a Payment</h2>
            <Card>
                {!selectedCustomer ? (
                    <div>
                        <h3 className="text-2xl font-bold text-brand-text-primary">Search for Customer</h3>
                        <p className="text-brand-text-secondary mb-4">Find a customer to record a new payment.</p>
                        <FormInput
                            type="text"
                            placeholder="Search by name or policy ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {filteredCustomers.length > 0 && (
                            <ul className="mt-2 border border-brand-border rounded-lg max-h-60 overflow-y-auto">
                                {filteredCustomers.map(c => (
                                    <li key={c.id} onClick={() => handleSelectCustomer(c)} className="p-4 hover:bg-brand-pink/10 cursor-pointer border-b border-brand-border last:border-b-0">
                                        {`${c.firstName} ${c.surname}`} (Policy: {c.policyNumber})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <div>
                         <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                            <h3 className="text-2xl font-bold text-brand-text-primary">Payment for: {`${selectedCustomer.firstName} ${selectedCustomer.surname}`}</h3>
                            <Button variant="secondary" onClick={() => setSelectedCustomer(null)} className="mt-2 sm:mt-0 w-full sm:w-auto">Change Customer</Button>
                         </div>
                         <div className="p-4 bg-gray-100 rounded-lg mb-6 space-y-2 text-center sm:text-left text-brand-text-secondary">
                            <p><strong>Policy Premium:</strong> ${calculatePremium(selectedCustomer).toFixed(2)} / month</p>
                            {balance && <p><strong>Outstanding Balance:</strong> ${balance.balance.toFixed(2)} ({balance.cappedMonths} months)</p>}
                            <p><strong>Next Payment Period:</strong> {getNextPaymentPeriod(selectedCustomer, state.requests)}</p>
                         </div>
                         <form onSubmit={handleSubmitPayment} className="space-y-4">
                             <div>
                                <label className="block text-base font-semibold text-brand-text-secondary mb-2">Payment Amount</label>
                                <FormInput type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
                             </div>
                             <div>
                                <label className="block text-base font-semibold text-brand-text-secondary mb-2">Payment Method</label>
                                <FormSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                </FormSelect>
                             </div>
                              <div>
                                <label className="block text-base font-semibold text-brand-text-secondary mb-2">Receipt Reference/Filename</label>
                                <FormInput type="text" value={receiptFilename} onChange={(e) => setReceiptFilename(e.target.value)} required />
                             </div>
                             <Button type="submit" className="w-full">Submit Payment Request</Button>
                         </form>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PaymentPage;