"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Zap, Database, GitBranch, Target, Loader2 } from "lucide-react";
import { toast } from "sonner";

const mockAISuggestions = {
  joins: [
    { left: "sales.customer_id", right: "customers.id", confidence: 0.95 },
    { left: "orders.product_id", right: "products.sku", confidence: 0.87 },
  ],
  transformations: [
    { name: "Aggregate by country", type: "groupBy", confidence: 0.92 },
    { name: "Filter last 30 days", type: "filter", confidence: 0.88 },
    { name: "Calculate average order value", type: "aggregate", confidence: 0.91 },
  ],
  targets: [
    { name: "Snowflake", type: "snowflake", confidence: 0.96 },
    { name: "Aurora", type: "aurora", confidence: 0.89 },
  ]
};

export function AISuggestionPanel({ onClose, onApplySuggestion, nodes = [] }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(mockAISuggestions);
  const [activeTab, setActiveTab] = useState('joins');

  const analyzePipeline = async () => {
    setLoading(true);
    toast.info('Analyzing your pipeline with AI...');
    
    setTimeout(() => {
      setSuggestions(mockAISuggestions);
      setLoading(false);
      toast.success('AI analysis complete!');
    }, 1500);
  };

  const applySuggestion = (suggestion) => {
    onApplySuggestion(suggestion);
    toast.success(`Applied: ${suggestion.name || `${suggestion.left} → ${suggestion.right}`}`);
  };

  return (
    <Card className="w-80 fixed right-4 top-24 z-50 shadow-xl border-2 border-primary/20">
      <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">AI Suggestions</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4">
        <Button 
          onClick={analyzePipeline} 
          disabled={loading}
          className="w-full mb-4 bg-gradient-to-r from-primary to-purple-600"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Analyze Pipeline
            </>
          )}
        </Button>

        <div className="flex gap-2 mb-4">
          <Button 
            variant={activeTab === 'joins' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('joins')}
            className="flex-1"
          >
            <Database className="h-3 w-3 mr-1" />
            Joins
          </Button>
          <Button 
            variant={activeTab === 'transforms' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('transforms')}
            className="flex-1"
          >
            <GitBranch className="h-3 w-3 mr-1" />
            Transforms
          </Button>
          <Button 
            variant={activeTab === 'targets' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('targets')}
            className="flex-1"
          >
            <Target className="h-3 w-3 mr-1" />
            Targets
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activeTab === 'joins' && suggestions.joins.map((join, idx) => (
            <Card key={idx} className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => applySuggestion(join)}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{join.left}</p>
                  <p className="text-xs text-muted-foreground">→ {join.right}</p>
                </div>
                <div className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                  {Math.round(join.confidence * 100)}%
                </div>
              </div>
            </Card>
          ))}

          {activeTab === 'transforms' && suggestions.transformations.map((trans, idx) => (
            <Card key={idx} className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => applySuggestion(trans)}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{trans.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{trans.type}</p>
                </div>
                <div className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                  {Math.round(trans.confidence * 100)}%
                </div>
              </div>
            </Card>
          ))}

          {activeTab === 'targets' && suggestions.targets.map((target, idx) => (
            <Card key={idx} className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => applySuggestion(target)}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{target.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{target.type}</p>
                </div>
                <div className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded">
                  {Math.round(target.confidence * 100)}%
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg text-xs">
          <p className="font-medium mb-1">🔍 How it works:</p>
          <p>AI analyzes your pipeline and suggests:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Optimal join conditions</li>
            <li>Transformations to apply</li>
            <li>Target destinations</li>
          </ul>
          <p className="mt-2 text-primary">Click any suggestion to apply</p>
        </div>
      </div>
    </Card>
  );
}
