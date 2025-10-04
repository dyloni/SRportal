import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Claim, ClaimStatus } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { supabase } from '../../utils/supabase';
import ClaimDetailsModal from '../../components/modals/ClaimDetailsModal';

const AdminClaims: React.FC = () => {
    const { state } = useData();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'All'>('All');
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

    useEffect(() => {
        loadClaims();
    }, []);

    const loadClaims = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('claims')
                .select('*')
                .order('filed_date', { ascending: false });

            if (error) throw error;
            setClaims(data || []);
        } catch (error) {
            console.error('Error loading claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClaims = useMemo(() => {
        let filtered = claims;

        if (statusFilter !== 'All') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        if (searchTerm) {
            const lowercased = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.policy_number.toLowerCase().includes(lowercased) ||
                c.customer_name.toLowerCase().includes(lowercased) ||
                c.deceased_name.toLowerCase().includes(lowercased) ||
                c.filed_by_name.toLowerCase().includes(lowercased)
            );
        }

        return filtered;
    }, [claims, statusFilter, searchTerm]);

    const claimStats = useMemo(() => {
        const pending = claims.filter(c => c.status === ClaimStatus.PENDING).length;
        const approved = claims.filter(c => c.status === ClaimStatus.APPROVED).length;
        const rejected = claims.filter(c => c.status === ClaimStatus.REJECTED).length;
        const paid = claims.filter(c => c.status === ClaimStatus.PAID).length;
        const totalAmount = claims
            .filter(c => c.status === ClaimStatus.PAID)
            .reduce((sum, c) => sum + Number(c.claim_amount), 0);

        return { pending, approved, rejected, paid, totalAmount };
    }, [claims]);

    const getStatusColor = (status: ClaimStatus): 'blue' | 'green' | 'red' | 'gray' => {
        switch (status) {
            case ClaimStatus.PENDING: return 'blue';
            case ClaimStatus.APPROVED: return 'green';
            case ClaimStatus.REJECTED: return 'red';
            case ClaimStatus.PAID: return 'gray';
            default: return 'blue';
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-extrabold text-brand-text-primary mb-6">Claims Management</h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <Card className="p-6">
                    <>
                        <div className="text-sm text-brand-text-secondary mb-2">Total Claims</div>
                        <div className="text-3xl font-bold text-brand-text-primary">{claims.length}</div>
                    </>
                </Card>
                <Card className="p-6">
                    <>
                        <div className="text-sm text-brand-text-secondary mb-2">Pending</div>
                        <div className="text-3xl font-bold text-blue-600">{claimStats.pending}</div>
                    </>
                </Card>
                <Card className="p-6">
                    <>
                        <div className="text-sm text-brand-text-secondary mb-2">Approved</div>
                        <div className="text-3xl font-bold text-green-600">{claimStats.approved}</div>
                    </>
                </Card>
                <Card className="p-6">
                    <>
                        <div className="text-sm text-brand-text-secondary mb-2">Paid</div>
                        <div className="text-3xl font-bold text-gray-600">{claimStats.paid}</div>
                    </>
                </Card>
                <Card className="p-6">
                    <>
                        <div className="text-sm text-brand-text-secondary mb-2">Total Paid Out</div>
                        <div className="text-3xl font-bold text-brand-text-primary">
                            ${claimStats.totalAmount.toFixed(2)}
                        </div>
                    </>
                </Card>
            </div>

            <Card className="p-0">
                <>
                    <div className="p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Search by policy, customer, deceased, or agent..."
                                className="flex-1 px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as ClaimStatus | 'All')}
                                className="px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink"
                            >
                                <option value="All">All Statuses</option>
                                <option value={ClaimStatus.PENDING}>Pending</option>
                                <option value={ClaimStatus.APPROVED}>Approved</option>
                                <option value={ClaimStatus.REJECTED}>Rejected</option>
                                <option value={ClaimStatus.PAID}>Paid</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-brand-text-secondary">Loading claims...</div>
                    ) : filteredClaims.length === 0 ? (
                        <div className="p-8 text-center text-brand-text-secondary">
                            {claims.length === 0 ? 'No claims filed yet' : 'No claims match your filters'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-brand-border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Claim ID</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Policy Number</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Customer</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Deceased</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Date of Death</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Claim Amount</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Filed By</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Filed Date</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-brand-surface divide-y divide-brand-border">
                                    {filteredClaims.map((claim) => (
                                        <tr
                                            key={claim.id}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => setSelectedClaim(claim)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">
                                                #{claim.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                                {claim.policy_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                                {claim.customer_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                                {claim.deceased_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                                {claim.date_of_death}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-text-primary">
                                                ${Number(claim.claim_amount).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                                {claim.filed_by_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Badge color={getStatusColor(claim.status)}>
                                                    {claim.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                                {claim.filed_date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <span className="text-brand-pink hover:text-brand-light-pink">View</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            </Card>

            {selectedClaim && (
                <ClaimDetailsModal
                    claim={selectedClaim}
                    onClose={() => setSelectedClaim(null)}
                    onUpdate={loadClaims}
                    isAdmin={true}
                />
            )}
        </div>
    );
};

export default AdminClaims;
