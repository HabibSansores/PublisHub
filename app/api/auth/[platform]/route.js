import { getSettings, saveTokens, saveAccount, removeAccount } from '../../../../lib/db';
import { cookies } from 'next/headers';
import * as youtubeClient from '../../../../lib/platforms/youtube';
import * as tiktokClient from '../../../../lib/platforms/tiktok';
import * as facebookClient from '../../../../lib/platforms/facebook';

export async function GET(request, { params }) {
  const platform = params.platform;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const settings = getSettings();
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  // Default redirectUri
  let redirectUri = `${protocol}://${host}/api/auth/${platform}`;

  // For TikTok, if a Vercel URL is configured and we are running locally, use Vercel URL as the redirectUri
  if (platform === 'tiktok' && host.includes('localhost')) {
    let vercelUrl = settings.general?.vercelUrl || '';
    if (vercelUrl) {
      vercelUrl = vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      redirectUri = `https://${vercelUrl}/api/auth/tiktok`;
    }
  }

  // 1. Detect Vercel to Localhost redirection hop (bypass localhost restriction)
  if (!host.includes('localhost') && code) {
    // We are on Vercel and received the callback. Redirect browser back to local localhost!
    const localUrl = `http://localhost:3000/api/auth/${platform}?code=${code}&state=${state || ''}&vercel_host=${host}`;
    return Response.redirect(localUrl);
  }

  // 2. Manejar Desconexión (Logout)
  if (action === 'logout') {
    removeAccount(platform);
    return Response.redirect(`${protocol}://${host}/?disconnected=${platform}`);
  }

  // 3. Manejar Redirección de Inicio de Sesión (Login)
  if (action === 'login') {
    let authUrl = '';
    try {
      if (platform === 'youtube') {
        const { clientId, clientSecret } = settings.youtube || {};
        if (!clientId || !clientSecret) {
          return Response.redirect(`${protocol}://${host}/?error=Missing credentials for youtube`);
        }
        authUrl = youtubeClient.getAuthUrl(clientId, clientSecret, redirectUri);
      } else if (platform === 'tiktok') {
        const { clientKey, clientSecret } = settings.tiktok || {};
        if (!clientKey || !clientSecret) {
          return Response.redirect(`${protocol}://${host}/?error=Missing credentials for tiktok`);
        }
        const pkce = tiktokClient.generatePKCE();
        
        // Save code verifier in cookie for the callback phase
        cookies().set('tiktok_code_verifier', pkce.codeVerifier, {
          httpOnly: true,
          secure: protocol === 'https',
          sameSite: 'lax',
          maxAge: 300 // 5 minutes
        });
        
        authUrl = tiktokClient.getAuthUrl(clientKey, redirectUri, pkce.codeChallenge);
      } else if (platform === 'facebook') {
        const { appId, appSecret } = settings.facebook || {};
        if (!appId || !appSecret) {
          return Response.redirect(`${protocol}://${host}/?error=Missing credentials for facebook`);
        }
        authUrl = facebookClient.getAuthUrl(appId, redirectUri);
      }

      return Response.redirect(authUrl);
    } catch (err) {
      console.error(`Error generating Auth URL for ${platform}:`, err);
      return Response.redirect(`${protocol}://${host}/?error=Auth URL generation failed for ${platform}`);
    }
  }

  // 4. Manejar Callback de OAuth (procesamiento del código)
  if (code) {
    try {
      if (platform === 'youtube') {
        const { clientId, clientSecret } = settings.youtube || {};
        const tokens = await youtubeClient.getTokensFromCode(clientId, clientSecret, code, redirectUri);
        const channel = await youtubeClient.getChannelDetails(clientId, clientSecret, tokens);
        
        saveTokens('youtube', tokens);
        saveAccount('youtube', channel);

      } else if (platform === 'tiktok') {
        const { clientKey, clientSecret } = settings.tiktok || {};
        const codeVerifier = cookies().get('tiktok_code_verifier')?.value;
        
        if (!codeVerifier) {
          return Response.redirect(`${protocol}://${host}/?error=Missing code verifier for tiktok`);
        }

        const vercelHost = searchParams.get('vercel_host');
        const redirectUriForExchange = vercelHost
          ? `https://${vercelHost}/api/auth/tiktok`
          : redirectUri;
        
        const tokens = await tiktokClient.getTokensFromCode(clientKey, clientSecret, code, redirectUriForExchange, codeVerifier);
        const user = await tiktokClient.getUserDetails(tokens.access_token);
        
        saveTokens('tiktok', tokens);
        saveAccount('tiktok', user);

      } else if (platform === 'facebook') {
        const { appId, appSecret } = settings.facebook || {};
        const tokens = await facebookClient.getTokensFromCode(appId, appSecret, code, redirectUri);
        const pages = await facebookClient.getPages(tokens.access_token);
        
        if (pages.length === 0) {
          return Response.redirect(`${protocol}://${host}/?error=No managed Pages found on Facebook`);
        }

        // Connect the first page as default
        const primaryPage = pages[0];
        
        // Save the user access token and pages in the token database
        saveTokens('facebook', {
          userAccessToken: tokens.access_token,
          pageAccessToken: primaryPage.accessToken,
          pageId: primaryPage.id,
          allPages: pages.map(p => ({ id: p.id, title: p.title, avatar: p.avatar }))
        });

        saveAccount('facebook', {
          id: primaryPage.id,
          title: primaryPage.title,
          avatar: primaryPage.avatar,
        });
      }

      return Response.redirect(`${protocol}://${host}/?connected=${platform}`);
    } catch (err) {
      console.error(`Error in OAuth callback for ${platform}:`, err);
      return Response.redirect(`${protocol}://${host}/?error=Callback failed for ${platform}: ${encodeURIComponent(err.message)}`);
    }
  }

  // Si no coincide con ninguna acción, redirigir al Dashboard
  return Response.redirect(`${protocol}://${host}/`);
}
