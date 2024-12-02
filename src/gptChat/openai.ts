import { OpenAI } from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const explorerPrompt = `
Your task is to explore an SQLite database and provide a structured report of its schema and contents. Follow the steps below carefully to deliver the required results:

Step 1: Connect to the Database
Establish a connection to the SQLite database file provided.
Ensure that the database file exists and is accessible.

Step 2: List All Tables
Retrieve all table names in the database using the following SQL query:
SELECT name FROM sqlite_master WHERE type='table';
Collect the names of all tables and save them in a list.

Step 3: Explore Columns in Each Table
For each table in the database:
Retrieve the column details (name, data type, constraints) using the following SQL query:
PRAGMA table_info(<table_name>);
Replace <table_name> with the actual table name.
Record the following information for each column: Column name, Data type, Whether the column is a primary key, Whether the column allows NULL values.

Step 4: Inspect Sample Data
For each table, fetch a small sample of rows using the following SQL query:
SELECT * FROM <table_name> LIMIT 5;
Replace <table_name> with the actual table name.
Collect the sample rows and store them in a readable format (e.g., JSON or list of dictionaries).

Step 5: Summarize the Database
Summarize the contents of the database by providing:
The number of tables in the database.
The names of all tables.
A list of potentially useful tables for querying based on their names or column content.

Step 6: Deliver the Results
Combine all the collected information into a structured JSON format with the following structure:
{
    "tables": [
        {
            "table_name": "<table_name>",
            "columns": [
                {
                    "column_name": "<column_name>",
                    "data_type": "<data_type>",
                    "is_primary_key": <true/false>,
                    "is_nullable": <true/false>
                },
                ...
            ],
            "sample_data": [
                {
                    "column1": "value1",
                    "column2": "value2",
                    ...
                },
                ...
            ]
        },
        ...
    ],
    "summary": {
        "total_tables": <number>,
        "table_names": ["<table1>", "<table2>", ...],
        "notes": "<any observations about useful tables or data>"
    }
}
Deliver the JSON file or object to me for further analysis.

Step 7: Error Handling
If any errors occur (e.g., missing permissions, corrupt database), document the error message and the step where it occurred.
Skip any problematic tables, but include a note in the final summary about the skipped items.
Example of Expected Output
Here’s an example of the output I expect:
{
    "tables": [
        {
            "table_name": "amazon_sales",
            "columns": [
                {
                    "column_name": "order_id",
                    "data_type": "INTEGER",
                    "is_primary_key": true,
                    "is_nullable": false
                },
                {
                    "column_name": "city",
                    "data_type": "TEXT",
                    "is_primary_key": false,
                    "is_nullable": true
                },
                {
                    "column_name": "product_line",
                    "data_type": "TEXT",
                    "is_primary_key": false,
                    "is_nullable": true
                }
            ],
            "sample_data": [
                {
                    "order_id": 1,
                    "city": "New York",
                    "product_line": "Electronics"
                },
                {
                    "order_id": 2,
                    "city": "Los Angeles",
                    "product_line": "Clothing"
                }
            ]
        },
        {
            "table_name": "customers",
            "columns": [
                {
                    "column_name": "customer_id",
                    "data_type": "INTEGER",
                    "is_primary_key": true,
                    "is_nullable": false
                },
                {
                    "column_name": "customer_name",
                    "data_type": "TEXT",
                    "is_primary_key": false,
                    "is_nullable": false
                }
            ],
            "sample_data": [
                {
                    "customer_id": 101,
                    "customer_name": "John Doe"
                },
                {
                    "customer_id": 102,
                    "customer_name": "Jane Smith"
                }
            ]
        }
    ],
    "summary": {
        "total_tables": 2,
        "table_names": ["amazon_sales", "customers"],
        "notes": "The 'amazon_sales' table appears to contain transaction data, while 'customers' contains customer information."
    }
}`;
