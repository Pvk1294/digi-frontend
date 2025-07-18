
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  suffix?: string;
  description?: string;
}

export const MetricsCard = ({ title, value, change, changeLabel, suffix, description }: MetricsCardProps) => {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'secondary';
    if (change > 0) return 'default';
    if (change < 0) return 'destructive';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {change !== undefined && (
          <Badge variant={getTrendColor()} className="flex items-center gap-1">
            {getTrendIcon()}
            {Math.abs(change)}%
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
        </div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        {changeLabel && <p className="text-xs text-gray-400 mt-1">{changeLabel}</p>}
      </CardContent>
    </Card>
  );
};
