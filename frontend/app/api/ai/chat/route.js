import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { query, context } = await request.json();

        if (!query || !query.trim()) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;

        if (apiKey) {
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
You help users with ETL/ELT pipeline design, data quality, SQL joins, dbt, and data lineage.
Keep responses concise (2-3 sentences max), practical, and actionable.
${context ? `\nCurrent pipeline context: ${JSON.stringify(context)}` : ''}`
                            },
                            { role: 'user', content: query }
                        ],
                        temperature: 0.7,
                        max_tokens: 300
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiResponse = data.choices?.[0]?.message?.content?.trim();
                    if (aiResponse) {
                        return NextResponse.json({ response: aiResponse, source: 'openrouter' });
                    }
                }
            } catch (e) {
                console.error('OpenRouter failed:', e.message);
            }
        }

        // Smart fallback - Kaavya's built-in knowledge
        const answer = getSmartResponse(query);
        return NextResponse.json({ response: answer, source: 'kaavya' });

    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json(
            { response: getSmartResponse('help'), source: 'kaavya' },
            { status: 200 }
        );
    }
}

function getSmartResponse(query) {
    const q = query.toLowerCase();
    const words = q.split(/\s+/);

    // ━━━ JOIN related ━━━
    if (match(q, ['join', 'merge', 'combine', 'link tables', 'connect tables'])) {
        if (match(q, ['left', 'outer'])) return "A LEFT JOIN keeps all records from the left table and matched records from the right. Use it when you need to preserve all source records even if there's no match — great for customer analytics where not all customers have orders.";
        if (match(q, ['inner'])) return "INNER JOIN returns only matching records from both tables. It's efficient and ideal when you need strict matches, like joining orders with products where every order must have a valid product_id.";
        if (match(q, ['cross', 'cartesian'])) return "CROSS JOIN creates a Cartesian product — every row paired with every other row. Use sparingly! It's useful for generating date scaffolding or creating all possible combinations for gap analysis.";
        if (match(q, ['which', 'what', 'should', 'best', 'recommend', 'use'])) return "Choose your join based on your use case: INNER JOIN for strict matches (orders ↔ products), LEFT JOIN to preserve all source records (customers ↔ orders), and FULL OUTER JOIN for reconciliation. Always join on indexed columns for performance.";
        return "For optimal joins: (1) Always join on indexed columns like customer_id or order_id, (2) Filter early to reduce the join dataset size, (3) Use LEFT JOIN to preserve all source records, and (4) Consider hash joins for large tables — they're typically faster than nested loop joins.";
    }

    // ━━━ OPTIMIZE / PERFORMANCE ━━━
    if (match(q, ['optimize', 'performance', 'slow', 'fast', 'speed', 'improve', 'efficient'])) {
        if (match(q, ['pipeline', 'etl', 'elt'])) return "To optimize your pipeline: (1) Switch to incremental loading using watermark columns like updated_at, (2) Partition target tables by date for faster queries, (3) Use parallel execution for independent tasks, and (4) Add intermediate materialized views for heavy aggregations.";
        if (match(q, ['query', 'sql'])) return "SQL optimization tips: Add indexes on WHERE/JOIN columns, avoid SELECT * (specify columns), use CTEs for readability, and leverage window functions instead of self-joins. For large datasets, consider approximate aggregation functions.";
        return "Key optimization strategies: (1) Incremental loading over full refreshes, (2) Proper partitioning and clustering, (3) Materialized views for repeated aggregations, (4) Connection pooling for database sources, and (5) Parallel task execution where dependencies allow.";
    }

    // ━━━ DATA QUALITY ━━━
    if (match(q, ['quality', 'check', 'test', 'valid', 'null', 'duplicate', 'assert', 'monitor'])) {
        if (match(q, ['dbt'])) return "In dbt, add tests in your schema.yml: unique &not_null for primary keys, accepted_values for enums, and relationships for foreign keys. Use dbt-expectations package for advanced checks like row count ranges and column value distributions.";
        return "Essential data quality checks for your pipeline: (1) NOT NULL on key columns (customer_id, order_id), (2) Uniqueness checks using COUNT vs COUNT(DISTINCT), (3) Referential integrity between tables, (4) Row count trending to catch unexpected drops, and (5) Value range validation for numeric fields.";
    }

    // ━━━ DBT ━━━
    if (match(q, ['dbt', 'model', 'staging', 'mart', 'intermediate'])) {
        if (match(q, ['structure', 'organize', 'structure', 'pattern'])) return "Follow the dbt project structure: staging (stg_) → intermediate (int_) → marts (fct_/dim_). Staging models do 1:1 source mapping with light cleanup, intermediate handles complex business logic, and marts are your final consumption-ready models.";
        if (match(q, ['incremental'])) return "For dbt incremental models, use is_incremental() with a watermark column: {% if is_incremental() %} WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }}) {% endif %}. Add unique_key for merge behavior and on_schema_change='sync_all_columns' for flexibility.";
        return "dbt best practices: Use ref() for all model dependencies, add documentation with descriptions in schema.yml, implement tests on every model, use tags to group related models, and leverage dbt packages like dbt-utils and dbt-expectations for common transformations and tests.";
    }

    // ━━━ TRANSFORMATION ━━━
    if (match(q, ['transform', 'aggregate', 'group', 'calculation', 'compute', 'formula'])) {
        if (match(q, ['aggregate', 'group', 'sum', 'count', 'average'])) return "For aggregations, use GROUP BY with the appropriate aggregate functions: SUM for totals, COUNT(DISTINCT) for unique counts, AVG for averages. Add HAVING for post-aggregation filters. Consider window functions (OVER PARTITION BY) when you need both detail and aggregated values.";
        return "Transform recommendations: (1) Clean and standardize data in staging (trim, lowercase, date parsing), (2) Apply business logic in intermediate models, (3) Use CASE statements for categorization, (4) Leverage window functions for running totals and rankings, and (5) Document all transformation logic.";
    }

    // ━━━ SOURCE / CONNECTOR ━━━
    if (match(q, ['source', 'connector', 'extract', 'ingest', 'connect', 'database', 'api', 'csv', 'file'])) {
        if (match(q, ['csv', 'file', 'excel'])) return "For file-based sources like CSV: Use a staging area (S3/GCS) for landing files, validate schema on ingestion, handle encoding issues (UTF-8), implement file archival after processing, and add deduplication logic since files may be re-uploaded.";
        if (match(q, ['api', 'rest'])) return "For API sources: Implement pagination handling, respect rate limits with exponential backoff, store raw JSON in a landing zone before parsing, add idempotency keys to prevent duplicate ingestion, and handle schema drift gracefully.";
        return "Source connection best practices: (1) Use CDC (Change Data Capture) for real-time database syncing, (2) Implement connection pooling, (3) Add retry logic with exponential backoff, (4) Validate schemas on ingestion, and (5) Consider tools like Airbyte or Fivetran for managed connectors.";
    }

    // ━━━ LINEAGE ━━━
    if (match(q, ['lineage', 'trace', 'track', 'impact', 'dependency', 'downstream', 'upstream'])) {
        return "Data lineage helps you: (1) Impact analysis — know what breaks when a source changes, (2) Debug data quality issues by tracing to the root cause, (3) Compliance — prove data transformations for audits, and (4) Optimization — identify unused or redundant pipeline branches. Check the Lineage tab for your pipeline's visual graph.";
    }

    // ━━━ TARGET / LOAD ━━━
    if (match(q, ['target', 'load', 'destination', 'warehouse', 'snowflake', 'bigquery', 'redshift'])) {
        return "For loading to targets: (1) Use MERGE/UPSERT for incremental updates with a unique key, (2) Implement SCD Type 2 for tracking historical changes, (3) Partition target tables by date for query performance, (4) Add post-load quality checks, and (5) Consider Snowflake for elastic compute or BigQuery for serverless analytics.";
    }

    // ━━━ PIPELINE DESIGN ━━━
    if (match(q, ['design', 'pipeline', 'architect', 'build', 'create', 'plan', 'best practice'])) {
        return "Pipeline design principles: (1) Modular stages — Extract, Stage, Transform, Load, (2) Idempotent operations so reruns don't create duplicates, (3) Schema validation at ingestion, (4) Quality gates between stages, (5) Alerting on failures and anomalies. Start with your target schema and work backwards to sources.";
    }

    // ━━━ ERROR / DEBUG ━━━
    if (match(q, ['error', 'fail', 'debug', 'issue', 'problem', 'fix', 'broken', 'wrong'])) {
        return "Debugging pipeline issues: (1) Check logs at each stage for the first failure, (2) Validate source data hasn't changed schema, (3) Look for NULL key values causing join failures, (4) Check for data volume anomalies (sudden spikes or drops), and (5) Test with a small sample before full runs. What specific error are you seeing?";
    }

    // ━━━ SCHEDULING / ORCHESTRATION ━━━
    if (match(q, ['schedule', 'orchestrat', 'airflow', 'cron', 'trigger', 'automate'])) {
        return "For pipeline orchestration: Use Apache Airflow or Dagster for dependency-aware scheduling. Set up DAGs with proper retry policies, SLA monitoring, and alerting. Run critical pipelines early in the day, add buffer time between dependent tasks, and implement circuit breakers for external API dependencies.";
    }

    // ━━━ GREETING / HELP ━━━
    if (match(q, ['hello', 'hi', 'hey', 'help', 'what can you', 'who are'])) {
        return "Hi! I'm Kaavya, your data engineering assistant. I can help you with: pipeline design & optimization, SQL join strategies, data quality checks, dbt best practices, source & target recommendations, and data lineage analysis. What would you like to work on?";
    }

    // ━━━ GENERAL FALLBACK — still contextual ━━━
    const topics = [
        "For your pipeline, I'd recommend adding data quality assertions between stages — check for null keys, duplicate records, and row count thresholds. This catches issues early before they propagate downstream.",
        "Consider implementing incremental loading using a watermark column (like updated_at). It dramatically reduces processing time and resource usage compared to full refreshes, especially as your data grows.",
        "A good practice is to separate your pipeline into clear stages: raw ingestion → staging (light cleanup) → transformation (business logic) → mart (consumer-ready). This makes debugging and maintenance much easier.",
        "Have you looked at your column-level lineage? Understanding which source columns flow into which target columns helps with impact analysis and debugging. Check the Lineage page for a visual breakdown.",
        "For better pipeline reliability, add idempotency to your loads using MERGE/UPSERT operations with unique keys. This way, reruns don't create duplicates — critical for production pipelines.",
    ];
    return topics[Math.floor(Math.random() * topics.length)];
}

function match(text, keywords) {
    return keywords.some(k => text.includes(k));
}
