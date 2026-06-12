import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import jwt from 'jsonwebtoken';

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

    let userDbs: any[] = [];
    const tableCheck = await pool.request().query("SELECT * FROM sysobjects WHERE name='user_credential' and xtype='U'");
    if (tableCheck.recordset.length > 0) {
      try {
        const res = await pool.request()
          .input('userId', userId)
          .query('SELECT db_name, db_type FROM user_credential WHERE id = @userId');
        userDbs = res.recordset.map((r: any) => ({ name: r.db_name, type: r.db_type }));
      } catch (err) {
        try {
          const res = await pool.request()
            .input('userId', userId)
            .query('SELECT db_name FROM user_credential WHERE id = @userId');
          userDbs = res.recordset.map((r: any) => ({ name: r.db_name, type: 'mssql' }));
        } catch (innerErr) {
          console.error("Failed to fetch user databases:", innerErr);
        }
      }
    }

    // Remove duplicates by name
    const allDbsMap = new Map();
    userDbs.forEach(db => {
      if (db && db.name) {
        allDbsMap.set(db.name, db);
      }
    });

    const allDbs = Array.from(allDbsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, databases: allDbs });
  } catch (error: any) {
    console.error('Fetch Databases Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
