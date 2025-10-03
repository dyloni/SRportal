import React from 'react';
import { Customer } from '../../types';
import Button from '../ui/Button';

interface CustomerDetailsModalProps {
    customer: Customer;
    onClose: () => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ customer, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                {/* FIX: Use firstName and surname for customer's full name. */}
                <h3 className="text-lg font-medium text-gray-900 mb-4">{`${customer.firstName} ${customer.surname}`}</h3>
                {/* FIX: Use firstName and surname for customer's full name. */}
                <p>Details for {`${customer.firstName} ${customer.surname}`} go here.</p>
                <div className="flex justify-end pt-4">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsModal;
