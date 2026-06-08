import { getSettings, saveSettings, getAccounts } from '../../../lib/db';

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
    saveSettings(body);
    return Response.json({ success: true, settings: getSettings() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
