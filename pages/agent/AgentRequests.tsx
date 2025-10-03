import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { AppRequest } from '../../types';
import ViewRequestModal from '../../components/modals/ViewRequestModal';

const AgentRequests: React.FC = () => {
    const { user } = useAuth();
    const { state } = useData();
    const [selectedRequest, setSelectedRequest] = useState<AppRequest | null>(null);

    const agentRequests = useMemo(() => {
        if (!user) return [];
        return state.requests
            .filter(r => r.agentId === user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [state.requests, user]);

    if (!user) return null;

    return (
        <div>
            <h2 className="text-3xl font-extrabold text-brand-text-primary mb-6">My Requests</h2>
            <Card className="p-0">
              <>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Request Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Date Submitted</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {agentRequests.map((request) => (
                                <tr key={request.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{request.requestType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{new Date(request.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><Badge status={request.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setSelectedRequest(request)} className="text-brand-pink hover:text-brand-light-pink">View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </>
            </Card>
            {selectedRequest && <ViewRequestModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
        </div>
    );
};

export default AgentRequests;
