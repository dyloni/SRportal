import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { AppRequest, RequestStatus } from '../../types';
import ViewRequestModal from '../../components/modals/ViewRequestModal';
import Button from '../../components/ui/Button';

const AdminRequests: React.FC = () => {
    const { state, dispatchWithOffline } = useData();
    const [selectedRequest, setSelectedRequest] = useState<AppRequest | null>(null);
    const [filter, setFilter] = useState<RequestStatus | 'All'>('All');

    const requests = useMemo(() => {
        const sorted = [...state.requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (filter === 'All') return sorted;
        return sorted.filter(r => r.status === filter);
    }, [state.requests, filter]);

    const handleUpdateRequest = (request: AppRequest, status: RequestStatus, adminNotes: string) => {
        dispatchWithOffline({
            type: 'UPDATE_REQUEST',
            payload: { ...request, status, adminNotes },
        });
        setSelectedRequest(null);
    };

    const ActionableRequestModal: React.FC<{request: AppRequest, onClose: () => void}> = ({request, onClose}) => {
        const [notes, setNotes] = useState('');
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                <div className="bg-brand-surface rounded-lg shadow-xl w-full max-w-lg">
                    <ViewRequestModal request={request} onClose={onClose} />
                    {request.status === RequestStatus.PENDING && (
                         <div className="p-6 border-t border-brand-border">
                            <h4 className="font-semibold mb-2">Actions</h4>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add admin notes (optional for approval, required for rejection)"
                                className="block w-full px-4 py-3 mb-4 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink"
                            />
                            <div className="flex justify-end space-x-2">
                                <Button variant="secondary" onClick={() => handleUpdateRequest(request, RequestStatus.REJECTED, notes || 'Rejected by admin.')} disabled={!notes}>Reject</Button>
                                <Button onClick={() => handleUpdateRequest(request, RequestStatus.APPROVED, notes)}>Approve</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-3xl font-extrabold text-brand-text-primary mb-6">Manage Requests</h2>
            <div className="mb-4">
                {['All', ...Object.values(RequestStatus)].map(status => (
                    <Button
                        key={status}
                        variant={filter === status ? 'primary' : 'secondary'}
                        onClick={() => setFilter(status as RequestStatus | 'All')}
                        className="mr-2 mb-2"
                    >
                        {status}
                    </Button>
                ))}
            </div>
            <Card className="p-0">
              <>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Agent ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Request Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {requests.map((request) => (
                                <tr key={request.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{request.agentId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{request.requestType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(request.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><Badge status={request.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setSelectedRequest(request)} className="text-brand-pink hover:text-brand-light-pink">
                                            {request.status === 'Pending' ? 'Review' : 'View'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </>
            </Card>
            {selectedRequest && <ActionableRequestModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
        </div>
    );
};

export default AdminRequests;
