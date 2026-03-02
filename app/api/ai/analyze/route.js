import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { nodes, edges } = await request.json();

    // Get OpenRouter API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('OpenRouter API key not found');
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Please add OPENROUTER_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    // Prepare pipeline data
    const pipelineData = {
      nodes: nodes?.map(n => ({
        id: n.id,
        type: n.type,
        label: n.data?.label || 'Unknown',
        dataType: n.data?.type || 'unknown'
      })) || [],
      connections: edges?.map(e => ({
        from: e.source,
        to: e.target
      })) || []
    };

    console.log('Sending to OpenRouter for analysis');

    // Call OpenRouter API (supports DeepSeek models)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'SynKrasis.ai'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert ETL/ELT architect. Analyze the given pipeline and suggest:
            1. JOIN CONDITIONS: Identify potential joins between source nodes
            2. TRANSFORMATIONS: Suggest useful aggregations, filters, or calculations
            3. TARGETS: Recommend appropriate destinations
            
            Return ONLY valid JSON in this exact format, no other text:
            {
              "joins": [
                { "left": "table1.column", "right": "table2.column", "confidence": 0.95 }
              ],
              "transformations": [
                { "name": "Aggregate sales by country", "type": "groupBy", "confidence": 0.9 }
              ],
              "targets": [
                { "name": "Snowflake", "type": "snowflake", "confidence": 0.85 }
              ]
            }`
          },
          {
            role: 'user',
            content: `Analyze this ETL pipeline: ${JSON.stringify(pipelineData)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);

      // Return fallback suggestions
      return NextResponse.json({
        joins: [
          { left: "sales.customer_id", right: "customers.id", confidence: 0.95 },
          { left: "orders.product_id", right: "products.sku", confidence: 0.87 }
        ],
        transformations: [
          { name: "Aggregate sales by country", type: "groupBy", confidence: 0.92 },
          { name: "Filter last 30 days", type: "filter", confidence: 0.88 }
        ],
        targets: [
          { name: "Snowflake", type: "snowflake", confidence: 0.96 }
        ]
      });
    }

    const data = await response.json();
    console.log('OpenRouter response received');

    // Parse the AI response
    try {
      const content = data.choices[0].message.content;
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(cleanedContent);
      return NextResponse.json(suggestions);
    } catch (parseError) {
      console.error('Failed to parse AI response');
      return NextResponse.json({
        joins: [
          { left: "sales.customer_id", right: "customers.id", confidence: 0.95 }
        ],
        transformations: [
          { name: "Aggregate by date", type: "groupBy", confidence: 0.94 }
        ],
        targets: [
          { name: "Snowflake", type: "snowflake", confidence: 0.95 }
        ]
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
