export const mockTransformations = [
  {
    id: "t1",
    name: "Sales Analytics Pipeline",
    type: "pyspark",
    nodes: [
      { 
        id: "1", 
        type: "source", 
        data: { label: "sales.csv", type: "csv" }, 
        position: { x: 100, y: 100 } 
      },
      { 
        id: "2", 
        type: "source", 
        data: { label: "customers (MySQL)", type: "mysql" }, 
        position: { x: 100, y: 250 } 
      },
      { 
        id: "3", 
        type: "transform", 
        data: { label: "Join on customer_id", type: "join" }, 
        position: { x: 400, y: 175 } 
      },
      { 
        id: "4", 
        type: "transform", 
        data: { label: "Aggregate by country", type: "aggregate" }, 
        position: { x: 700, y: 175 } 
      },
      { 
        id: "5", 
        type: "target", 
        data: { label: "Snowflake", type: "snowflake" }, 
        position: { x: 1000, y: 175 } 
      }
    ],
    edges: [
      { 
        id: "e1-3", 
        source: "1", 
        target: "3",
        markerEnd: { type: 'arrowclosed' }
      },
      { 
        id: "e2-3", 
        source: "2", 
        target: "3",
        markerEnd: { type: 'arrowclosed' }
      },
      { 
        id: "e3-4", 
        source: "3", 
        target: "4",
        markerEnd: { type: 'arrowclosed' }
      },
      { 
        id: "e4-5", 
        source: "4", 
        target: "5",
        markerEnd: { type: 'arrowclosed' }
      }
    ],
    createdAt: "2025-02-26T10:00:00Z"
  },
  {
    id: "t2",
    name: "dbt Customer 360",
    type: "dbt",
    nodes: [
      { 
        id: "1", 
        type: "source", 
        data: { label: "orders (Postgres)", type: "postgresql" }, 
        position: { x: 100, y: 100 } 
      },
      { 
        id: "2", 
        type: "source", 
        data: { label: "customers (MySQL)", type: "mysql" }, 
        position: { x: 100, y: 250 } 
      },
      { 
        id: "3", 
        type: "transform", 
        data: { label: "stg_orders (dbt)", type: "dbt_model" }, 
        position: { x: 400, y: 125 } 
      },
      { 
        id: "4", 
        type: "transform", 
        data: { label: "stg_customers (dbt)", type: "dbt_model" }, 
        position: { x: 400, y: 225 } 
      },
      { 
        id: "5", 
        type: "transform", 
        data: { label: "dim_customers (dbt)", type: "dbt_model" }, 
        position: { x: 700, y: 175 } 
      },
      { 
        id: "6", 
        type: "target", 
        data: { label: "Aurora DB", type: "aurora" }, 
        position: { x: 1000, y: 175 } 
      }
    ],
    edges: [
      { 
        id: "e1-3", 
        source: "1", 
        target: "3",
        markerEnd: { type: 'arrowclosed' }
      },
      { 
        id: "e2-4", 
        source: "2", 
        target: "4",
        markerEnd: { type: 'arrowclosed' }
      },
      { 
        id: "e3-5", 
        source: "3", 
        target: "5",
        markerEnd: { type: 'arrowclosed' }
      },
      { 
        id: "e4-5", 
        source: "4", 
        target: "5",
        markerEnd: { type: 'arrowclosed' }
      },
      { 
        id: "e5-6", 
        source: "5", 
        target: "6",
        markerEnd: { type: 'arrowclosed' }
      }
    ],
    createdAt: "2025-02-25T15:30:00Z"
  }
];
