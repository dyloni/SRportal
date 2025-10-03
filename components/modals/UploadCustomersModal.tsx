import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { parseCustomersFile, generateUploadTemplate } from '../../utils/csvHelpers';
import { Customer } from '../../types';
import Button from '../ui/Button';

interface UploadCustomersModalProps {
    onClose: () => void;
    onUploadSuccess: (newCustomers: Customer[]) => void;
}

const UploadCustomersModal: React.FC<UploadCustomersModalProps> = ({ onClose, onUploadSuccess }) => {
    const { state } = useData();
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setErrors([]);
        }
    };

    const handleProcessFile = () => {
        if (!file) {
            setErrors(['Please select a file to upload.']);
            return;
        }

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = e.target?.result;
            if (fileData) {
                try {
                    const { customers, errors: parseErrors } = parseCustomersFile(fileData, state.agents, state.customers);
                    if (parseErrors.length > 0) {
                        setErrors(parseErrors);
                    } else {
                        onUploadSuccess(customers);
                    }
                } catch (err: any) {
                    setErrors([`An unexpected error occurred: ${err.message}`]);
                }
            }
            setIsProcessing(false);
        };
        reader.onerror = () => {
             setErrors(['Failed to read the file.']);
             setIsProcessing(false);
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4">
            <div className="bg-brand-surface rounded-2xl shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-2xl font-bold text-brand-text-primary mb-4">Import Customers</h3>
                <p className="text-brand-text-secondary mb-2">Upload an XLSX file with customer and participant data.</p>
                <p className="text-brand-text-secondary mb-4">
                    The file must contain one row per person (policyholder and dependents). Use the template to ensure correct formatting.
                </p>

                <Button variant="secondary" onClick={generateUploadTemplate} className="mb-4">
                    Download Template
                </Button>

                <div>
                    <label htmlFor="file-upload" className="sr-only">Choose file</label>
                    <input type="file" id="file-upload" accept=".xlsx, .xls" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-pink/10 file:text-brand-pink hover:file:bg-brand-pink/20" />
                </div>

                {errors.length > 0 && (
                    <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-h-40 overflow-y-auto">
                        <strong className="font-bold">Errors Found:</strong>
                        <ul className="list-disc list-inside">
                            {errors.map((error, index) => <li key={index}>{error}</li>)}
                        </ul>
                    </div>
                )}

                <div className="flex justify-end pt-4 mt-6 space-x-3">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleProcessFile} disabled={!file || isProcessing}>
                        {isProcessing ? 'Processing...' : 'Upload and Validate'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UploadCustomersModal;