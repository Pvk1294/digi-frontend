
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface Insight {
  type: 'positive' | 'negative' | 'warning' | 'neutral';
  title: string;
  description: string;
  recommendation?: string;
}

interface InsightsPanelProps {
  insights: Insight[];
}

export const InsightsPanel = ({ insights }: InsightsPanelProps) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }
  };

  const getInsightVariant = (type: string) => {
    switch (type) {
      case 'positive':
        return 'default';
      case 'negative':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <Alert key={index} className="border-l-4">
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  <Badge variant={getInsightVariant(insight.type)} className="text-xs">
                    {insight.type}
                  </Badge>
                </div>
                <AlertDescription className="text-sm text-gray-600 mb-2">
                  {insight.description}
                </AlertDescription>
                {insight.recommendation && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
