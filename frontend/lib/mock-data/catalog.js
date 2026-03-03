// Rich schema catalog data for all sources + engine definitions

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SOURCE SCHEMAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const catalogSchemas = {
    // Source ID "1" - production_sales.csv
    "1": {
        sourceId: "1",
        sourceName: "production_sales.csv",
        sourceType: "csv",
        tables: [
            {
                name: "production_sales",
                type: "file",
                rowCount: 1200000,
                rowCountDisplay: "1.2M",
                sizeDisplay: "45 MB",
                lastUpdated: "2025-02-27T10:30:00Z",
                description: "Daily sales transactions from all channels",
                tags: ["finance", "daily-refresh"],
                qualityScore: 94,
                usedInPipelines: 3,
                columns: [
                    { name: "transaction_id", type: "string", nullable: false, isPK: true, isFK: false, qualityScore: 100, usedIn: 3, description: "Unique transaction identifier" },
                    { name: "customer_id", type: "string", nullable: false, isPK: false, isFK: true, fkRef: "customer_db.users.id", qualityScore: 98, usedIn: 5, description: "Reference to customer" },
                    { name: "product_id", type: "string", nullable: false, isPK: false, isFK: true, fkRef: "warehouse_db.products.sku", qualityScore: 97, usedIn: 4, description: "Product SKU reference" },
                    { name: "amount", type: "decimal(10,2)", nullable: false, isPK: false, isFK: false, qualityScore: 99, usedIn: 6, description: "Transaction amount in USD" },
                    { name: "currency", type: "string", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 2, description: "ISO currency code" },
                    { name: "date", type: "date", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 4, description: "Transaction date" },
                    { name: "channel", type: "string", nullable: true, isPK: false, isFK: false, qualityScore: 92, usedIn: 2, description: "Sales channel (web, mobile, store)" },
                    { name: "region", type: "string", nullable: true, isPK: false, isFK: false, qualityScore: 88, usedIn: 3, description: "Geographic region" },
                    { name: "discount_pct", type: "decimal(5,2)", nullable: true, isPK: false, isFK: false, qualityScore: 85, usedIn: 1, description: "Applied discount percentage" },
                    { name: "payment_method", type: "string", nullable: true, isPK: false, isFK: false, qualityScore: 96, usedIn: 2, description: "Payment method used" },
                    { name: "status", type: "string", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 3, description: "Transaction status" },
                    { name: "quantity", type: "integer", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 2, description: "Items purchased" },
                    { name: "store_id", type: "string", nullable: true, isPK: false, isFK: false, qualityScore: 78, usedIn: 1, description: "Physical store identifier" },
                    { name: "created_at", type: "timestamp", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 1, description: "Record creation timestamp" },
                    { name: "updated_at", type: "timestamp", nullable: true, isPK: false, isFK: false, qualityScore: 95, usedIn: 1, description: "Last update timestamp" },
                ],
                sampleData: [
                    ["TX1001", "CUST001", "PROD123", "$150.00", "USD", "2025-02-01", "web", "US-East", "10%", "credit_card", "completed", 2, "STR001", "2025-02-01T10:30:00Z", "2025-02-01T10:30:00Z"],
                    ["TX1002", "CUST002", "PROD456", "$275.50", "USD", "2025-02-01", "mobile", "US-West", null, "paypal", "completed", 1, null, "2025-02-01T11:15:00Z", null],
                    ["TX1003", "CUST001", "PROD789", "$89.99", "USD", "2025-02-02", "store", "US-East", "5%", "cash", "completed", 3, "STR002", "2025-02-02T09:00:00Z", null],
                ]
            }
        ]
    },

    // Source ID "2" - customer_db (MySQL)
    "2": {
        sourceId: "2",
        sourceName: "customer_db",
        sourceType: "mysql",
        tables: [
            {
                name: "users",
                type: "table",
                rowCount: 1200000,
                rowCountDisplay: "1.2M",
                lastUpdated: "2025-02-27T09:15:00Z",
                description: "Registered user accounts",
                tags: ["PII", "core"],
                qualityScore: 97,
                usedInPipelines: 8,
                columns: [
                    { name: "id", type: "int", nullable: false, isPK: true, isFK: false, qualityScore: 100, usedIn: 8, description: "Auto-increment primary key" },
                    { name: "email", type: "varchar(255)", nullable: false, isPK: false, isFK: false, qualityScore: 98, usedIn: 5, description: "User email address", tags: ["PII"] },
                    { name: "name", type: "varchar(200)", nullable: true, isPK: false, isFK: false, qualityScore: 95, usedIn: 3, description: "Full name" },
                    { name: "phone", type: "varchar(20)", nullable: true, isPK: false, isFK: false, qualityScore: 72, usedIn: 1, description: "Phone number", tags: ["PII"] },
                    { name: "segment", type: "enum('enterprise','smb','consumer')", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 4, description: "Customer segment" },
                    { name: "country", type: "varchar(2)", nullable: true, isPK: false, isFK: false, qualityScore: 89, usedIn: 3, description: "ISO country code" },
                    { name: "signup_source", type: "varchar(50)", nullable: true, isPK: false, isFK: false, qualityScore: 82, usedIn: 2, description: "How user signed up" },
                    { name: "is_active", type: "boolean", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 3, description: "Account active flag" },
                    { name: "created_at", type: "timestamp", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 2, description: "Account creation date" },
                    { name: "updated_at", type: "timestamp", nullable: true, isPK: false, isFK: false, qualityScore: 94, usedIn: 1, description: "Last profile update" },
                ],
                sampleData: [
                    [1, "john@acme.com", "John Doe", "+1-555-0101", "enterprise", "US", "organic", true, "2024-01-15", "2025-02-20"],
                    [2, "jane@beta.com", "Jane Smith", null, "smb", "UK", "referral", true, "2024-01-20", "2025-02-25"],
                    [3, "alice@corp.co", "Alice Johnson", "+1-555-0303", "consumer", "US", "ads", false, "2024-02-10", null],
                ]
            },
            {
                name: "addresses",
                type: "table",
                rowCount: 1800000,
                rowCountDisplay: "1.8M",
                lastUpdated: "2025-02-27T09:15:00Z",
                description: "User shipping and billing addresses",
                tags: ["PII"],
                qualityScore: 91,
                usedInPipelines: 2,
                columns: [
                    { name: "id", type: "int", nullable: false, isPK: true, isFK: false, qualityScore: 100, usedIn: 2 },
                    { name: "user_id", type: "int", nullable: false, isPK: false, isFK: true, fkRef: "users.id", qualityScore: 100, usedIn: 2 },
                    { name: "type", type: "enum('shipping','billing')", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 1 },
                    { name: "street", type: "varchar(500)", nullable: false, isPK: false, isFK: false, qualityScore: 94, usedIn: 1, tags: ["PII"] },
                    { name: "city", type: "varchar(100)", nullable: false, isPK: false, isFK: false, qualityScore: 96, usedIn: 2 },
                    { name: "state", type: "varchar(50)", nullable: true, isPK: false, isFK: false, qualityScore: 88, usedIn: 1 },
                    { name: "zip", type: "varchar(20)", nullable: false, isPK: false, isFK: false, qualityScore: 93, usedIn: 1 },
                    { name: "country", type: "varchar(2)", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 2 },
                ],
                sampleData: [
                    [1, 1, "shipping", "123 Main St", "New York", "NY", "10001", "US"],
                    [2, 1, "billing", "123 Main St", "New York", "NY", "10001", "US"],
                    [3, 2, "shipping", "456 Oak Ave", "London", null, "SW1A 1AA", "UK"],
                ]
            },
            {
                name: "orders",
                type: "table",
                rowCount: 3400000,
                rowCountDisplay: "3.4M",
                lastUpdated: "2025-02-27T09:15:00Z",
                description: "All customer orders with status tracking",
                tags: ["finance", "core"],
                qualityScore: 96,
                usedInPipelines: 6,
                columns: [
                    { name: "id", type: "int", nullable: false, isPK: true, isFK: false, qualityScore: 100, usedIn: 6 },
                    { name: "user_id", type: "int", nullable: false, isPK: false, isFK: true, fkRef: "users.id", qualityScore: 100, usedIn: 5 },
                    { name: "order_number", type: "varchar(50)", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 3 },
                    { name: "total_amount", type: "decimal(12,2)", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 4 },
                    { name: "status", type: "enum('pending','processing','shipped','delivered','cancelled')", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 3 },
                    { name: "shipping_address_id", type: "int", nullable: true, isPK: false, isFK: true, fkRef: "addresses.id", qualityScore: 95, usedIn: 2 },
                    { name: "payment_status", type: "varchar(20)", nullable: false, isPK: false, isFK: false, qualityScore: 98, usedIn: 2 },
                    { name: "created_at", type: "timestamp", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 2 },
                ],
                sampleData: [
                    [1001, 1, "ORD-2025-001", "$450.00", "delivered", 1, "paid", "2025-01-15T10:00:00Z"],
                    [1002, 2, "ORD-2025-002", "$125.50", "shipped", 3, "paid", "2025-02-01T14:30:00Z"],
                    [1003, 1, "ORD-2025-003", "$89.99", "pending", null, "pending", "2025-02-27T08:00:00Z"],
                ]
            },
        ],
        views: [
            { name: "active_customers", type: "view", description: "Currently active customer accounts", rowCountDisplay: "980K", qualityScore: 97 },
            { name: "order_summary", type: "view", description: "Aggregated order statistics per customer", rowCountDisplay: "1.2M", qualityScore: 95 },
        ]
    },

    // Source ID "3" - warehouse_db (PostgreSQL)
    "3": {
        sourceId: "3",
        sourceName: "warehouse_db",
        sourceType: "postgresql",
        tables: [
            {
                name: "products",
                type: "table",
                rowCount: 5200,
                rowCountDisplay: "5.2K",
                lastUpdated: "2025-02-26T16:45:00Z",
                description: "Product catalog with pricing and categories",
                tags: ["master-data"],
                qualityScore: 99,
                usedInPipelines: 4,
                columns: [
                    { name: "sku", type: "varchar(50)", nullable: false, isPK: true, isFK: false, qualityScore: 100, usedIn: 4 },
                    { name: "name", type: "varchar(200)", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 3 },
                    { name: "category", type: "varchar(100)", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 3 },
                    { name: "subcategory", type: "varchar(100)", nullable: true, isPK: false, isFK: false, qualityScore: 85, usedIn: 1 },
                    { name: "price", type: "decimal(10,2)", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 4 },
                    { name: "cost", type: "decimal(10,2)", nullable: true, isPK: false, isFK: false, qualityScore: 92, usedIn: 2 },
                    { name: "is_active", type: "boolean", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 2 },
                    { name: "created_at", type: "timestamp", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 1 },
                ],
                sampleData: [
                    ["SKU001", "Laptop Pro 16", "Electronics", "Laptops", 1299.99, 899.00, true, "2024-06-01"],
                    ["SKU002", "Office Chair Ergo", "Furniture", "Chairs", 349.50, 180.00, true, "2024-07-15"],
                    ["SKU003", "USB-C Hub", "Electronics", "Accessories", 49.99, 22.50, true, "2024-08-20"],
                ]
            },
            {
                name: "stock",
                type: "table",
                rowCount: 52000,
                rowCountDisplay: "52K",
                lastUpdated: "2025-02-27T06:00:00Z",
                description: "Real-time inventory stock levels per warehouse",
                tags: ["operations"],
                qualityScore: 96,
                usedInPipelines: 3,
                columns: [
                    { name: "id", type: "serial", nullable: false, isPK: true, isFK: false, qualityScore: 100, usedIn: 3 },
                    { name: "product_sku", type: "varchar(50)", nullable: false, isPK: false, isFK: true, fkRef: "products.sku", qualityScore: 100, usedIn: 3 },
                    { name: "warehouse_id", type: "varchar(10)", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 2 },
                    { name: "quantity", type: "integer", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 3 },
                    { name: "reorder_point", type: "integer", nullable: true, isPK: false, isFK: false, qualityScore: 78, usedIn: 1 },
                    { name: "last_counted", type: "timestamp", nullable: true, isPK: false, isFK: false, qualityScore: 85, usedIn: 1 },
                ],
                sampleData: [
                    [1, "SKU001", "WH-EAST", 150, 20, "2025-02-25T12:00:00Z"],
                    [2, "SKU001", "WH-WEST", 85, 15, "2025-02-26T08:00:00Z"],
                    [3, "SKU002", "WH-EAST", 42, 10, "2025-02-27T06:00:00Z"],
                ]
            },
            {
                name: "suppliers",
                type: "table",
                rowCount: 320,
                rowCountDisplay: "320",
                lastUpdated: "2025-02-20T14:00:00Z",
                description: "Supplier master data and contact information",
                tags: ["master-data"],
                qualityScore: 93,
                usedInPipelines: 1,
                columns: [
                    { name: "id", type: "serial", nullable: false, isPK: true, isFK: false, qualityScore: 100, usedIn: 1 },
                    { name: "name", type: "varchar(200)", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 1 },
                    { name: "contact_email", type: "varchar(255)", nullable: true, isPK: false, isFK: false, qualityScore: 88, usedIn: 0 },
                    { name: "country", type: "varchar(2)", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 1 },
                    { name: "lead_time_days", type: "integer", nullable: true, isPK: false, isFK: false, qualityScore: 75, usedIn: 0 },
                ],
                sampleData: [
                    [1, "TechSupply Co", "orders@techsupply.com", "US", 14],
                    [2, "FurnitureDirect", "sales@furnituredirect.co.uk", "UK", 21],
                ]
            },
        ],
        views: [
            { name: "low_stock_alerts", type: "view", description: "Products below reorder point", rowCountDisplay: "89", qualityScore: 96 },
            { name: "product_margins", type: "view", description: "Profit margins by product", rowCountDisplay: "5.2K", qualityScore: 99 },
            { name: "supplier_performance", type: "view", description: "Supplier delivery metrics", rowCountDisplay: "320", qualityScore: 90 },
        ]
    },

    // Source ID "4" - data-lake (S3)
    "4": {
        sourceId: "4",
        sourceName: "data-lake",
        sourceType: "s3",
        tables: [
            {
                name: "sales/",
                type: "directory",
                rowCount: 8500000,
                rowCountDisplay: "8.5M",
                sizeDisplay: "1.2 GB",
                lastUpdated: "2025-02-27T08:00:00Z",
                description: "Partitioned sales data in Parquet format",
                tags: ["parquet", "daily-refresh"],
                qualityScore: 92,
                usedInPipelines: 2,
                columns: [
                    { name: "sale_id", type: "string", nullable: false, isPK: true, isFK: false, qualityScore: 100, usedIn: 2 },
                    { name: "timestamp", type: "timestamp", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 2 },
                    { name: "customer_key", type: "string", nullable: false, isPK: false, isFK: true, fkRef: "customer_db.users.id", qualityScore: 96, usedIn: 2 },
                    { name: "product_key", type: "string", nullable: false, isPK: false, isFK: true, fkRef: "warehouse_db.products.sku", qualityScore: 95, usedIn: 1 },
                    { name: "revenue", type: "double", nullable: false, isPK: false, isFK: false, qualityScore: 99, usedIn: 2 },
                    { name: "partition_date", type: "date", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 1 },
                ],
                sampleData: [
                    ["S-001", "2025-02-27T10:15:00Z", "CUST001", "SKU001", 1299.99, "2025-02-27"],
                    ["S-002", "2025-02-27T10:20:00Z", "CUST002", "SKU003", 49.99, "2025-02-27"],
                ]
            },
            {
                name: "logs/",
                type: "directory",
                rowCount: 45000000,
                rowCountDisplay: "45M",
                sizeDisplay: "4.5 GB",
                lastUpdated: "2025-02-27T07:00:00Z",
                description: "Application event logs in JSON format",
                tags: ["json", "streaming"],
                qualityScore: 78,
                usedInPipelines: 1,
                columns: [
                    { name: "event_id", type: "string", nullable: false, isPK: true, isFK: false, qualityScore: 100, usedIn: 1 },
                    { name: "event_type", type: "string", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 1 },
                    { name: "user_id", type: "string", nullable: true, isPK: false, isFK: false, qualityScore: 68, usedIn: 1 },
                    { name: "payload", type: "json", nullable: true, isPK: false, isFK: false, qualityScore: 55, usedIn: 0 },
                    { name: "timestamp", type: "timestamp", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 1 },
                ],
                sampleData: [
                    ["EVT-001", "page_view", "CUST001", '{"page":"/products"}', "2025-02-27T10:00:00Z"],
                    ["EVT-002", "purchase", "CUST002", '{"order_id":"ORD-001"}', "2025-02-27T10:05:00Z"],
                ]
            },
            {
                name: "exports/",
                type: "directory",
                rowCount: 250000,
                rowCountDisplay: "250K",
                sizeDisplay: "180 MB",
                lastUpdated: "2025-02-25T12:00:00Z",
                description: "Manual CSV exports from various teams",
                tags: ["csv", "manual"],
                qualityScore: 65,
                usedInPipelines: 0,
                columns: [
                    { name: "file_name", type: "string", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 0 },
                    { name: "uploaded_by", type: "string", nullable: true, isPK: false, isFK: false, qualityScore: 70, usedIn: 0 },
                    { name: "upload_date", type: "date", nullable: false, isPK: false, isFK: false, qualityScore: 100, usedIn: 0 },
                ],
                sampleData: [
                    ["q4_marketing_report.csv", "marketing_team", "2025-02-25"],
                    ["annual_review_2024.csv", "finance", "2025-02-20"],
                ]
            }
        ]
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TRANSFORMATION ENGINES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const transformationEngines = [
    {
        id: "pyspark",
        name: "PySpark",
        description: "Distributed data processing on self-hosted Spark clusters",
        color: "#E25A1C",
        features: ["Distributed processing", "Python code generation", "Best for large datasets"],
        configFields: [
            { key: "sparkVersion", label: "Spark Version", type: "select", options: ["3.3", "3.4", "3.5"], default: "3.5" },
            { key: "executorMemory", label: "Executor Memory", type: "select", options: ["2g", "4g", "8g", "16g"], default: "4g" },
            { key: "executorCores", label: "Executor Cores", type: "select", options: ["1", "2", "4", "8"], default: "2" },
            { key: "pythonVersion", label: "Python Version", type: "select", options: ["3.9", "3.10", "3.11", "3.12"], default: "3.11" },
        ]
    },
    {
        id: "glue",
        name: "AWS Glue",
        description: "Serverless Spark ETL service managed by AWS",
        color: "#FF9900",
        features: ["Managed Spark service", "Pay per second", "AWS integration"],
        configFields: [
            { key: "glueVersion", label: "Glue Version", type: "select", options: ["3.0", "4.0"], default: "4.0" },
            { key: "workerType", label: "Worker Type", type: "select", options: ["Standard", "G.1X", "G.2X", "G.4X", "Z.2X"], default: "G.1X" },
            { key: "numberOfWorkers", label: "Number of Workers", type: "select", options: ["2", "5", "10", "20", "50"], default: "5" },
            { key: "iamRole", label: "IAM Role ARN", type: "text", placeholder: "arn:aws:iam::role/GlueRole", default: "" },
        ]
    },
    {
        id: "databricks",
        name: "Databricks",
        description: "Enterprise lakehouse platform with Delta Lake",
        color: "#FF3621",
        features: ["Enterprise Delta Lake", "MLflow integration", "Unity Catalog support"],
        configFields: [
            { key: "workspaceUrl", label: "Workspace URL", type: "text", placeholder: "https://adb-xxx.azuredatabricks.net", default: "" },
            { key: "clusterId", label: "Cluster ID", type: "text", placeholder: "0123-456789-abcdefgh", default: "" },
            { key: "notebookPath", label: "Notebook Path", type: "text", placeholder: "/Workspace/ETL/transform", default: "" },
            { key: "apiToken", label: "API Token", type: "password", placeholder: "dapi...", default: "" },
        ]
    },
    {
        id: "dbt",
        name: "dbt",
        description: "SQL-based transformations with version control and testing",
        color: "#FF694A",
        features: ["SQL-based transformations", "Version controlled", "Great for data warehouses"],
        configFields: [
            { key: "projectDir", label: "Project Folder", type: "text", placeholder: "/path/to/dbt/project", default: "" },
            { key: "targetSchema", label: "Target Schema", type: "text", placeholder: "analytics", default: "analytics" },
            { key: "threads", label: "Thread Count", type: "select", options: ["1", "2", "4", "8", "16"], default: "4" },
            { key: "profileName", label: "Profile Name", type: "text", placeholder: "production", default: "default" },
        ]
    },
];

// Recent catalog access log
export const recentAccess = [
    { table: "users", source: "customer_db", sourceId: "2", accessedAgo: "2 mins ago" },
    { table: "orders", source: "customer_db", sourceId: "2", accessedAgo: "15 mins ago" },
    { table: "production_sales", source: "production_sales.csv", sourceId: "1", accessedAgo: "1 hour ago" },
    { table: "products", source: "warehouse_db", sourceId: "3", accessedAgo: "3 hours ago" },
    { table: "stock", source: "warehouse_db", sourceId: "3", accessedAgo: "yesterday" },
];
