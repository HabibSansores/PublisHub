import fs from 'fs';
import path from 'path';
import { getSettings, getTokens } from '../../../lib/db';
import * as youtubeClient from '../../../lib/platforms/youtube';
import * as tiktokClient from '../../../lib/platforms/tiktok';
import * as facebookClient from '../../../lib/platforms/facebook';

// Persistent status across hot-reloads in next dev
if (!global.uploadStatus) {
  global.uploadStatus = {
    active: false,
    videoName: '',
    platforms: {}
  };
}

export async function POST(request) {
  try {
    if (global.uploadStatus.active) {
      return Response.json({ error: 'Ya hay una subida en progreso.' }, { status: 400 });
    }

    let videoPath = '';
    let title = '';
    let description = '';
    let platforms = [];

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      title = formData.get('title') || '';
      description = formData.get('description') || '';
      platforms = JSON.parse(formData.get('platforms') || '[]');

      if (!file) {
        return Response.json({ error: 'No se incluyó ningún archivo de video.' }, { status: 400 });
      }

      // Ensure tmp directory exists
      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Save file locally in tmp
      const tempFilePath = path.join(tmpDir, `upload-${Date.now()}-${file.name}`);
      const bytes = await file.arrayBuffer();
      fs.writeFileSync(tempFilePath, Buffer.from(bytes));
      videoPath = tempFilePath;
    } else {
      const data = await request.json();
      videoPath = data.videoPath;
      title = data.title || '';
      description = data.description || '';
      platforms = data.platforms || [];
    }

    if (!videoPath || !fs.existsSync(videoPath)) {
      return Response.json({ error: 'La ruta del video local es inválida o no existe.' }, { status: 400 });
    }

    if (!platforms || platforms.length === 0) {
      return Response.json({ error: 'Debes seleccionar al menos una plataforma.' }, { status: 400 });
    }

    // Initialize global status
    global.uploadStatus.active = true;
    global.uploadStatus.videoName = path.basename(videoPath);
    global.uploadStatus.platforms = {};

    platforms.forEach((p) => {
      global.uploadStatus.platforms[p] = {
        status: 'pending',
        progress: 0,
        error: null
      };
    });

    const settings = getSettings();
    const tokens = getTokens();
    
    // Start uploads in background
    runBackgroundUploads(videoPath, { title, description }, platforms, settings, tokens);

    return Response.json({ success: true, message: 'Subida iniciada en segundo plano.' });
  } catch (error) {
    console.error('Error initiating upload:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function runBackgroundUploads(videoPath, metadata, platforms, settings, tokens) {
  const uploadPromises = platforms.map(async (platform) => {
    global.uploadStatus.platforms[platform].status = 'uploading';
    
    try {
      if (platform === 'youtube') {
        const ytSettings = settings.youtube;
        const ytTokens = tokens.youtube;
        
        if (!ytSettings?.clientId || !ytTokens) {
          throw new Error('Cuenta de YouTube no vinculada o faltan ajustes.');
        }

        await youtubeClient.uploadVideo(
          ytSettings.clientId,
          ytSettings.clientSecret,
          ytTokens,
          videoPath,
          {
            title: metadata.title,
            description: metadata.description,
            privacyStatus: 'public'
          },
          (progress) => {
            global.uploadStatus.platforms.youtube.progress = progress;
          }
        );

      } else if (platform === 'tiktok') {
        const ttTokens = tokens.tiktok;
        
        if (!ttTokens?.access_token) {
          throw new Error('Cuenta de TikTok no vinculada.');
        }

        await tiktokClient.uploadVideo(
          ttTokens.access_token,
          videoPath,
          {
            title: metadata.title,
            privacyLevel: 'PUBLIC_TO_EVERYONE'
          },
          (progress) => {
            global.uploadStatus.platforms.tiktok.progress = progress;
          }
        );

      } else if (platform === 'facebook') {
        const fbTokens = tokens.facebook;
        
        if (!fbTokens?.pageAccessToken || !fbTokens?.pageId) {
          throw new Error('Cuenta de Facebook (Página) no vinculada.');
        }

        await facebookClient.uploadReel(
          fbTokens.pageAccessToken,
          fbTokens.pageId,
          videoPath,
          {
            title: metadata.title,
            description: metadata.description
          },
          (progress) => {
            global.uploadStatus.platforms.facebook.progress = progress;
          }
        );
      }

      global.uploadStatus.platforms[platform].status = 'success';
      global.uploadStatus.platforms[platform].progress = 100;
    } catch (err) {
      console.error(`Upload error on ${platform}:`, err);
      global.uploadStatus.platforms[platform].status = 'failed';
      global.uploadStatus.platforms[platform].error = err.message;
    }
  });

  await Promise.all(uploadPromises);
  
  // Clean up temp file if it was uploaded from the browser
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (videoPath.startsWith(tmpDir)) {
    try {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    } catch (err) {
      console.error('Error deleting temp video file:', err);
    }
  }

  // Mark upload process as done
  global.uploadStatus.active = false;
}
