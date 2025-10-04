import React, { useState, useMemo } from 'react';
import { Customer, ClaimStatus } from '../../types';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`} />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`}>
        {props.children}
    </select>
);

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`} />
);

interface FileClaimModalProps {
    customers: Customer[];
    onClose: () => void;
    onClaimFiled: () => void;
}

const getClaimAmount = (funeralPackage: string): number => {
    switch (funeralPackage) {
        case 'Standard Funeral Plan': return 5000;
        case 'Premium Funeral Plan': return 10000;
        case 'Platinum Funeral Plan': return 15000;
        case 'Muslim Standard Plan': return 5000;
        case 'Alkaane Plan': return 8000;
        default: return 5000;
    }
};

const FileClaimModal: React.FC<FileClaimModalProps> = ({ customers, onClose, onClaimFiled }) => {
    const { user } = useAuth();
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [deceasedParticipantId, setDeceasedParticipantId] = useState('');
    const [dateOfDeath, setDateOfDeath] = useState('');
    const [deathCertificateFilename, setDeathCertificateFilename] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const selectedCustomer = useMemo(() => {
        return customers.find(c => c.id.toString() === selectedCustomerId);
    }, [selectedCustomerId, customers]);

    const selectedParticipant = useMemo(() => {
        if (!selectedCustomer || !deceasedParticipantId) return null;
        return selectedCustomer.participants.find(p => p.id.toString() === deceasedParticipantId);
    }, [selectedCustomer, deceasedParticipantId]);

    const claimAmount = useMemo(() => {
        if (!selectedCustomer) return 0;
        return getClaimAmount(selectedCustomer.funeralPackage);
    }, [selectedCustomer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedCustomer || !selectedParticipant) return;

        setSubmitting(true);

        try {
            const { data: maxIdData } = await supabase
                .from('claims')
                .select('id')
                .order('id', { ascending: false })
                .limit(1)
                .maybeSingle();

            const nextId = maxIdData ? maxIdData.id + 1 : 1;

            const { error } = await supabase
                .from('claims')
                .insert({
                    id: nextId,
                    customer_id: selectedCustomer.id,
                    policy_number: selectedCustomer.policyNumber,
                    customer_name: `${selectedCustomer.firstName} ${selectedCustomer.surname}`,
                    deceased_name: `${selectedParticipant.firstName} ${selectedParticipant.surname}`,
                    deceased_participant_id: selectedParticipant.id,
                    date_of_death: dateOfDeath,
                    claim_amount: claimAmount,
                    status: ClaimStatus.PENDING,
                    filed_by: user.id.toString(),
                    filed_by_name: `${user.firstName} ${user.surname}`,
                    filed_date: new Date().toISOString().split('T')[0],
                    notes: notes || null,
                    death_certificate_filename: deathCertificateFilename || null,
                });

            if (error) throw error;

            alert('Claim filed successfully!');
            onClaimFiled();
        } catch (error) {
            console.error('Error filing claim:', error);
            alert('Error filing claim. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4 overflow-y-auto">
            <form onSubmit={handleSubmit} className="bg-brand-surface rounded-2xl shadow-xl p-6 w-full max-w-2xl my-8">
                <h3 className="text-2xl font-bold text-brand-text-primary mb-6">File New Claim</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-base font-semibold text-brand-text-secondary mb-2">Select Customer/Policy</label>
                        <FormSelect
                            value={selectedCustomerId}
                            onChange={e => {
                                setSelectedCustomerId(e.target.value);
                                setDeceasedParticipantId('');
                            }}
                            required
                        >
                            <option value="">-- Select Customer --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.policyNumber} - {c.firstName} {c.surname}
                                </option>
                            ))}
                        </FormSelect>
                    </div>

                    {selectedCustomer && (
                        <>
                            <div>
                                <label className="block text-base font-semibold text-brand-text-secondary mb-2">Deceased Participant</label>
                                <FormSelect
                                    value={deceasedParticipantId}
                                    onChange={e => setDeceasedParticipantId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Participant --</option>
                                    {selectedCustomer.participants.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.firstName} {p.surname} ({p.relationship})
                                        </option>
                                    ))}
                                </FormSelect>
                            </div>

                            <div>
                                <label className="block text-base font-semibold text-brand-text-secondary mb-2">Date of Death</label>
                                <FormInput
                                    type="date"
                                    value={dateOfDeath}
                                    onChange={e => setDateOfDeath(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-base font-semibold text-brand-text-secondary mb-2">Death Certificate Filename/Reference</label>
                                <FormInput
                                    type="text"
                                    value={deathCertificateFilename}
                                    onChange={e => setDeathCertificateFilename(e.target.value)}
                                    placeholder="e.g., death_cert_12345.pdf"
                                />
                            </div>

                            <div>
                                <label className="block text-base font-semibold text-brand-text-secondary mb-2">Notes</label>
                                <FormTextarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Any additional information..."
                                />
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-brand-border">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-brand-text-secondary">Policy Number:</div>
                                        <div className="font-semibold text-brand-text-primary">{selectedCustomer.policyNumber}</div>
                                    </div>
                                    <div>
                                        <div className="text-brand-text-secondary">Funeral Package:</div>
                                        <div className="font-semibold text-brand-text-primary">{selectedCustomer.funeralPackage}</div>
                                    </div>
                                    <div>
                                        <div className="text-brand-text-secondary">Claim Amount:</div>
                                        <div className="font-bold text-green-600 text-lg">${claimAmount.toFixed(2)}</div>
                                    </div>
                                    {selectedParticipant && (
                                        <div>
                                            <div className="text-brand-text-secondary">Deceased:</div>
                                            <div className="font-semibold text-brand-text-primary">
                                                {selectedParticipant.firstName} {selectedParticipant.surname}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end pt-4 mt-6 space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                    <Button variant="secondary" type="button" onClick={onClose} className="w-full sm:w-auto" disabled={submitting}>
                        Cancel
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto" disabled={submitting || !selectedCustomer || !selectedParticipant}>
                        {submitting ? 'Filing Claim...' : 'File Claim'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default FileClaimModal;
