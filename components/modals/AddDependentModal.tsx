import React, { useState } from 'react';
import { Customer, Participant, RequestType, RequestStatus, AddDependentRequestType } from '../../types';
import Button from '../ui/Button';
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

interface AddDependentModalProps {
    customer: Customer;
    onClose: () => void;
}

const AddDependentModal: React.FC<AddDependentModalProps> = ({ customer, onClose }) => {
    const { user } = useAuth();
    const { dispatchWithOffline } = useData();
    const [participant, setParticipant] = useState<Omit<Participant, 'id'>>({
        firstName: '',
        surname: '',
        relationship: 'Child',
        dateOfBirth: '',
        idNumber: '',
        gender: 'Male',
        phone: '',
        email: '',
        streetAddress: customer.streetAddress, // Pre-fill from policyholder
        town: customer.town,
        postalAddress: customer.postalAddress,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setParticipant({ ...participant, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        
        const newRequest: AddDependentRequestType = {
            id: Date.now(),
            agentId: user.id,
            customerId: customer.id,
            requestType: RequestType.ADD_DEPENDENT,
            status: RequestStatus.PENDING,
            createdAt: new Date().toISOString(),
            dependentData: participant,
        };

        dispatchWithOffline({ type: 'ADD_REQUEST', payload: newRequest });
        alert('Request to add dependent submitted for approval!');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-brand-surface rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold text-brand-text-primary mb-6">Add Participant to {`${customer.firstName} ${customer.surname}`}'s Policy</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-base font-semibold text-brand-text-secondary mb-2">First Name(s)</label>
                            <FormInput name="firstName" value={participant.firstName} onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="block text-base font-semibold text-brand-text-secondary mb-2">Surname</label>
                            <FormInput name="surname" value={participant.surname} onChange={handleChange} required />
                        </div>
                    </div>
                     <div>
                        <label className="block text-base font-semibold text-brand-text-secondary mb-2">Relationship</label>
                        <FormSelect name="relationship" value={participant.relationship} onChange={handleChange} required>
                            <option>Spouse</option>
                            <option>Child</option>
                            <option>Stepchild</option>
                            <option>Grandchild</option>
                            <option>Sibling</option>
                            <option>Grandparent</option>
                            <option>Other Dependent</option>
                        </FormSelect>
                    </div>
                     <div>
                        <label className="block text-base font-semibold text-brand-text-secondary mb-2">Date of Birth</label>
                        <FormInput name="dateOfBirth" type="date" value={participant.dateOfBirth} onChange={handleChange} required />
                    </div>
                    {['Child', 'Stepchild', 'Grandchild', 'Sibling'].includes(participant.relationship) && (
                        <div className="col-span-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="isStudent"
                                    checked={participant.isStudent || false}
                                    onChange={e => handleChange({ target: { name: 'isStudent', value: e.target.checked } } as any)}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm text-brand-text-secondary">Is currently a student (ages 19-23 require school ID)</span>
                            </label>
                        </div>
                    )}
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end pt-4 mt-6 space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                    <Button variant="secondary" type="button" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
                    <Button type="submit" className="w-full sm:w-auto">Submit Request</Button>
                </div>
            </form>
        </div>
    );
};

export default AddDependentModal;