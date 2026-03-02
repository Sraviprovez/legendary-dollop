import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { query, context } = await request.json();

        if (!query || !query.trim()) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            console.warn('OpenRouter API key not found, using fallback');
            return NextResponse.json({ response: getFallbackResponse(query), source: 'fallback' });
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'SynKrasis.ai - Kaavya Assistant'
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: `You are Kaavya, an intelligent AI data engineering assistant for the SynKrasis.ai platform. 
You help users with:
- ETL/ELT pipeline design and optimization
- Data quality checks and best practices
- SQL join strategies and query optimization
- Data transformation logic (dbt, SQL, Python)
- Source and target connector recommendations
- Data lineage understanding

Keep responses concise (2-3 sentences max), practical, and actionable. 
Use data engineering terminology. Be friendly but professional.
If the user asks something outside data engineering, politely redirect them.
${context ? `\nCurrent pipeline context: ${JSON.stringify(context)}` : ''}`
                        },
                        {
                            role: 'user',
                            content: query
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            if (!response.ok) {
                console.error('OpenRouter API error:', response.status);
                return NextResponse.json({ response: getFallbackResponse(query), source: 'fallback' });
            }

            const data = await response.json();
            const aiResponse = data.choices?.[0]?.message?.content?.trim();

            if (!aiResponse) {
                return NextResponse.json({ response: getFallbackResponse(query), source: 'fallback' });
            }

            return NextResponse.json({ response: aiResponse, source: 'openrouter' });

        } catch (fetchError) {
            console.error('OpenRouter fetch failed:', fetchError.message);
            return NextResponse.json({ response: getFallbackResponse(query), source: 'fallback' });
        }

    } catch (error) {
        console.error('Kaavya chat error:', error);
        return NextResponse.json(
            { response: getFallbackResponse(''), source: 'fallback' },
            { status: 200 }
        );
    }
}

function getFallbackResponse(query) {
    const q = query.toLowerCase();

    if (q.includes('join')) {
        return "For optimal joins, use INNER JOIN when you need matching records from both tables, LEFT JOIN to preserve all source records. Always join on indexed columns like customer_id or order_id for best performance.";
    }
    if (q.includes('optimize') || q.includes('performance')) {
        return "To optimize your pipeline: (1) Add incremental loading instead of full refreshes, (2) Partition large tables by date, (3) Use materialized views for frequently queried aggregations, and (4) Add proper indexing on join columns.";
    }
    if (q.includes('quality') || q.includes('check')) {
        return "Essential data quality checks: Add NOT NULL constraints on key columns, validate referential integrity between tables, check for duplicate records using ROW_NUMBER(), and monitor row count trends to catch unexpected drops.";
    }
    if (q.includes('transform')) {
        return "Consider using dbt for your transformation layer — it provides version control, testing, and documentation out of the box. Structure models as staging → intermediate → marts for clean separation of concerns.";
    }
    if (q.includes('lineage') || q.includes('track')) {
        return "Data lineage tracks how data flows from sources through transformations to targets. Use it to understand impact analysis (what breaks if a source changes) and for debugging data quality issues by tracing back to the root cause.";
    }
    if (q.includes('source') || q.includes('connector')) {
        return "For connecting sources, consider using Airbyte or Fivetran for managed connectors. For databases, use CDC (Change Data Capture) for real-time syncing instead of batch extracts to reduce load on source systems.";
    }

    // Generic fallback
    const responses = [
        "Consider using a LEFT JOIN to preserve all source records, and add null checks on the join columns for data quality.",
        "I'd recommend adding a deduplication step before your final aggregation to ensure accurate results. Use ROW_NUMBER() partitioned by your key columns.",
        "For this pipeline, an incremental loading strategy would significantly improve performance. Load only changed records using a watermark column like updated_at.",
        "Adding data quality assertions at each stage of your pipeline will help catch issues early. Check for null keys, duplicate records, and row count thresholds.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}
