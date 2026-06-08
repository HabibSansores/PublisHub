import { google } from 'googleapis';
import fs from 'fs';

function getOAuthClient(clientId, clientSecret, redirectUri) {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(clientId, clientSecret, redirectUri) {
  const oauth2Client = getOAuthClient(clientId, clientSecret, redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ],
  });
}

export async function getTokensFromCode(clientId, clientSecret, code, redirectUri) {
  const oauth2Client = getOAuthClient(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getChannelDetails(clientId, clientSecret, tokens) {
  const oauth2Client = getOAuthClient(clientId, clientSecret, null);
  oauth2Client.setCredentials(tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const response = await youtube.channels.list({
    part: 'snippet',
    mine: true,
  });
  if (response.data.items && response.data.items.length > 0) {
    const channel = response.data.items[0];
    return {
      id: channel.id,
      title: channel.snippet.title,
      avatar: channel.snippet.thumbnails?.default?.url || '',
    };
  }
  throw new Error('No se encontró ningún canal de YouTube.');
}

export async function uploadVideo(clientId, clientSecret, tokens, videoPath, metadata, onProgress) {
  const oauth2Client = getOAuthClient(clientId, clientSecret, null);
  oauth2Client.setCredentials(tokens);

  // Auto-refresh token if expired (handled by googleapis if client has credentials)
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const fileSize = fs.statSync(videoPath).size;

  const response = await youtube.videos.insert(
    {
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags || [],
          categoryId: metadata.categoryId || '22', // People & Blogs
        },
        status: {
          privacyStatus: metadata.privacyStatus || 'public',
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    },
    {
      onUploadProgress: (evt) => {
        const progress = Math.round((evt.bytesRead / fileSize) * 100);
        if (onProgress) {
          onProgress(progress);
        }
      },
    }
  );

  return response.data;
}
