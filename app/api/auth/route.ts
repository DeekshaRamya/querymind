import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  let pool;
  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();
    const password = body.password;

    pool = await getConnection();

    const result = await pool.request()
      .input('email', email)
      .query('SELECT id, name, passwordHash, role FROM users WHERE email = @email');

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      const isValid = bcrypt.compareSync(password, user.passwordHash);

      if (isValid) {
        const userRole = user.role || 'user';

        let hasConfig = false;
        try {
          const credResult = await pool.request()
            .input('userId', user.id)
            .query('SELECT TOP 1 id FROM user_credential WHERE user_id = @userId');
          if (credResult.recordset.length > 0) {
            hasConfig = true;
          } else {
            // Check legacy table just in case
            const legacyResult = await pool.request()
              .input('userId', user.id)
              .query('SELECT TOP 1 uc_id FROM user_credential WHERE id = @userId');
            if (legacyResult.recordset.length > 0) {
              hasConfig = true;
            }
          }
        } catch (e) {
          console.error("Error checking user configurations:", e);
        }

        const token = jwt.sign(
          { userId: user.id, email, role: userRole },
          process.env.JWT_SECRET as string,
          { expiresIn: '1d' }
        );

        return NextResponse.json({
          success: true,
          token,
          user: { id: user.id, name: user.name, email: email, role: userRole, hasConfig }
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid credentials: password mismatch' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials: user not found' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { success: false, message: `Database Connection Error: ${(error as Error).message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true, message: "Use client-side logout" });
}
