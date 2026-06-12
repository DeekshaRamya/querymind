import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';
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

    // Get user app credentials
    const userResult = await pool.request()
      .input('userId', userId)
      .query('SELECT name, email FROM users WHERE id = @userId');

    if (userResult.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const user = userResult.recordset[0];

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Profile GET Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    const { name, email, password } = body;

    const pool = await getConnection();

    // Update app user table
    if (name || email || password) {
      let queryStr = 'UPDATE users SET ';
      const updates = [];
      const req = pool.request().input('userId', userId);

      if (name) {
        updates.push('name = @name');
        req.input('name', name);
      }
      if (email) {
        updates.push('email = @email');
        req.input('email', email.toLowerCase().trim());
      }
      if (password) {
        updates.push('passwordHash = @passwordHash');
        req.input('passwordHash', bcrypt.hashSync(password, 10));
      }

      queryStr += updates.join(', ') + ' WHERE id = @userId';
      await req.query(queryStr);

    }



    return NextResponse.json({ success: true, message: 'Profile updated successfully' });

  } catch (error: any) {
    console.error('Profile PUT Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Unknown error' },
      { status: 500 }
    );
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
    const pool = await getConnection();

    // 1. Delete child records
    await pool.request()
      .input('userId', userId)
      .query('DELETE FROM user_credential WHERE id = @userId');

    // 2. Delete parent record (users)
    await pool.request()
      .input('userId', userId)
      .query('DELETE FROM users WHERE id = @userId');


    return NextResponse.json({ success: true, message: 'Account deleted successfully' });

  } catch (error: any) {
    console.error('Profile DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
