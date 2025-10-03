import React from 'react';
import Button from '../ui/Button';

interface ReceiptViewerModalProps {
    filename: string;
    onClose: () => void;
}

const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({ filename, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-brand-surface rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-lg font-medium text-brand-text-primary mb-4">Receipt: {filename}</h3>
                <div className="bg-gray-100 h-96 flex items-center justify-center">
                    <p className="text-brand-text-secondary">PDF/Image preview placeholder</p>
                </div>
                <div className="flex justify-end pt-4 mt-4">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptViewerModal;