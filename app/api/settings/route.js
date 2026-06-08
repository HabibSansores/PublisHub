import { getSettings, saveSettings, getAccounts } from '../../../lib/db';

function trimObjectValues(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const trimmed = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      trimmed[key] = obj[key].trim();
    } else if (typeof obj[key] === 'object') {
      trimmed[key] = trimObjectValues(obj[key]);
    } else {
      trimmed[key] = obj[key];
    }
  }
  return trimmed;
}

export async function GET() {
  try {
    const settings = getSettings();
    const accounts = getAccounts();
    return Response.json({ settings, accounts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const cleanBody = trimObjectValues(body);
    saveSettings(cleanBody);
    return Response.json({ success: true, settings: getSettings() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

