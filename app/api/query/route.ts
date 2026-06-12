import { NextResponse } from 'next/server';
import sql from 'mssql';
import { Pool as PgPool } from 'pg';
import { GoogleGenAI } from '@google/genai';
import { decrypt } from '@/lib/crypto';
import jwt from 'jsonwebtoken';
import { getConnection } from '@/lib/db';

// Multi-database AI query handler
export async function POST(req: Request) {
  try {
    const { query, db_name: requestedDbName } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    } catch (err: any) {
      console.error('JWT Verification Failed:', err.message, err.name);
      return NextResponse.json({ error: `Invalid token. Please log in again. Detail: ${err.message}` }, { status: 401 });
    }

    const userId = decoded.userId;
    const pool = await getConnection();

    // Fetch the user's configured database
    let userDbRes = await pool.request()
      .input('userId', userId)
      .query('SELECT TOP 1 db_username, db_password, db_type, server, port, db_name FROM user_credential WHERE id = @userId');

    if (userDbRes.recordset.length === 0) {
      return NextResponse.json({ error: `Please configure your database credentials before querying.` }, { status: 400 });
    }

    const connDetails = userDbRes.recordset[0];
    const db_name = requestedDbName || connDetails.db_name || process.env.DB_NAME || '';
    const db_type = connDetails.db_type || 'mssql'; 

    // Dynamically adjust system instruction based on db_type
    // const dbDialect = 'SQL Server';
    // const limitSyntax = 'TOP 100';
    // const limitExample = db_type === 'postgres' ? 'SELECT ... LIMIT 100' : 'SELECT TOP 100 ...';
    const dbDialect =
  db_type === 'postgres'
    ? 'PostgreSQL'
    : 'SQL Server';

const limitSyntax =
  db_type === 'postgres'
    ? 'LIMIT 100'
    : 'TOP 100';

    const limitExample = db_type === 'postgres' ? 'SELECT ... LIMIT 100' : 'SELECT TOP 100 ...';


    const systemInstruction = `You are an expert ${dbDialect} query assistant.

Your job is to convert natural language questions into valid ${dbDialect} SELECT queries using ONLY the provided database schema.

Rules:

1. Generate ONLY read-only SQL queries.
2. Never generate INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER, CREATE, EXEC, MERGE, or any write operation.
3. Use only tables and columns that exist in the provided schema.
4. Respect foreign key relationships when creating JOINs.
5. Generate optimized and syntactically correct ${dbDialect} queries.
6. ALWAYS limit results by using \`${limitSyntax}\` (e.g., \`${limitExample}\`) to prevent returning massive datasets and ensure fast execution, unless the user explicitly asks for more.
7. NEVER query from database views (like 'Order Subtotals', 'Sales by Category', etc.). ALWAYS use standard JOINs across base tables (e.g., Orders, Order Details, Products) to compute the required aggregations.
8. Always return a JSON response.

Response Format:

If the request can be answered:

{
"success": true,
"sql": "SELECT ...",
"message": "Brief plain-language explanation of what the query does (1-2 sentences maximum).",
"suggestions": []
}

If the request references a table, column, or business concept that does not exist in the schema:

{
"success": false,
"sql": null,
"message": "The requested information is not available in the current database schema.",
"reason": "Missing table, column, or unsupported business concept.",
"suggestions": [
"employees",
"departments",
"jobs"
]
}

Validation Rules:

* Before generating SQL, verify that every table exists.
* Before generating SQL, verify that every column exists.
* Never hallucinate tables or columns.
* Never assume missing business entities.
* If the user asks for data such as customers, orders, products, sales, revenue, invoices, or transactions and those entities do not exist in the schema, do not generate SQL.
* Instead, return success=false with an explanation and relevant suggestions.

Important:

* Return valid JSON only.
* Do not wrap the response in markdown.
* Do not include explanations outside the JSON.
* Do not include code fences.
* If uncertain, return success=false instead of guessing.`;

    // Fetch the specific database schema based on the selected db_name
    let schemaRes = await pool.request()
      .input('db_name', db_name)
      .query('SELECT schema_json FROM database_schema WHERE database_name = @db_name');
    
    let schemaContext = '';

    // HARD LIMIT: Ensure schemaContext never exceeds a safe prompt size to prevent TPM Quota limits
    const MAX_CHARS = 15000;

    if (schemaRes.recordset.length > 0) {
      const schemaData = JSON.parse(schemaRes.recordset[0].schema_json);
      
      // Compress schema to save tokens: Group by table
      const tables: Record<string, string[]> = {};
      schemaData.forEach((row: any) => {
         const sName = row.TABLE_SCHEMA || row.table_schema || '';
         const baseName = row.TABLE_NAME || row.table_name;
         
         // Format as Schema.Table if schema exists and isn't a default one that is implied, 
         // but for AdventureWorks and complex MSSQL databases it's safer to always use it.
         const tName = (sName && sName !== 'dbo' && sName !== 'public') 
                       ? `${sName}.${baseName}` 
                       : baseName;

         const cName = row.COLUMN_NAME || row.column_name;
         const dType = row.DATA_TYPE || row.data_type;
         if (!tables[tName]) tables[tName] = [];
         tables[tName].push(`${cName} (${dType})`);
      });
      
      schemaContext = Object.entries(tables)
         .map(([table, cols]) => `Table: ${table}\nColumns: ${cols.join(', ')}`)
         .join('\n\n');
         
      if (schemaContext.length > MAX_CHARS) {
         schemaContext = schemaContext.substring(0, MAX_CHARS) + '\n\n... (Schema truncated automatically to fit within free API limits. Please use a paid API key for full schema access)';
      }
    } else {
      // Fallback: If schema is missing from database_schema table, fetch it dynamically
      console.log(`Schema for '${db_name}' not found in cache. Fetching dynamically...`);
      try {
        let schemaResultData: any[] = [];
        
        // Determine connection details based on whether this is the user's private db or a global db
        const isPrivateDb = connDetails && db_name === connDetails.db_name;
        const targetServer = isPrivateDb ? connDetails.server : process.env.DB_SERVER;
        const targetPort = isPrivateDb ? connDetails.port : parseInt(process.env.DB_PORT || '1433', 10);
        const targetUser = isPrivateDb ? connDetails.db_username : process.env.DB_USER;
        const targetPassword = isPrivateDb ? decrypt(connDetails.db_password) : process.env.DB_PASSWORD;
        const targetType = isPrivateDb ? connDetails.db_type : 'mssql'; // env defaults to mssql
        
        if (targetType === 'mssql') {
          const tempPool = await new sql.ConnectionPool({
            user: targetUser,
            password: targetPassword as string,
            server: targetServer as string,
            database: db_name,
            port: targetPort,
            options: { encrypt: true, trustServerCertificate: true }
          }).connect();
          
          const schemaQuery = `
            SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;
          `;
          const result = await tempPool.request().query(schemaQuery);
          schemaResultData = result.recordset;
          await tempPool.close();
        } else if (targetType === 'postgres') {
          const pgPool = new PgPool({
            user: targetUser,
            password: targetPassword as string,
            host: targetServer as string,
            database: db_name,
            port: targetPort,
            ssl: { rejectUnauthorized: false }
          });
          const client = await pgPool.connect();
          const schemaQuery = `
            SELECT table_schema, table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name, ordinal_position;
          `;
          const result = await client.query(schemaQuery);
          schemaResultData = result.rows;
          client.release();
          await pgPool.end();
        }

        if (schemaResultData.length === 0) {
           return NextResponse.json({ error: `Connected to '${db_name}' successfully, but no tables were found in the database.` }, { status: 400 });
        }

        // Save for future use
        const schemaJson = JSON.stringify(schemaResultData);
        await pool.request()
          .input('database_name', db_name)
          .input('database_type', db_type)
          .input('schema_json', schemaJson)
          .query('INSERT INTO database_schema (database_name, database_type, schema_json) VALUES (@database_name, @database_type, @schema_json)');

        const tables: Record<string, string[]> = {};
        schemaResultData.forEach((row: any) => {
           const sName = row.TABLE_SCHEMA || row.table_schema || '';
           const baseName = row.TABLE_NAME || row.table_name;
           
           const tName = (sName && sName !== 'dbo' && sName !== 'public') 
                         ? `${sName}.${baseName}` 
                         : baseName;

           const cName = row.COLUMN_NAME || row.column_name;
           const dType = row.DATA_TYPE || row.data_type;
           if (!tables[tName]) tables[tName] = [];
           tables[tName].push(`${cName} (${dType})`);
        });
        
        schemaContext = Object.entries(tables)
           .map(([table, cols]) => `Table: ${table}\nColumns: ${cols.join(', ')}`)
           .join('\n\n');
           
        if (schemaContext.length > MAX_CHARS) {
           schemaContext = schemaContext.substring(0, MAX_CHARS) + '\n\n... (Schema truncated automatically to fit within free API limits. Please use a paid API key for full schema access)';
        }
      } catch (fallbackErr: any) {
        console.error("Fallback Schema Fetch Error:", fallbackErr);
        return NextResponse.json({ error: `Schema for database '${db_name}' could not be cached or fetched. Error: ${fallbackErr.message}` }, { status: 400 });
      }
    }

    const fullPrompt = `
Here is the database schema for '${db_name}' that you must use:
${schemaContext}

User Query: ${query}
`;

    // Initialize Gemini API
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1,
                responseMimeType: "application/json",
            }
        });
        break; // Break out of loop on success
      } catch (e1: any) {
        console.error(`Google API Raw Error:`, e1);
        
        // Handle 503 Overloaded
        if (e1.message && e1.message.includes('503')) {
          retries--;
          if (retries === 0) {
             throw new Error(`Google AI API is overloaded. Please try again in a few moments.`);
          }
          await new Promise(res => setTimeout(res, 2000));
        } 
        // Other errors (including 429)
        else {
          throw new Error(`Google API Error: ${e1.message}`);
        }
      }
    }

    const aiText = response.text;

    if (!aiText) {
      throw new Error("Failed to generate response from Gemini");
    }

    let parsed;
    try {
        parsed = JSON.parse(aiText);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to parse AI response as JSON.' }, { status: 500 });
    }

    if (!parsed.success) {
        let errorMessage = parsed.message || "The requested information is not available.";
        if (parsed.reason) errorMessage += " Reason: " + parsed.reason;
        if (parsed.suggestions && parsed.suggestions.length > 0) {
            errorMessage += " Try asking about: " + parsed.suggestions.join(', ');
        }
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const sqlQuery = parsed.sql;
    if (!sqlQuery) {
         return NextResponse.json({ error: 'Failed to extract SQL query from AI response.' }, { status: 400 });
    }

    const explanation = parsed.message || "Generated SQL query.";

    let data: any[] = [];
    try {
        // Determine connection details based on whether this is the user's private db or a global db
        const isPrivateDb = connDetails && db_name === connDetails.db_name;
        const targetServer = isPrivateDb ? connDetails.server : process.env.DB_SERVER;
        const targetPort = isPrivateDb ? connDetails.port : parseInt(process.env.DB_PORT || '1433', 10);
        const targetUser = isPrivateDb ? connDetails.db_username : process.env.DB_USER;
        const targetPassword = isPrivateDb ? decrypt(connDetails.db_password) : process.env.DB_PASSWORD;
        const targetType = isPrivateDb ? connDetails.db_type : 'mssql'; // env defaults to mssql

        if (targetType === 'mssql') {
          const execPool = await new sql.ConnectionPool({
            user: targetUser,
            password: targetPassword as string,
            server: targetServer as string,
            database: db_name,
            port: targetPort,
            options: { encrypt: true, trustServerCertificate: true }
          }).connect();
          
          let execResult = await execPool.request().query(sqlQuery);
          data = execResult.recordset;
          await execPool.close();
        } else if (targetType === 'postgres') {
          const pgPool = new PgPool({
            user: targetUser,
            password: targetPassword as string,
            host: targetServer as string,
            database: db_name,
            port: targetPort
          });
          const client = await pgPool.connect();
          const result = await client.query(sqlQuery);
          data = result.rows || [];
          client.release();
          await pgPool.end();
        } else {
            return NextResponse.json({ error: 'Unsupported database type configured.' }, { status: 400 });
        }
    } catch (dbError: any) {
        console.error("Database execution error:", dbError);
        return NextResponse.json({ 
            error: 'Database execution failed.', 
            details: dbError.message,
            sql: sqlQuery
        }, { status: 500 });
    }

    // Return the formatted response
    return NextResponse.json({
        question: query,
        correctedQuestion: explanation, // Using explanation as "correctedQuestion" / description
        sql: sqlQuery,
        data: data
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
