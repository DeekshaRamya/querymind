import { NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function DELETE(request: Request) {
  let pool;
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string };
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 });
    }

    pool = await getConnection();
    
    // 1. Delete associated credentials first (Foreign Key constraint)
    await pool.request()
      .input('email', email)
      .query('DELETE FROM user_credential WHERE id IN (SELECT id FROM users WHERE email = @email)');

    // 2. Delete the user
    await pool.request()
      .input('email', email)
      .query('DELETE FROM users WHERE email = @email');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete User Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
