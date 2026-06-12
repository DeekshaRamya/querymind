// Trigger reload
import { NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, 10);
};

export async function POST(request: Request) {
  let pool;
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const email = body.email?.toLowerCase().trim();
    const password = body.password;
    const role = body.role || 'user';

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all fields' },
        { status: 400 }
      );
    }

    pool = await getConnection();
    
    // Check if user already exists
    const checkResult = await pool.request()
      .input('email', email)
      .query('SELECT id FROM users WHERE email = @email');

    if (checkResult.recordset.length > 0) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Get max id to manually increment since id is not an IDENTITY column
    const maxIdResult = await pool.request().query('SELECT MAX(id) as maxId FROM users');
    let nextId = 1;
    if (maxIdResult.recordset[0].maxId !== null) {
      nextId = maxIdResult.recordset[0].maxId + 1;
    }

    // Clean up any orphaned records from previously deleted users that shared this ID
    await pool.request().input('newId', nextId).query('DELETE FROM user_credential WHERE id = @newId');

    const passwordHash = hashPassword(password);
    
    await pool.request()
      .input('id', nextId)
      .input('name', name)
      .input('email', email)
      .input('passwordHash', passwordHash)
      .input('role', role)
      .query('INSERT INTO users (id, name, email, passwordHash, role) VALUES (@id, @name, @email, @passwordHash, @role)');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Signup Error:', error);
    return NextResponse.json(
      { success: false, message: `Database Connection Error: ${error.message || 'Unknown'}` },
      { status: 500 }
    );
  }
}
