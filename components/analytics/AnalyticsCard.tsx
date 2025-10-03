import React from 'react';
import Card from '../ui/Card';

interface AnalyticsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon?: React.ReactNode;
    color?: 'pink' | 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = 'pink'
}) => {
    const colorClasses = {
        pink: 'text-pink-600 bg-pink-50',
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        orange: 'text-orange-600 bg-orange-50',
        red: 'text-red-600 bg-red-50',
        purple: 'text-purple-600 bg-purple-50',
    };

    return (
        <Card className="relative overflow-hidden">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-brand-text-secondary mb-1">{title}</p>
                    <p className="text-3xl font-bold text-brand-text-primary">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-brand-text-secondary mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={`inline-flex items-center mt-2 text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default AnalyticsCard;
