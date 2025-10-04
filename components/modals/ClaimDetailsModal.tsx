import React, { useState } from 'react';
import { Claim, ClaimStatus } from '../../types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { supabase } from '../../utils/supabase';

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`} />
);

interface ClaimDetailsModalProps {
    claim: Claim;
    onClose: () => void;
    onUpdate: () => void;
    isAdmin: boolean;
}

const ClaimDetailsModal: React.FC<ClaimDetailsModalProps> = ({ claim, onClose, onUpdate, isAdmin }) => {
    const [notes, setNotes] = useState(claim.notes || '');
    const [updating, setUpdating] = useState(false);

    const getStatusColor = (status: ClaimStatus): 'blue' | 'green' | 'red' | 'gray' => {
        switch (status) {
            case ClaimStatus.PENDING: return 'blue';
            case ClaimStatus.APPROVED: return 'green';
            case ClaimStatus.REJECTED: return 'red';
            case ClaimStatus.PAID: return 'gray';
            default: return 'blue';
        }
    };

    const handleStatusUpdate = async (newStatus: ClaimStatus) => {
        if (!confirm(`Are you sure you want to mark this claim as ${newStatus}?`)) return;

        setUpdating(true);
        try {
            const updateData: any = {
                status: newStatus,
                notes,
                updated_at: new Date().toISOString(),
            };

            if (newStatus === ClaimStatus.APPROVED && !claim.approved_date) {
                updateData.approved_date = new Date().toISOString().split('T')[0];
            }

            if (newStatus === ClaimStatus.PAID && !claim.paid_date) {
                updateData.paid_date = new Date().toISOString().split('T')[0];
            }

            const { error } = await supabase
                .from('claims')
                .update(updateData)
                .eq('id', claim.id);

            if (error) throw error;

            alert(`Claim ${newStatus.toLowerCase()} successfully!`);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error updating claim:', error);
            alert('Error updating claim. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleNotesUpdate = async () => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('claims')
                .update({
                    notes,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', claim.id);

            if (error) throw error;

            alert('Notes updated successfully!');
            onUpdate();
        } catch (error) {
            console.error('Error updating notes:', error);
            alert('Error updating notes. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-brand-surface rounded-2xl shadow-xl p-6 w-full max-w-3xl my-8">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-bold text-brand-text-primary">Claim Details #{claim.id}</h3>
                    <Badge color={getStatusColor(claim.status)}>{claim.status}</Badge>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-semibold text-brand-text-secondary mb-3">Policy Information</h4>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-brand-text-secondary">Policy Number:</span>
                                    <div className="font-semibold text-brand-text-primary">{claim.policy_number}</div>
                                </div>
                                <div>
                                    <span className="text-sm text-brand-text-secondary">Customer:</span>
                                    <div className="font-semibold text-brand-text-primary">{claim.customer_name}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-brand-text-secondary mb-3">Deceased Information</h4>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-brand-text-secondary">Name:</span>
                                    <div className="font-semibold text-brand-text-primary">{claim.deceased_name}</div>
                                </div>
                                <div>
                                    <span className="text-sm text-brand-text-secondary">Date of Death:</span>
                                    <div className="font-semibold text-brand-text-primary">{claim.date_of_death}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-700 mb-1">Claim Amount</div>
                        <div className="text-3xl font-bold text-green-700">
                            ${Number(claim.claim_amount).toFixed(2)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-semibold text-brand-text-secondary mb-3">Filing Information</h4>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-brand-text-secondary">Filed By:</span>
                                    <div className="font-semibold text-brand-text-primary">{claim.filed_by_name}</div>
                                </div>
                                <div>
                                    <span className="text-sm text-brand-text-secondary">Filed Date:</span>
                                    <div className="font-semibold text-brand-text-primary">{claim.filed_date}</div>
                                </div>
                                {claim.death_certificate_filename && (
                                    <div>
                                        <span className="text-sm text-brand-text-secondary">Death Certificate:</span>
                                        <div className="font-semibold text-brand-text-primary">{claim.death_certificate_filename}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-brand-text-secondary mb-3">Status Timeline</h4>
                            <div className="space-y-2">
                                {claim.approved_date && (
                                    <div>
                                        <span className="text-sm text-brand-text-secondary">Approved:</span>
                                        <div className="font-semibold text-green-600">{claim.approved_date}</div>
                                    </div>
                                )}
                                {claim.paid_date && (
                                    <div>
                                        <span className="text-sm text-brand-text-secondary">Paid:</span>
                                        <div className="font-semibold text-gray-600">{claim.paid_date}</div>
                                    </div>
                                )}
                                {!claim.approved_date && !claim.paid_date && (
                                    <div className="text-sm text-brand-text-secondary italic">No status updates yet</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-base font-semibold text-brand-text-secondary mb-2">Notes</label>
                        <FormTextarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={4}
                            placeholder="Add notes about this claim..."
                            disabled={!isAdmin && claim.status !== ClaimStatus.PENDING}
                        />
                        {(notes !== claim.notes) && (
                            <button
                                onClick={handleNotesUpdate}
                                disabled={updating}
                                className="mt-2 text-sm text-brand-pink hover:text-brand-light-pink font-medium"
                            >
                                Save Notes
                            </button>
                        )}
                    </div>

                    {isAdmin && claim.status === ClaimStatus.PENDING && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-brand-border">
                            <h4 className="text-sm font-semibold text-brand-text-secondary mb-3">Admin Actions</h4>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    onClick={() => handleStatusUpdate(ClaimStatus.APPROVED)}
                                    disabled={updating}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Approve Claim
                                </Button>
                                <Button
                                    onClick={() => handleStatusUpdate(ClaimStatus.REJECTED)}
                                    disabled={updating}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Reject Claim
                                </Button>
                            </div>
                        </div>
                    )}

                    {isAdmin && claim.status === ClaimStatus.APPROVED && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-brand-border">
                            <h4 className="text-sm font-semibold text-brand-text-secondary mb-3">Payment Action</h4>
                            <Button
                                onClick={() => handleStatusUpdate(ClaimStatus.PAID)}
                                disabled={updating}
                                className="bg-gray-600 hover:bg-gray-700"
                            >
                                Mark as Paid
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 mt-6 border-t border-brand-border">
                    <Button variant="secondary" onClick={onClose} disabled={updating}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ClaimDetailsModal;
