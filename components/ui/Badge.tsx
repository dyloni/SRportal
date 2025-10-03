import React from 'react';
import { RequestStatus } from '../../types';

interface BadgeProps {
  status: RequestStatus;
  className?: string;
}

const statusColors: Record<RequestStatus, string> = {
  [RequestStatus.APPROVED]: 'bg-green-100 text-green-800',
  [RequestStatus.REJECTED]: 'bg-red-100 text-red-800',
  [RequestStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
};

const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status]} ${className}`}
    >
      {status}
    </span>
  );
};

export default Badge;