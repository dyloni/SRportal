import React from 'react';
import { TimePeriod } from '../../utils/analyticsHelpers';

interface TimePeriodSelectorProps {
    selectedPeriod: TimePeriod;
    onPeriodChange: (period: TimePeriod) => void;
}

const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({ selectedPeriod, onPeriodChange }) => {
    const periods: { value: TimePeriod; label: string }[] = [
        { value: 'daily', label: 'Today' },
        { value: 'weekly', label: 'This Week' },
        { value: 'monthly', label: 'This Month' },
    ];

    return (
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {periods.map(period => (
                <button
                    key={period.value}
                    onClick={() => onPeriodChange(period.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedPeriod === period.value
                            ? 'bg-brand-pink text-white'
                            : 'text-brand-text-secondary hover:bg-gray-200'
                    }`}
                >
                    {period.label}
                </button>
            ))}
        </div>
    );
};

export default TimePeriodSelector;
