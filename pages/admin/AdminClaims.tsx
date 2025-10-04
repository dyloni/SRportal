import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Claim, ClaimStatus } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FileClaimModal from '../../components/modals/FileClaimModal';

const AdminClaims: React.FC = () => {
    const { state, dispatch } = useData();
    const { user } = useAuth();
    const [isFileClaimModalOpen, setIsFileClaimModalOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'All'>('All');

    const filteredClaims = useMemo(() => {
        if (statusFilter === 'All') return state.claims;
        return state.claims.filter(c => c.status === statusFilter);
    }, [state.claims, statusFilter]);

    const handleUpdateClaimStatus = (claim: Claim, newStatus: ClaimStatus) => {
        const updatedClaim: Claim = {
            ...claim,
            status: newStatus,
            approvedDate: newStatus === ClaimStatus.APPROVED ? new Date().toISOString() : claim.approvedDate,
            paidDate: newStatus === ClaimStatus.PAID ? new Date().toISOString() : claim.paidDate,
        };
        dispatch({ type: 'UPDATE_CLAIM', payload: updatedClaim });
    };

    const getStatusBadgeColor = (status: ClaimStatus) => {
        switch (status) {
            case ClaimStatus.PENDING:
                return 'bg-yellow-100 text-yellow-800';
            case ClaimStatus.APPROVED:
                return 'bg-blue-100 text-blue-800';
            case ClaimStatus.PAID:
                return 'bg-green-100 text-green-800';
            case ClaimStatus.REJECTED:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-brand-text-primary">Claims Management</h2>
                <Button onClick={() => setIsFileClaimModalOpen(true)}>
                    File New Claim
                </Button>
            </div>

            <Card className="mb-6">
                <div className="flex gap-2 flex-wrap">
                    {(['All', ClaimStatus.PENDING, ClaimStatus.APPROVED, ClaimStatus.PAID, ClaimStatus.REJECTED] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                statusFilter === status
                                    ? 'bg-brand-pink text-white'
                                    : 'bg-gray-100 text-brand-text-secondary hover:bg-gray-200'
                            }`}
                        >
                            {status} ({status === 'All' ? state.claims.length : state.claims.filter(c => c.status === status).length})
                        </button>
                    ))}
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-brand-border">
                                <th className="text-left p-4 font-semibold text-brand-text-primary">Claim ID</th>
                                <th className="text-left p-4 font-semibold text-brand-text-primary">Policy Number</th>
                                <th className="text-left p-4 font-semibold text-brand-text-primary">Customer</th>
                                <th className="text-left p-4 font-semibold text-brand-text-primary">Deceased</th>
                                <th className="text-left p-4 font-semibold text-brand-text-primary">Date of Death</th>
                                <th className="text-left p-4 font-semibold text-brand-text-primary">Amount</th>
                                <th className="text-left p-4 font-semibold text-brand-text-primary">Status</th>
                                <th className="text-left p-4 font-semibold text-brand-text-primary">Filed By</th>
                                <th className="text-left p-4 font-semibold text-brand-text-primary">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClaims.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center p-8 text-brand-text-secondary">
                                        No claims found
                                    </td>
                                </tr>
                            ) : (
                                filteredClaims.map(claim => (
                                    <tr key={claim.id} className="border-b border-brand-border hover:bg-gray-50">
                                        <td className="p-4">#{claim.id}</td>
                                        <td className="p-4">{claim.policyNumber}</td>
                                        <td className="p-4">{claim.customerName}</td>
                                        <td className="p-4">{claim.deceasedName}</td>
                                        <td className="p-4">{new Date(claim.dateOfDeath).toLocaleDateString()}</td>
                                        <td className="p-4">${claim.claimAmount.toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(claim.status)}`}>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td className="p-4">{claim.filedByName}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {claim.status === ClaimStatus.PENDING && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleUpdateClaimStatus(claim, ClaimStatus.APPROVED)}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleUpdateClaimStatus(claim, ClaimStatus.REJECTED)}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {claim.status === ClaimStatus.APPROVED && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateClaimStatus(claim, ClaimStatus.PAID)}
                                                    >
                                                        Mark as Paid
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isFileClaimModalOpen && (
                <FileClaimModal
                    onClose={() => setIsFileClaimModalOpen(false)}
                    onSubmit={() => setIsFileClaimModalOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminClaims;
