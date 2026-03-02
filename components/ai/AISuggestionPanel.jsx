"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Zap, Database, GitBranch, Target, Loader2, Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { toast } from "sonner";

export function AISuggestionPanel({ onClose, onApplySuggestion, nodes = [], edges = [] }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({
    joins: [],
    transformations: [],
    targets: []
  });
  const [activeTab, setActiveTab] = useState('joins');

  const analyzePipeline = async () => {
    setLoading(true);

    try {
      // Get current nodes and edges from props
      const currentNodes = nodes || [];
      const currentEdges = edges || [];

      if (currentNodes.length === 0) {
        toast.warning('Add some nodes to the canvas first', {
          description: 'Drag nodes from the palette to begin'
        });
        setLoading(false);
        return;
      }

      console.log('Analyzing pipeline with:', {
        nodes: currentNodes.length,
        edges: currentEdges.length
      });

      toast.info('Analyzing your pipeline with AI...', {
        description: `Processing ${currentNodes.length} nodes`
      });

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: currentNodes,
          edges: currentEdges
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      setSuggestions(data);

      // Show success with stats
      const joinCount = data.joins?.length || 0;
      const transformCount = data.transformations?.length || 0;
      const targetCount = data.targets?.length || 0;

      if (data.warning) {
        toast.warning('Using fallback suggestions', {
          description: data.warning,
          duration: 4000,
        });
      } else {
        toast.success('AI analysis complete!', {
          description: `Found ${joinCount} joins, ${transformCount} transforms, ${targetCount} targets`,
          duration: 4000,
        });
      }

    } catch (error) {
      console.error('AI analysis failed:', error);
      toast.error('AI analysis failed. Using fallback suggestions.', {
        description: error.message,
        duration: 5000,
      });

      // Enhanced fallback suggestions
      setSuggestions({
        joins: [
          { left: "sales.customer_id", right: "customers.id", confidence: 0.95, reasoning: "Link sales to customer details" },
          { left: "orders.product_id", right: "products.sku", confidence: 0.87, reasoning: "Connect orders to product catalog" },
          { left: "inventory.product_id", right: "products.id", confidence: 0.82, reasoning: "Inventory to product master" }
        ],
        transformations: [
          { name: "Aggregate sales by country", type: "groupBy", confidence: 0.92, description: "Sum sales per country for regional analysis" },
          { name: "Filter last 30 days data", type: "filter", confidence: 0.88, description: "Focus on recent transactions" },
          { name: "Calculate average order value", type: "aggregate", confidence: 0.91, description: "AOV by customer segment" },
          { name: "Join sales with customers", type: "join", confidence: 0.94, description: "Enrich sales with customer attributes" }
        ],
        targets: [
          { name: "Snowflake", type: "snowflake", confidence: 0.96, reason: "Best for large-scale analytics and reporting" },
          { name: "Aurora PostgreSQL", type: "aurora", confidence: 0.89, reason: "Ideal for operational workloads and low latency" },
          { name: "Redshift", type: "redshift", confidence: 0.78, reason: "Good for AWS-integrated data warehousing" }
        ]
      });
    } finally {
      setLoading(false);
    }
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
          {activeTab === 'joins' && (suggestions.joins?.length > 0 ? suggestions.joins.map((join, idx) => (
            <HoverCard key={idx}>
              <HoverCardTrigger asChild>
                <Card className="p-3 hover:bg-muted/50 cursor-pointer transition-colors relative"
                  onClick={() => applySuggestion(join)}>
                  <div className="flex justify-between items-start pr-6">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{join.left}</p>
                      <p className="text-xs text-muted-foreground">→ {join.right}</p>
                    </div>
                    <div className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded ml-2">
                      {Math.round(join.confidence * 100)}%
                    </div>
                  </div>
                  <Info className="h-4 w-4 text-muted-foreground absolute right-3 top-3 opacity-50" />
                </Card>
              </HoverCardTrigger>
              <HoverCardContent side="left" className="w-80 space-y-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Join Relevance
                  </h4>
                  <p className="text-sm text-foreground">
                    <strong>Why use this:</strong> {join.reasoning || "Connects matching entities across schemas for a unified view."}
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Data Quality Impact:</strong> Reduces orphaned records by ~{(join.confidence * 100).toFixed(0)}%.
                  </p>
                  <div className="text-xs bg-muted p-2 rounded whitespace-pre-wrap font-mono mt-2">
                    <span className="text-muted-foreground">// Example Output</span>{"\n"}
                    {join.left.split('.')[0]} + {join.right.split('.')[0]} matched correctly
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )) : (
            <div className="text-center text-muted-foreground text-sm py-4">
              Click "Analyze Pipeline" to get suggestions
            </div>
          ))}

          {activeTab === 'transforms' && (suggestions.transformations?.length > 0 ? suggestions.transformations.map((trans, idx) => (
            <HoverCard key={idx}>
              <HoverCardTrigger asChild>
                <Card className="p-3 hover:bg-muted/50 cursor-pointer transition-colors relative"
                  onClick={() => applySuggestion(trans)}>
                  <div className="flex justify-between items-start pr-6">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{trans.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{trans.type}</p>
                    </div>
                    <div className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded ml-2">
                      {Math.round(trans.confidence * 100)}%
                    </div>
                  </div>
                  <Info className="h-4 w-4 text-muted-foreground absolute right-3 top-3 opacity-50" />
                </Card>
              </HoverCardTrigger>
              <HoverCardContent side="left" className="w-80 space-y-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Transformation Reasoning
                  </h4>
                  <p className="text-sm text-foreground">
                    <strong>Why use this:</strong> {trans.description || "Helps normalize the data to the correct format."}
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Data Quality Impact:</strong> Improves structured data consistency for downstream analytics.
                  </p>
                  <div className="text-xs bg-muted p-2 rounded whitespace-pre-wrap font-mono mt-2">
                    <span className="text-muted-foreground">// Example Output</span>{"\n"}
                    Applied: {trans.type} {"->"} Clean data
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )) : (
            <div className="text-center text-muted-foreground text-sm py-4">
              Click "Analyze Pipeline" to get suggestions
            </div>
          ))}

          {activeTab === 'targets' && (suggestions.targets?.length > 0 ? suggestions.targets.map((target, idx) => (
            <HoverCard key={idx}>
              <HoverCardTrigger asChild>
                <Card className="p-3 hover:bg-muted/50 cursor-pointer transition-colors relative"
                  onClick={() => applySuggestion(target)}>
                  <div className="flex justify-between items-start pr-6">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{target.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{target.type}</p>
                    </div>
                    <div className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded ml-2">
                      {Math.round(target.confidence * 100)}%
                    </div>
                  </div>
                  <Info className="h-4 w-4 text-muted-foreground absolute right-3 top-3 opacity-50" />
                </Card>
              </HoverCardTrigger>
              <HoverCardContent side="left" className="w-80 space-y-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Target Suggestion
                  </h4>
                  <p className="text-sm text-foreground">
                    <strong>Why use this:</strong> {target.reason || "Optimal target for this data shape and volume."}
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Data Quality Impact:</strong> Maintains data types accurately during writing phase.
                  </p>
                  <div className="text-xs bg-muted p-2 rounded whitespace-pre-wrap font-mono mt-2">
                    <span className="text-muted-foreground">// Example Output</span>{"\n"}
                    Saved 1,000,000 rows to {target.name}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )) : (
            <div className="text-center text-muted-foreground text-sm py-4">
              Click "Analyze Pipeline" to get suggestions
            </div>
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

        <div className="mt-2 p-2 bg-yellow-500/10 rounded text-xs">
          <p className="text-yellow-700 dark:text-yellow-400">
            💡 <strong>Tip:</strong> Add API key to .env.local for AI-powered suggestions
          </p>
        </div>
      </div>
    </Card>
  );
}
