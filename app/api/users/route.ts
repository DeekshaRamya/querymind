import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  let pool;
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    pool = await getConnection();
    
    // Select all users, exclude passwordHash for security
    const resultUsers = await pool.request()
      .query("SELECT id, name, email, role FROM users ORDER BY id ASC");
      
    // Select all user credentials (excluding hashed passwords)
    const resultCredentials = await pool.request()
      .query("SELECT uc_id, id as user_id, db_username FROM user_credential ORDER BY uc_id ASC");
      
    // Select all database schemas
    const resultSchemas = await pool.request()
      .query("SELECT schema_id, database_name FROM database_schema ORDER BY schema_id ASC");

    return NextResponse.json({ 
      success: true, 
      users: resultUsers.recordset,
      credentials: resultCredentials.recordset,
      schemas: resultSchemas.recordset
    });
  } catch (error: any) {
    console.error('Fetch Admin Data Error:', error);
    return NextResponse.json(
      { success: false, message: `Database Connection Error: ${error.message || 'Unknown'}` },
      { status: 500 }
    );
  }
}
