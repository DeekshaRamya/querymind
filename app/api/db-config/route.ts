import { NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/crypto';
import jwt from 'jsonwebtoken';
import { Pool as PgPool } from 'pg';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    const userId = decoded.userId;
    const body = await request.json();
    let { db_type, server, port, db_username, db_password, db_name } = body;

    if (!db_type || !server || !port || !db_username || !db_password || !db_name) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all database configuration fields' },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    const checkResult = await pool.request()
      .input('userId', userId)
      .input('db_name', db_name)
      .query('SELECT uc_id, db_password FROM user_credential WHERE id = @userId AND db_name = @db_name');

    let unencryptedPassword = db_password;
    let encryptedPasswordForDb = '';

    if (db_password === "********") {
      if (checkResult.recordset.length > 0) {
        encryptedPasswordForDb = checkResult.recordset[0].db_password;
        try {
          unencryptedPassword = decrypt(encryptedPasswordForDb);
        } catch (e) {
          console.error("Failed to decrypt existing password", e);
        }
      }
    } else {
      encryptedPasswordForDb = encrypt(db_password);
    }

    if (checkResult.recordset.length > 0) {
      const existingUcId = checkResult.recordset[0].uc_id;
      await pool.request()
        .input('uc_id', existingUcId)
        .input('userId', userId)
        .input('db_username', db_username)
        .input('db_password', encryptedPasswordForDb)
        .input('db_type', db_type)
        .input('server', server)
        .input('port', port)
        .input('db_name', db_name)
        .query(`
          UPDATE user_credential 
          SET db_username = @db_username, db_password = @db_password, db_type = @db_type, server = @server, port = @port, db_name = @db_name
          WHERE uc_id = @uc_id AND id = @userId
        `);
    } else {
      let nextId = 1;
      try {
        const maxIdResult = await pool.request().query('SELECT MAX(uc_id) as maxId FROM user_credential');
        if (maxIdResult.recordset[0] && maxIdResult.recordset[0].maxId !== null) {
          nextId = maxIdResult.recordset[0].maxId + 1;
        }
      } catch (e) { }
      await pool.request()
        .input('uc_id', nextId)
        .input('userId', userId)
        .input('db_username', db_username)
        .input('db_password', encryptedPasswordForDb)
        .input('db_type', db_type)
        .input('server', server)
        .input('port', port)
        .input('db_name', db_name)
        .query(`
          INSERT INTO user_credential (uc_id, id, db_username, db_password, db_type, server, port, db_name) 
          VALUES (@uc_id, @userId, @db_username, @db_password, @db_type, @server, @port, @db_name)
        `);
    }

    try {
      let schemaResultData: any[] = [];

      if (db_type === 'mssql') {
        const tempConfig = {
          user: db_username,
          password: unencryptedPassword,
          server: server,
          database: db_name,
          port: parseInt(port, 10),
          options: { encrypt: true, trustServerCertificate: true }
        };

        let tempPool;
        try {
          tempPool = await new sql.ConnectionPool(tempConfig).connect();
          const schemaQuery = `
            SELECT
                TABLE_SCHEMA,
                TABLE_NAME,
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;
          `;
          const schemaResult = await tempPool.request().query(schemaQuery);
          schemaResultData = schemaResult.recordset;
          await tempPool.close();
        } catch (dbErr: any) {
          throw new Error('Could not connect to the MSSQL database: ' + dbErr.message);
        }
      } else if (db_type === 'postgres') {
        const pgPool = new PgPool({
          user: db_username,
          password: unencryptedPassword,
          host: server,
          database: db_name,
          port: parseInt(port, 10)
        });
        try {
          const client = await pgPool.connect();
          const schemaQuery = `
            SELECT 
              table_schema as "TABLE_SCHEMA",
              table_name as "TABLE_NAME", 
              column_name as "COLUMN_NAME", 
              data_type as "DATA_TYPE", 
              character_maximum_length as "CHARACTER_MAXIMUM_LENGTH"
            FROM information_schema.columns
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name, ordinal_position;
          `;
          const result = await client.query(schemaQuery);
          schemaResultData = result.rows;
          client.release();
          await pgPool.end();
        } catch (dbErr: any) {
          throw new Error('Could not connect to the PostgreSQL database: ' + dbErr.message);
        }
      }

      const schemaJson = JSON.stringify(schemaResultData);

      const schemaCheck = await pool.request()
        .input('db_name', db_name)
        .query('SELECT schema_id FROM database_schema WHERE database_name = @db_name');

      if (schemaCheck.recordset.length > 0) {
        await pool.request()
          .input('database_name', db_name)
          .input('database_type', db_type)
          .input('schema_json', schemaJson)
          .query('UPDATE database_schema SET database_type = @database_type, schema_json = @schema_json WHERE database_name = @database_name');
      } else {
        await pool.request()
          .input('database_name', db_name)
          .input('database_type', db_type)
          .input('schema_json', schemaJson)
          .query('INSERT INTO database_schema (database_name, database_type, schema_json) VALUES (@database_name, @database_type, @schema_json)');
      }

    } catch (schemaErr: any) {
      console.error('Schema Fetch Error:', schemaErr);
      return NextResponse.json(
        { success: false, message: `Configuration saved, but schema fetch failed: ${schemaErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Database configuration and schema saved successfully' });
  } catch (error: any) {
    console.error('Database Config Error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to save configuration: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    const userId = decoded.userId;

    const pool = await getConnection();

    const result = await pool.request()
      .input('userId', userId)
      .query('SELECT uc_id as id, db_username, db_type, server, port, db_name FROM user_credential WHERE id = @userId');

    return NextResponse.json({ success: true, configurations: result.recordset });
  } catch (error: any) {
    console.error('Fetch Configs Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    const userId = decoded.userId;

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const pool = await getConnection();
    await pool.request()
      .input('userId', userId)
      .input('id', parseInt(id, 10))
      .query('DELETE FROM user_credential WHERE uc_id = @id AND id = @userId');

    return NextResponse.json({ success: true, message: 'Configuration deleted successfully' });
  } catch (error: any) {
    console.error('Delete Config Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
