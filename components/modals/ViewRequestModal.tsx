import React from 'react';
// FIX: Imported the AppRequest union type.
import { AppRequest, RequestType } from '../../types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface ViewRequestModalProps {
    request: AppRequest;
    onClose: () => void;
}

const Detail: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-brand-text-secondary">{label}</p>
        <p className="mt-1 text-sm text-brand-text-primary break-words">{value}</p>
    </div>
);

const ViewRequestModal: React.FC<ViewRequestModalProps> = ({ request, onClose }) => {

    const renderRequestDetails = () => {
        switch (request.requestType) {
            case RequestType.NEW_POLICY:
                return (
                    <>
                        <Detail label="Customer Info" value={<pre className="whitespace-pre-wrap">{JSON.stringify(request.customerData, null, 2)}</pre>} />
                        <Detail label="ID Document" value={request.idPhotoFilename} />
                        <Detail label="Initial Payment" value={`$${request.paymentAmount} via ${request.paymentMethod}`} />
                        <Detail label="Payment Receipt" value={request.receiptFilename} />
                    </>
                );
            case RequestType.EDIT_CUSTOMER_DETAILS:
                return (
                    <>
                        <Detail label="Old Values" value={JSON.stringify(request.oldValues, null, 2)} />
                        <Detail label="New Values" value={JSON.stringify(request.newValues, null, 2)} />
                    </>
                );
            case RequestType.ADD_DEPENDENT:
                 return <Detail label="Dependent Info" value={JSON.stringify(request.dependentData, null, 2)} />;
            case RequestType.POLICY_UPGRADE:
            case RequestType.POLICY_DOWNGRADE:
                return <Detail label="Details" value={request.details} />;
            case RequestType.MAKE_PAYMENT:
                return (
                    <>
                        <Detail label="Payment Amount" value={`$${request.paymentAmount}`} />
                        <Detail label="Payment Type" value={request.paymentType} />
                        <Detail label="Payment Period" value={request.paymentPeriod} />
                        <Detail label="Receipt" value={request.receiptFilename} />
                    </>
                );
            default:
                return <p>Details not available for this request type.</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-brand-surface rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-medium text-brand-text-primary">{request.requestType} Details</h3>
                    <Badge status={request.status} />
                </div>
                <div className="space-y-4 border-t border-b border-brand-border py-4 my-4 overflow-y-auto">
                   {renderRequestDetails()}
                   {request.adminNotes && <Detail label="Admin Notes" value={request.adminNotes} />}
                </div>
                
                <div className="flex justify-end pt-6 mt-auto">
                    <Button variant="secondary" onClick={onClose} type="button">Close</Button>
                </div>
            </div>
        </div>
    );
};

export default ViewRequestModal;