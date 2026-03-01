export const mockSources = [
  {
    id: "1",
    name: "production_sales.csv",
    type: "csv",
    status: "active",
    metadata: {
      rows: "1.2M",
      columns: 15,
      size: "45 MB",
      delimiter: ",",
      sampling: {
        columns: ["transaction_id", "customer_id", "amount", "date", "product_id"],
        sampleRows: [
          ["TX1001", "CUST001", "$150.00", "2025-02-01", "PROD123"],
          ["TX1002", "CUST002", "$275.50", "2025-02-01", "PROD456"],
          ["TX1003", "CUST001", "$89.99", "2025-02-02", "PROD789"],
        ]
      }
    },
    lastIngested: "2025-02-27T10:30:00Z",
    createdAt: "2025-02-25T08:00:00Z"
  },
  {
    id: "2",
    name: "customer_db",
    type: "mysql",
    status: "active",
    metadata: {
      host: "mysql.corp.internal",
      port: 3306,
      database: "customers",
      tables: ["users", "addresses", "orders"],
      rowCount: "2.5M",
      sampling: {
        tables: {
          users: {
            columns: ["id", "email", "name", "created_at"],
            sampleRows: [
              [1, "john@acme.com", "John Doe", "2024-01-15"],
              [2, "jane@beta.com", "Jane Smith", "2024-01-20"],
            ]
          }
        }
      }
    },
    lastIngested: "2025-02-27T09:15:00Z",
    createdAt: "2025-02-24T14:30:00Z"
  },
  {
    id: "3",
    name: "warehouse_db",
    type: "postgresql",
    status: "inactive",
    metadata: {
      host: "postgres.warehouse.internal",
      port: 5432,
      database: "inventory",
      tables: ["products", "stock", "suppliers"],
      rowCount: "3.8M",
      sampling: {
        tables: {
          products: {
            columns: ["sku", "name", "category", "price"],
            sampleRows: [
              ["SKU001", "Laptop Pro", "Electronics", 1299.99],
              ["SKU002", "Office Chair", "Furniture", 349.50],
            ]
          }
        }
      }
    },
    lastIngested: "2025-02-26T16:45:00Z",
    createdAt: "2025-02-23T11:20:00Z"
  },
  {
    id: "4",
    name: "data-lake",
    type: "s3",
    status: "active",
    metadata: {
      bucket: "synkrasis-data-lake",
      region: "us-east-1",
      prefix: "raw/",
      files: 156,
      size: "2.3 GB",
      sampling: {
        recentFiles: ["sales_20250227.parquet", "users_snapshot.json", "events_20250227.avro"]
      }
    },
    lastIngested: "2025-02-27T08:00:00Z",
    createdAt: "2025-02-22T09:00:00Z"
  }
];
