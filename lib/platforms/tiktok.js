import fs from 'fs';
import https from 'https';
import crypto from 'crypto';
import { URL } from 'url';

export function generatePKCE() {
  // Generate random verifier (alphanumeric)
  const codeVerifier = crypto.randomBytes(32).toString('hex'); // 64 chars
  
  // Hash with SHA-256 and convert to Hex string for TikTok
  const hash = crypto.createHash('sha256').update(codeVerifier).digest('hex');
  
  return { codeVerifier, codeChallenge: hash };
}

export function getAuthUrl(clientKey, redirectUri, codeChallenge) {
  const state = Math.random().toString(36).substring(2, 15);
  const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
  url.searchParams.append('client_key', clientKey);
  url.searchParams.append('scope', 'user.info.basic,video.upload,video.publish');
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('state', state);
  url.searchParams.append('code_challenge', codeChallenge);
  url.searchParams.append('code_challenge_method', 'S256');
  return url.toString();
}

export async function getTokensFromCode(clientKey, clientSecret, code, redirectUri, codeVerifier) {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  return data; // contains access_token, refresh_token, expires_in, refresh_expires_in, open_id
}


export async function getUserDetails(accessToken) {
  const response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  if (data.error) {
    const errMsg = data.error.message || JSON.stringify(data.error);
    throw new Error(`TikTok API error: ${errMsg}`);
  }

  const user = data.data?.user;
  if (user) {
    return {
      id: user.open_id,
      title: user.display_name || 'TikTok User',
      avatar: user.avatar_url || '',
    };
  }
  throw new Error(`No se encontró información del usuario. Respuesta API: ${JSON.stringify(data)}`);
}

export async function uploadVideo(accessToken, videoPath, metadata, onProgress) {
  const fileSize = fs.statSync(videoPath).size;

  // 1. Inicializar la subida (Direct Post API)
  const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: metadata.title || '',
        privacy_level: metadata.privacyLevel || 'PUBLIC_TO_EVERYONE', // PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, SELF_ONLY
        disable_comment: metadata.disableComment || false,
        disable_duet: metadata.disableDuet || false,
        disable_stitch: metadata.disableStitch || false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: fileSize,
        chunk_size: fileSize,
        total_chunk_count: 1,
      },
    }),
  });

  const initData = await initResponse.json();
  if (initData.error) {
    throw new Error(initData.error.message || 'Fallo en la inicialización de TikTok.');
  }

  const { upload_url, publish_id } = initData.data;

  // 2. Subir el archivo de video binario mediante PUT request con progreso
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(upload_url);
    const options = {
      method: 'PUT',
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize,
        'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ publish_id, success: true });
        } else {
          reject(new Error(`Subida fallida a TikTok. Status: ${res.statusCode}. Body: ${responseBody}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    const fileStream = fs.createReadStream(videoPath);
    let bytesUploaded = 0;

    fileStream.on('data', (chunk) => {
      bytesUploaded += chunk.length;
      if (onProgress) {
        onProgress(Math.round((bytesUploaded / fileSize) * 100));
      }
    });

    fileStream.on('error', (err) => {
      req.destroy();
      reject(err);
    });

    fileStream.pipe(req);
  });
}
