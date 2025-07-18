
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProductKeywordManagerProps {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
}

export const ProductKeywordManager = ({ keywords, onKeywordsChange }: ProductKeywordManagerProps) => {
  const [newKeyword, setNewKeyword] = useState('');

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toUpperCase())) {
      const updatedKeywords = [...keywords, newKeyword.trim().toUpperCase()];
      onKeywordsChange(updatedKeywords);
      setNewKeyword('');
      toast({
        title: "Keyword Added",
        description: `Product keyword "${newKeyword.trim().toUpperCase()}" has been added.`,
      });
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter(k => k !== keywordToRemove);
    onKeywordsChange(updatedKeywords);
    toast({
      title: "Keyword Removed",
      description: `Product keyword "${keywordToRemove}" has been removed.`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addKeyword();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Product Keywords Setup
        </CardTitle>
        <p className="text-sm text-gray-600">
          Enter product keywords used in your campaign names (e.g., 'OSC' for product OSC). 
          Reports will be grouped by these keywords.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter product keyword (e.g., OSC, ABC, XYZ)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={addKeyword} disabled={!newKeyword.trim()}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          
          {keywords.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Active Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
