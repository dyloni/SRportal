import React, { useState, useEffect } from 'react';
import { Customer, Payment } from '../../types';
import Button from '../ui/Button';
import { supabase } from '../../utils/supabase';
import { formatPolicyNumber } from '../../utils/policyHelpers';

interface CustomerDetailsModalProps {
    customer: Customer;
    onClose: () => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ customer, onClose }) => {
    const [latestPayment, setLatestPayment] = useState<Payment | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPayments = async () => {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('customer_id', customer.id)
                .order('payment_date', { ascending: false });

            if (!error && data) {
                setPaymentHistory(data);
                setLatestPayment(data[0] || null);
            }
            setLoading(false);
        };

        loadPayments();
    }, [customer.id]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{`${customer.firstName} ${customer.surname}`}</h3>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-lg font-semibold mb-2">Policy Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <p className="text-gray-600">Policy Number:</p>
                            <p className="font-medium">{formatPolicyNumber(customer.policyNumber)}</p>
                            <p className="text-gray-600">Status:</p>
                            <p className="font-medium">{customer.status}</p>
                            <p className="text-gray-600">Premium:</p>
                            <p className="font-medium">${customer.totalPremium.toFixed(2)}/month</p>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-gray-500">Loading payment information...</p>
                    ) : (
                        <>
                            {latestPayment && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="text-lg font-semibold mb-2 text-green-800">Latest Payment</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <p className="text-gray-600">Amount:</p>
                                        <p className="font-medium">${parseFloat(latestPayment.payment_amount).toFixed(2)}</p>
                                        <p className="text-gray-600">Date:</p>
                                        <p className="font-medium">{new Date(latestPayment.payment_date).toLocaleDateString()}</p>
                                        <p className="text-gray-600">Period:</p>
                                        <p className="font-medium">{latestPayment.payment_period}</p>
                                        <p className="text-gray-600">Method:</p>
                                        <p className="font-medium">{latestPayment.payment_method}</p>
                                    </div>
                                </div>
                            )}

                            {paymentHistory.length > 1 && (
                                <div>
                                    <h4 className="text-lg font-semibold mb-2">Payment History</h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {paymentHistory.slice(1, 6).map((payment) => (
                                            <div key={payment.id} className="border border-gray-200 rounded p-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">${parseFloat(payment.payment_amount).toFixed(2)}</span>
                                                    <span className="text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-gray-600">{payment.payment_period}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {paymentHistory.length > 6 && (
                                        <p className="text-sm text-gray-500 mt-2">+ {paymentHistory.length - 6} more payments</p>
                                    )}
                                </div>
                            )}

                            {paymentHistory.length === 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-yellow-800">No payment history available</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex justify-end pt-4 mt-4 border-t">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsModal;
