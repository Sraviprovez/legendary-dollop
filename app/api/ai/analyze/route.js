import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { nodes, edges } = await request.json();
    
    // Get API key from environment
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.error('DeepSeek API key not found in environment');
      // Return fallback suggestions when no API key
      return NextResponse.json({
        joins: [
          { left: "sales.customer_id", right: "customers.id", confidence: 0.95, reasoning: "Common customer identifier" },
          { left: "orders.product_id", right: "products.sku", confidence: 0.87, reasoning: "Product relationship" }
        ],
        transformations: [
          { name: "Aggregate sales by country", type: "groupBy", confidence: 0.92, description: "Sum sales per country" },
          { name: "Filter last 30 days", type: "filter", confidence: 0.88, description: "Recent data only" },
          { name: "Calculate average order value", type: "aggregate", confidence: 0.91, description: "AOV by customer" }
        ],
        targets: [
          { name: "Snowflake", type: "snowflake", confidence: 0.96, reason: "Best for analytics" },
          { name: "Aurora PostgreSQL", type: "aurora", confidence: 0.89, reason: "Good for operational reporting" }
        ],
        warning: 'Using fallback suggestions - API key not configured'
      });
    }

    // Log for debugging (remove in production)
    console.log('API Key present:', apiKey.substring(0, 5) + '...');

    // Prepare pipeline data for AI analysis
    const pipelineData = {
      nodes: nodes?.map(n => ({
        id: n.id,
        type: n.type,
        label: n.data?.label || 'Unknown',
        dataType: n.data?.type || 'unknown'
      })) || [],
      connections: edges?.map(e => ({
        from: e.source,
        to: e.target,
        fromType: nodes?.find(n => n.id === e.source)?.type,
        toType: nodes?.find(n => n.id === e.target)?.type
      })) || []
    };

    console.log('Sending to DeepSeek:', pipelineData);

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert ETL/ELT architect. Analyze the given pipeline and suggest:
            1. JOIN CONDITIONS: Identify potential joins between source nodes based on common fields
            2. TRANSFORMATIONS: Suggest useful aggregations, filters, or calculations
            3. TARGETS: Recommend appropriate destinations (Snowflake, Aurora, etc.)
            
            Return ONLY valid JSON in this exact format, no other text or markdown:
            {
              "joins": [
                { "left": "table1.column", "right": "table2.column", "confidence": 0.95, "reasoning": "brief explanation" }
              ],
              "transformations": [
                { "name": "Aggregate sales by country", "type": "groupBy", "confidence": 0.9, "description": "what this does" }
              ],
              "targets": [
                { "name": "Snowflake", "type": "snowflake", "confidence": 0.85, "reason": "why this is good" }
              ]
            }`
          },
          {
            role: 'user',
            content: `Analyze this ETL pipeline and suggest improvements: ${JSON.stringify(pipelineData, null, 2)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      
      // Return helpful error with fallback data
      return NextResponse.json({
        joins: [
          { left: "sales.customer_id", right: "customers.id", confidence: 0.95, reasoning: "Common customer identifier" },
          { left: "orders.product_id", right: "products.sku", confidence: 0.87, reasoning: "Product relationship" }
        ],
        transformations: [
          { name: "Aggregate sales by country", type: "groupBy", confidence: 0.92, description: "Sum sales per country" },
          { name: "Filter last 30 days", type: "filter", confidence: 0.88, description: "Recent data only" },
          { name: "Calculate average order value", type: "aggregate", confidence: 0.91, description: "AOV by customer" }
        ],
        targets: [
          { name: "Snowflake", type: "snowflake", confidence: 0.96, reason: "Best for analytics" },
          { name: "Aurora PostgreSQL", type: "aurora", confidence: 0.89, reason: "Good for operational reporting" }
        ],
        warning: `API error: ${response.status}`
      });
    }

    const data = await response.json();
    console.log('DeepSeek response received:', data);

    // Parse the AI response
    try {
      const content = data.choices[0].message.content;
      // Remove any markdown formatting if present
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(cleanedContent);
      
      // Log token usage for cost tracking
      console.log('Token usage:', data.usage);
      // Cost: ~$0.00014 per analysis (with $9 credits = 64,000 analyses!)
      
      return NextResponse.json(suggestions);
    } catch (parseError) {
      console.error('Failed to parse AI response:', data.choices[0]?.message?.content);
      
      // Return fallback suggestions
      return NextResponse.json({
        joins: [
          { left: "sales.customer_id", right: "customers.id", confidence: 0.95, reasoning: "Standard customer join" },
          { left: "orders.product_id", right: "products.id", confidence: 0.90, reasoning: "Product lookup" }
        ],
        transformations: [
          { name: "Aggregate by date", type: "groupBy", confidence: 0.94, description: "Daily/Monthly trends" },
          { name: "Filter active records", type: "filter", confidence: 0.86, description: "Status = active" }
        ],
        targets: [
          { name: "Snowflake", type: "snowflake", confidence: 0.95, reason: "Analytics workload" }
        ],
        warning: 'Parse error - using fallback suggestions'
      });
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
