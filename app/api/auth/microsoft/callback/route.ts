import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import jwt from 'jsonwebtoken';
import * as msal from '@azure/msal-node';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=No+authorization+code+received', req.url));
  }

  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/login?error=Microsoft+authentication+is+not+configured', req.url));
  }

  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host');
  const redirectUri = `${protocol}://${host}/api/auth/microsoft/callback`;

  const msalConfig = {
    auth: {
      clientId: clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret: clientSecret,
    }
  };

  const cca = new msal.ConfidentialClientApplication(msalConfig);

  const tokenRequest = {
    code: code,
    scopes: ["User.Read"],
    redirectUri: redirectUri,
  };

  try {
    const response = await cca.acquireTokenByCode(tokenRequest);
    
    const account = response.account;
    let email = '';
    let name = '';

    if (account) {
      email = (account.username || account.idTokenClaims?.email || account.idTokenClaims?.preferred_username || '').toLowerCase().trim();
      name = account.name || (account.idTokenClaims?.name as string) || 'Microsoft User';
    }
    if (!email && response.accessToken) {
       const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
         headers: { 'Authorization': `Bearer ${response.accessToken}` }
       });
       if (profileResponse.ok) {
         const profileData = await profileResponse.json();
         email = (profileData.mail || profileData.userPrincipalName || '').toLowerCase().trim();
         if (!name || name === 'Microsoft User') {
            name = profileData.displayName || 'Microsoft User';
         }
       }
    }

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=Microsoft+account+does+not+have+an+associated+email', req.url));
    }

    const pool = await getConnection();

    let userRes = await pool.request()
      .input('email', email)
      .query('SELECT id, name, role FROM users WHERE email = @email');

    let userId;
    let userRole = 'user';
    let userName = name;

    if (userRes.recordset.length > 0) {
      userId = userRes.recordset[0].id;
      userRole = userRes.recordset[0].role || 'user';
      userName = userRes.recordset[0].name;
    } else {
      try {
        let nextId = 1;
        const maxIdRes = await pool.request().query('SELECT MAX(id) as maxId FROM users');
        if (maxIdRes.recordset[0] && maxIdRes.recordset[0].maxId !== null) {
          nextId = maxIdRes.recordset[0].maxId + 1;
        }

        await pool.request()
          .input('id', nextId)
          .input('name', name)
          .input('email', email)
          .input('role', 'user')
          .input('provider', 'microsoft')
          .query(`
            INSERT INTO users (id, name, email, passwordHash, role, provider)
            VALUES (@id, @name, @email, NULL, @role, @provider)
          `);
        userId = nextId;
      } catch (insertError: any) {
        console.error('Failed to create user:', insertError);
        const fallbackRes = await pool.request()
          .input('name', name)
          .input('email', email)
          .input('role', 'user')
          .input('provider', 'microsoft')
          .query(`
            INSERT INTO users (name, email, passwordHash, role, provider)
            OUTPUT INSERTED.id
            VALUES (@name, @email, NULL, @role, @provider)
          `);
        userId = fallbackRes.recordset[0].id;
      }
    }

    let hasConfig = false;
    try {
      const legacyResult = await pool.request()
        .input('userId', userId)
        .query('SELECT TOP 1 uc_id FROM user_credential WHERE id = @userId');
      if (legacyResult.recordset.length > 0) {
        hasConfig = true;
      }
    } catch (e) {
      console.error("Error checking user configurations:", e);
    }

    const token = jwt.sign(
      { userId: userId, email, role: userRole },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    const redirectPath = (userRole === 'admin') ? '/admin' : (hasConfig ? '/dashboard' : '/db-config');

    const htmlResponse = `
      <html>
        <head><title>Authenticating...</title></head>
        <body>
          <script>
            localStorage.setItem('token', '${token}');
            localStorage.setItem('userName', '${userName}');
            localStorage.setItem('userEmail', '${email}');
            localStorage.setItem('userRole', '${userRole}');
            window.location.href = '${redirectPath}';
          </script>
        </body>
      </html>
    `;

    return new NextResponse(htmlResponse, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error: any) {
    console.error('MSAL Callback Error:', error);
    const errorMsg = error.message ? encodeURIComponent(error.message) : 'Authentication+error+occurred';
    return NextResponse.redirect(new URL(`/login?error=${errorMsg}`, req.url));
  }
}
