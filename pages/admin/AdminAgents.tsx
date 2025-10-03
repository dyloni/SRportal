import React from 'react';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';

const AdminAgents: React.FC = () => {
    const { state } = useData();
    const navigate = useNavigate();

    return (
        <div>
            <h2 className="text-3xl font-extrabold text-brand-text-primary mb-6">All Agents</h2>
            <Card className="p-0">
              <>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Agent ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Customers</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {state.agents.map((agent) => {
                                const customerCount = state.customers.filter(c => c.assignedAgentId === agent.id).length;
                                return (
                                    <tr key={agent.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/agents/${agent.id}`)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{`${agent.firstName} ${agent.surname}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{agent.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{customerCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <span className="text-brand-pink hover:text-brand-light-pink">View Profile</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
              </>
            </Card>
        </div>
    );
};

export default AdminAgents;
