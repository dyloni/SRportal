import React from 'react';
import { Customer } from '../../types';
import Button from '../ui/Button';

interface PolicyAdjustmentModalProps {
    customer: Customer;
    onClose: () => void;
}

const PolicyAdjustmentModal: React.FC<PolicyAdjustmentModalProps> = ({ customer, onClose }) => {
    // A full implementation would have a form here to adjust the policy
    // and use `dispatchWithOffline` to submit a request.
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                {/* FIX: Use firstName and surname for customer's full name. */}
                <h3 className="text-lg font-medium text-gray-900 mb-4">Adjust Policy for {`${customer.firstName} ${customer.surname}`}</h3>
                <p className="text-sm text-gray-600">Form for upgrading or downgrading a policy would go here.</p>
                <div className="flex justify-end pt-4 mt-4 space-x-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={onClose}>Submit Request</Button>
                </div>
            </div>
        </div>
    );
};

export default PolicyAdjustmentModal;
