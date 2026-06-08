import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      settings: {
        youtube: { clientId: '', clientSecret: '' },
        tiktok: { clientKey: '', clientSecret: '' },
        facebook: { appId: '', appSecret: '', pageId: '' }
      },
      tokens: {
        youtube: null,
        tiktok: null,
        facebook: null
      },
      accounts: {
        youtube: null,
        tiktok: null,
        facebook: null
      }
    }, null, 2), 'utf8');
  }
}

function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return {};
  }
}

function writeDb(data) {
  initDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

export function getSettings() {
  const db = readDb();
  return db.settings || {};
}

export function saveSettings(settings) {
  const db = readDb();
  db.settings = { ...db.settings, ...settings };
  return writeDb(db);
}

export function getTokens() {
  const db = readDb();
  return db.tokens || {};
}

export function saveTokens(platform, tokens) {
  const db = readDb();
  if (!db.tokens) db.tokens = {};
  db.tokens[platform] = tokens;
  return writeDb(db);
}

export function getAccounts() {
  const db = readDb();
  return db.accounts || {};
}

export function saveAccount(platform, accountInfo) {
  const db = readDb();
  if (!db.accounts) db.accounts = {};
  db.accounts[platform] = accountInfo;
  return writeDb(db);
}

export function removeAccount(platform) {
  const db = readDb();
  if (db.accounts) db.accounts[platform] = null;
  if (db.tokens) db.tokens[platform] = null;
  return writeDb(db);
}
