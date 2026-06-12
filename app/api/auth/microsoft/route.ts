import { NextResponse } from 'next/server';
import * as msal from '@azure/msal-node';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Microsoft Client ID or Secret is not configured' }, { status: 500 });
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

  const authCodeUrlParameters = {
    scopes: ["User.Read"],
    redirectUri: redirectUri,
  };

  try {
    const authUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("MSAL getAuthCodeUrl Error:", error);
    return NextResponse.json({ error: 'Failed to generate authentication URL' }, { status: 500 });
  }
}
