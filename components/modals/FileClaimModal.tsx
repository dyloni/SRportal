import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Claim, ClaimStatus, Customer, Participant } from '../../types';
import Button from '../ui/Button';

interface FileClaimModalProps {
    onClose: () => void;
    onSubmit: () => void;
}

const FileClaimModal: React.FC<FileClaimModalProps> = ({ onClose, onSubmit }) => {
    const { state, dispatch } = useData();
    const { user } = useAuth();

    const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
    const [selectedParticipantId, setSelectedParticipantId] = useState<number | ''>('');
    const [dateOfDeath, setDateOfDeath] = useState('');
    const [notes, setNotes] = useState('');

    const selectedCustomer = state.customers.find(c => c.id === selectedCustomerId);
    const participants = selectedCustomer?.participants || [];

    const calculateClaimAmount = (): number => {
        if (!selectedCustomer) return 0;

        const packageAmounts: Record<string, number> = {
            'Standard Funeral Plan': 2500,
            'Premium Funeral Plan': 5000,
            'Platinum Funeral Plan': 10000,
            'Muslim Standard Plan': 5000,
            'Alkaane Plan': 10000,
        };

        return packageAmounts[selectedCustomer.funeralPackage] || 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCustomer || !selectedParticipantId) return;

        const participant = participants.find(p => p.id === selectedParticipantId);
        if (!participant) return;

        const newClaim: Claim = {
            id: Date.now(),
            customerId: selectedCustomer.id,
            policyNumber: selectedCustomer.policyNumber,
            customerName: `${selectedCustomer.firstName} ${selectedCustomer.surname}`,
            deceasedName: `${participant.firstName} ${participant.surname}`,
            deceasedParticipantId: participant.id,
            dateOfDeath,
            claimAmount: calculateClaimAmount(),
            status: ClaimStatus.PENDING,
            filedBy: user?.type === 'admin' ? 'admin' : user?.id || 0,
            filedByName: user ? `${user.firstName} ${user.surname}` : 'Unknown',
            filedDate: new Date().toISOString(),
            notes,
        };

        dispatch({ type: 'ADD_CLAIM', payload: newClaim });
        onSubmit();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-brand-text-primary mb-6">File New Claim</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-primary mb-2">
                            Select Customer/Policy
                        </label>
                        <select
                            value={selectedCustomerId}
                            onChange={(e) => {
                                setSelectedCustomerId(Number(e.target.value));
                                setSelectedParticipantId('');
                            }}
                            className="w-full border border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-pink focus:border-transparent"
                            required
                        >
                            <option value="">-- Select Customer --</option>
                            {state.customers.map(customer => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.policyNumber} - {customer.firstName} {customer.surname}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedCustomer && (
                        <>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-brand-text-secondary mb-1">Policy Type</p>
                                <p className="font-semibold">{selectedCustomer.funeralPackage}</p>
                                <p className="text-sm text-brand-text-secondary mt-2 mb-1">Claim Amount</p>
                                <p className="font-semibold text-brand-pink">${calculateClaimAmount().toLocaleString()}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                                    Select Deceased Participant
                                </label>
                                <select
                                    value={selectedParticipantId}
                                    onChange={(e) => setSelectedParticipantId(Number(e.target.value))}
                                    className="w-full border border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-pink focus:border-transparent"
                                    required
                                >
                                    <option value="">-- Select Participant --</option>
                                    {participants.map(participant => (
                                        <option key={participant.id} value={participant.id}>
                                            {participant.firstName} {participant.surname} ({participant.relationship})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                                    Date of Death
                                </label>
                                <input
                                    type="date"
                                    value={dateOfDeath}
                                    onChange={(e) => setDateOfDeath(e.target.value)}
                                    className="w-full border border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-pink focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="w-full border border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-pink focus:border-transparent"
                                    placeholder="Additional information about the claim..."
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-4">
                        <Button type="submit" disabled={!selectedCustomerId || !selectedParticipantId || !dateOfDeath}>
                            File Claim
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FileClaimModal;
