import React, { useState, useMemo } from 'react';
import { Customer } from '../../types';
import Button from '../ui/Button';
import { sendBulkSMS } from '../../services/smsService';

interface BulkSMSModalProps {
  customers: Customer[];
  onClose: () => void;
}

const BulkSMSModal: React.FC<BulkSMSModalProps> = ({ customers, onClose }) => {
  const [message, setMessage] = useState('');
  const [senderId, setSenderId] = useState('STONERIVER');
  const [smsType, setSmsType] = useState<'P' | 'T'>('T');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    successful: number;
    failed: number;
    results: Array<{ phone: string; status: string; remarks: string }>;
  } | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowercased = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        `${c.firstName} ${c.surname}`.toLowerCase().includes(lowercased) ||
        c.phoneNumber.toLowerCase().includes(lowercased)
    );
  }, [customers, searchTerm]);

  const toggleCustomer = (customerId: number) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const toggleAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map((c) => c.id)));
    }
  };

  const handleSend = async () => {
    if (selectedCustomers.size === 0) {
      alert('Please select at least one customer');
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const selectedCustomersList = customers.filter((c) => selectedCustomers.has(c.id));
      const phoneNumbers = selectedCustomersList.map((c) => {
        let phone = c.phoneNumber.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '263' + phone.substring(1);
        }
        return phone;
      });

      const result = await sendBulkSMS(phoneNumbers, message, senderId, smsType);
      setSendResult(result);
    } catch (error) {
      alert('Error sending SMS: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  const characterCount = message.length;
  const messagePartCount = Math.ceil(characterCount / 160);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-brand-text-primary">Send Bulk SMS</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {sendResult ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">SMS Sending Complete</h3>
                <p className="text-green-700">
                  Successfully sent: {sendResult.successful} | Failed: {sendResult.failed}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-brand-text-primary">Results:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {sendResult.results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        result.status === 'success'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <p className="font-medium">{result.phone}</p>
                      <p className="text-sm text-gray-600">{result.remarks}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={onClose}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  SMS Type
                </label>
                <select
                  value={smsType}
                  onChange={(e) => setSmsType(e.target.value as 'P' | 'T')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-pink focus:border-transparent"
                >
                  <option value="T">Transactional</option>
                  <option value="P">Promotional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Sender ID
                </label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-pink focus:border-transparent"
                  placeholder="STONERIVER"
                  maxLength={11}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-pink focus:border-transparent"
                  rows={4}
                  placeholder="Enter your message..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  {characterCount} characters | {messagePartCount} message part(s)
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-brand-text-primary">
                    Select Recipients ({selectedCustomers.size} selected)
                  </label>
                  <button
                    onClick={toggleAll}
                    className="text-sm text-brand-pink hover:text-brand-light-pink font-medium"
                  >
                    {selectedCustomers.size === filteredCustomers.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-pink focus:border-transparent mb-2"
                />

                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCustomers.has(customer.id)}
                        onChange={() => toggleCustomer(customer.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-brand-text-primary">
                          {customer.firstName} {customer.surname}
                        </p>
                        <p className="text-sm text-gray-500">{customer.phoneNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {!sendResult && (
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? 'Sending...' : `Send to ${selectedCustomers.size} recipient(s)`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkSMSModal;
