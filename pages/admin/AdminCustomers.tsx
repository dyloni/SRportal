import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Customer } from '../../types';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import PolicyStatusBadge from '../../components/ui/PolicyStatusBadge';
import Button from '../../components/ui/Button';
import { exportCustomersToFile } from '../../utils/csvHelpers';
import UploadCustomersModal from '../../components/modals/UploadCustomersModal';
import BulkSMSModal from '../../components/modals/BulkSMSModal';
import { formatPolicyNumber } from '../../utils/policyHelpers';


const AdminCustomers: React.FC = () => {
    const { state, dispatch } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return state.customers;
        const lowercasedTerm = searchTerm.toLowerCase();
        return state.customers.filter(c =>
            `${c.firstName} ${c.surname}`.toLowerCase().includes(lowercasedTerm) ||
            c.policyNumber.toLowerCase().includes(lowercasedTerm)
        );
    }, [searchTerm, state.customers]);

    const handleExport = (format: 'csv' | 'xlsx') => {
        exportCustomersToFile(state.customers, state.agents, state.requests, format);
    };
    
    const handleUploadSuccess = (newCustomers: Customer[]) => {
        dispatch({ type: 'BULK_ADD_CUSTOMERS', payload: newCustomers });
        setIsUploadModalOpen(false);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-extrabold text-brand-text-primary">All Customers</h2>
                <div className="space-x-2">
                    <Button variant="secondary" onClick={() => setIsUploadModalOpen(true)}>Import Customers</Button>
                    <Button variant="secondary" onClick={() => setIsSMSModalOpen(true)}>Send Bulk SMS</Button>
                    <Button onClick={() => handleExport('xlsx')}>Export to Excel</Button>
                </div>
            </div>
            <Card className="p-0">
              <>
                <div className="p-4">
                    <input
                        type="text"
                        placeholder="Search customers by name or policy number..."
                        className="block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Policy Number</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Agent</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {filteredCustomers.map((customer: Customer) => {
                                const agent = state.agents.find(a => a.id === customer.assignedAgentId);
                                return (
                                    <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{`${customer.firstName} ${customer.surname}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{formatPolicyNumber(customer.policyNumber)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <PolicyStatusBadge status={customer.status} />
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{agent ? `${agent.firstName} ${agent.surname}` : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <span className="text-brand-pink hover:text-brand-light-pink">View</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
              </>
            </Card>
             {isUploadModalOpen && (
                <UploadCustomersModal
                    onClose={() => setIsUploadModalOpen(false)}
                    onUploadSuccess={handleUploadSuccess}
                />
            )}
            {isSMSModalOpen && (
                <BulkSMSModal
                    customers={state.customers}
                    onClose={() => setIsSMSModalOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminCustomers;
