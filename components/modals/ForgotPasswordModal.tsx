import React from 'react';
import Button from '../ui/Button';

interface ForgotPasswordModalProps {
    onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Forgot Password</h3>
                <p className="text-sm text-gray-600 mb-4">Enter your email to receive a reset link.</p>
                <input type="email" placeholder="you@example.com" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                <div className="flex justify-end space-x-2 pt-4 mt-4">
                     <Button variant="secondary" onClick={onClose}>Cancel</Button>
                     <Button onClick={() => {alert('Reset link sent!'); onClose();}}>Send Link</Button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;