import fs from 'fs';
import https from 'https';
import { URL } from 'url';

export function getAuthUrl(appId, redirectUri) {
  const state = Math.random().toString(36).substring(2, 15);
  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  url.searchParams.append('client_id', appId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('scope', 'pages_show_list,pages_manage_posts,publish_video');
  url.searchParams.append('state', state);
  return url.toString();
}

export async function getTokensFromCode(appId, appSecret, code, redirectUri) {
  const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
  url.searchParams.append('client_id', appId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('client_secret', appSecret);
  url.searchParams.append('code', code);

  const response = await fetch(url.toString());
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Error en autenticación de Facebook.');
  }
  return data; // contains access_token, expires_in
}

export async function getPages(userAccessToken) {
  const response = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Error al obtener páginas de Facebook.');
  }

  const pages = data.data || [];
  // For each page, we want to get its profile picture
  const pagesWithPictures = await Promise.all(
    pages.map(async (page) => {
      let avatar = '';
      try {
        const picRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}/picture?redirect=0&access_token=${page.access_token}`);
        const picData = await picRes.json();
        avatar = picData.data?.url || '';
      } catch (err) {
        console.error('Error fetching page picture:', err);
      }
      return {
        id: page.id,
        title: page.name,
        avatar: avatar,
        accessToken: page.access_token,
      };
    })
  );

  return pagesWithPictures;
}

export async function uploadReel(pageAccessToken, pageId, videoPath, metadata, onProgress) {
  const fileSize = fs.statSync(videoPath).size;

  // 1. Inicializar la subida del Reel
  const initRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/video_reels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      upload_phase: 'start',
      access_token: pageAccessToken,
    }),
  });

  const initData = await initRes.json();
  if (initData.error) {
    throw new Error(initData.error.message || 'Error al iniciar la subida en Facebook.');
  }

  const { video_id, upload_url } = initData;

  // 2. Subir el archivo de video binario mediante PUT request
  await new Promise((resolve, reject) => {
    const parsedUrl = new URL(upload_url);
    const options = {
      method: 'POST', // Meta Graph API resumable upload accepts POST
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        'Authorization': `OAuth ${pageAccessToken}`,
        'file_size': fileSize,
        'Content-Type': 'video/mp4',
        'offset': 0,
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ video_id, success: true });
        } else {
          reject(new Error(`Subida fallida a Facebook. Status: ${res.statusCode}. Body: ${responseBody}`));
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

  // 3. Publicar el Reel (Fase Final)
  const finishRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/video_reels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      upload_phase: 'finish',
      video_id: video_id,
      video_state: 'PUBLISHED',
      description: metadata.description || metadata.title || '',
      access_token: pageAccessToken,
    }),
  });

  const finishData = await finishRes.json();
  if (finishData.error) {
    throw new Error(finishData.error.message || 'Error al publicar el Reel en Facebook.');
  }

  return finishData; // contains success: true
}
