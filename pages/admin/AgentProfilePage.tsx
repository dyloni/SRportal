import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PolicyStatusBadge from '../../components/ui/PolicyStatusBadge';
import Badge from '../../components/ui/Badge';
import { getEffectivePolicyStatus } from '../../utils/statusHelpers';
import { MakePaymentRequest, RequestType } from '../../types';

const AgentProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { state } = useData();
    const navigate = useNavigate();

    const agent = state.agents.find(a => a.id === Number(id));

    if (!agent) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-brand-text-primary">Agent not found</h2>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }
    
    const assignedCustomers = state.customers.filter(c => c.assignedAgentId === agent.id);
    const agentPaymentRequests = state.requests
        .filter((r): r is MakePaymentRequest => r.agentId === agent.id && r.requestType === RequestType.MAKE_PAYMENT)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const handleMessageAgent = () => {
        navigate('/messages', { state: { agentId: agent.id } });
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-semibold text-brand-text-primary">{`${agent.firstName} ${agent.surname}`}</h2>
                    <p className="mt-1 text-brand-text-secondary">Agent ID: {agent.id}</p>
                </div>
                 <Button onClick={handleMessageAgent}>Message Agent</Button>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="Assigned Customers">
                    {assignedCustomers.length > 0 ? (
                        <ul className="divide-y divide-brand-border">
                            {assignedCustomers.map(customer => (
                                <li key={customer.id} className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-md" onClick={() => navigate(`/customers/${customer.id}`)}>
                                    <span className="text-sm font-medium text-brand-text-primary">{`${customer.firstName} ${customer.surname}`}</span>
                                    <PolicyStatusBadge status={getEffectivePolicyStatus(customer, state.requests)} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-brand-text-secondary">No customers assigned.</p>
                    )}
                </Card>
                <Card title="Recent Payments Logged">
                    {agentPaymentRequests.length > 0 ? (
                        <ul className="divide-y divide-brand-border">
                             {agentPaymentRequests.slice(0, 10).map(request => (
                                <li key={request.id} className="py-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-brand-text-primary">{`$${request.paymentAmount.toFixed(2)} - ${request.paymentMethod}`}</p>
                                        <p className="text-xs text-brand-text-secondary">
                                            {`Customer ID: ${request.customerId}`}
                                        </p>
                                    </div>
                                    <Badge status={request.status} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-center text-brand-text-secondary">No payments logged.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AgentProfilePage;