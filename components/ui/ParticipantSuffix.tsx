import React from 'react';

interface ParticipantSuffixProps {
  suffix: string;
}

const ParticipantSuffix: React.FC<ParticipantSuffixProps> = ({ suffix }) => {
  return (
    <span className="ml-2 px-2 py-1 text-xs font-mono font-bold bg-brand-border text-brand-text-secondary rounded">
      {suffix}
    </span>
  );
};

export default ParticipantSuffix;