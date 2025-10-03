import React from 'react';
import { PolicyStatus } from '../../types';

interface PolicyStatusBadgeProps {
  status: PolicyStatus;
  className?: string;
}

const statusStyles: Record<PolicyStatus, string> = {
  [PolicyStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [PolicyStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
  [PolicyStatus.CANCELLED]: 'bg-gray-200 text-gray-500 line-through',
  [PolicyStatus.OVERDUE]: 'bg-red-100 text-red-800',
};

const PolicyStatusBadge: React.FC<PolicyStatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${statusStyles[status]} ${className}`}
    >
      {status}
    </span>
  );
};

export default PolicyStatusBadge;