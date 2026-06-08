'use client';
import { useState, useEffect } from 'react';

export default function SettingsTab({ onSettingsSaved, showToast }) {
  const [settings, setSettings] = useState({
    youtube: { clientId: '', clientSecret: '' },
    tiktok: { clientKey: '', clientSecret: '' },
    facebook: { appId: '', appSecret: '' },
    general: { vercelUrl: '' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.settings) {
          setSettings({
            youtube: {
              clientId: data.settings.youtube?.clientId || '',
              clientSecret: data.settings.youtube?.clientSecret || ''
            },
            tiktok: {
              clientKey: data.settings.tiktok?.clientKey || '',
              clientSecret: data.settings.tiktok?.clientSecret || ''
            },
            facebook: {
              appId: data.settings.facebook?.appId || '',
              appSecret: data.settings.facebook?.appSecret || ''
            },
            general: {
              vercelUrl: data.settings.general?.vercelUrl || ''
            }
          });
        }
      } catch (err) {
        showToast('Error al cargar la configuración.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [showToast]);

  const handleChange = (platform, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Configuración guardada correctamente.', 'success');
        if (onSettingsSaved) onSettingsSaved(data.settings);
      } else {
        throw new Error(data.error || 'Error al guardar');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card text-center" style={{ padding: '48px' }}>
        <p>Cargando configuraciones...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <form onSubmit={handleSave} className="glass-card">
        <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', borderBottom: '1px solid var(--border-muted)', paddingBottom: '12px' }}>
          ⚙️ Credenciales de Desarrollador
        </h2>

        {/* General Settings */}
        <div style={{ marginBottom: '32px', borderBottom: '1px dashed var(--border-muted)', paddingBottom: '24px' }}>
          <h3 style={{ color: 'var(--text-normal)', marginBottom: '8px', fontSize: '1.1rem' }}>Configuración General (Vercel)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.4' }}>
            Dado que TikTok no permite usar <code>localhost</code> para redirecciones, utilizaremos tu URL de Vercel como puente seguro. Ingresa tu URL de Vercel aquí.
          </p>
          <div className="form-group" style={{ maxWidth: '500px' }}>
            <label className="form-label">URL del Proyecto en Vercel</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://tu-proyecto.vercel.app"
              value={settings.general?.vercelUrl || ''}
              onChange={(e) => handleChange('general', 'vercelUrl', e.target.value)}
            />
          </div>
        </div>

        {/* YouTube Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: 'var(--accent-purple)', marginBottom: '16px', fontSize: '1.1rem' }}>YouTube (Google Cloud)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Client ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Google Client ID"
                value={settings.youtube.clientId}
                onChange={(e) => handleChange('youtube', 'clientId', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Client Secret</label>
              <input
                type="password"
                className="form-input"
                placeholder="Google Client Secret"
                value={settings.youtube.clientSecret}
                onChange={(e) => handleChange('youtube', 'clientSecret', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* TikTok Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '16px', fontSize: '1.1rem' }}>TikTok (TikTok Developers)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Client Key</label>
              <input
                type="text"
                className="form-input"
                placeholder="TikTok Client Key"
                value={settings.tiktok.clientKey}
                onChange={(e) => handleChange('tiktok', 'clientKey', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Client Secret</label>
              <input
                type="password"
                className="form-input"
                placeholder="TikTok Client Secret"
                value={settings.tiktok.clientSecret}
                onChange={(e) => handleChange('tiktok', 'clientSecret', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Facebook Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#1877f2', marginBottom: '16px', fontSize: '1.1rem' }}>Facebook (Meta for Developers)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">App ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Meta App ID"
                value={settings.facebook.appId}
                onChange={(e) => handleChange('facebook', 'appId', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">App Secret</label>
              <input
                type="password"
                className="form-input"
                placeholder="Meta App Secret"
                value={settings.facebook.appSecret}
                onChange={(e) => handleChange('facebook', 'appSecret', e.target.value)}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>

      {/* Instructions Guide */}
      <div className="glass-card">
        <h2 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>📖 Guía de Configuración Rápida</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ borderLeft: '3px solid var(--accent-purple)', paddingLeft: '16px' }}>
            <h4 style={{ fontWeight: '600', marginBottom: '6px' }}>1. Configuración de YouTube (API v3)</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-purple)' }}>Google Cloud Console</a>, crea un proyecto, habilita la **YouTube Data API v3**, crea una pantalla de consentimiento OAuth y genera credenciales de tipo **ID de cliente de OAuth** (aplicación web). Agrega la URI de redirección: <code style={{ background: 'black', padding: '2px 4px', borderRadius: '4px' }}>http://localhost:3000/api/auth/youtube</code>.
            </p>
          </div>

          <div style={{ borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '16px' }}>
            <h4 style={{ fontWeight: '600', marginBottom: '6px' }}>2. Configuración de TikTok</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Entra al <a href="https://developers.tiktok.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>Portal de Desarrolladores de TikTok</a>, crea una aplicación de tipo web, solicita el permiso **Video Upload / Content Posting**. Como TikTok no permite <code style={{ background: 'black', padding: '2px 4px', borderRadius: '4px' }}>localhost</code>, en la URI de redirección debes poner tu URL de Vercel más el endpoint: <code style={{ background: 'black', padding: '2px 4px', borderRadius: '4px' }}>https://TU-PROYECTO.vercel.app/api/auth/tiktok</code>. Copia el **Client Key** y **Client Secret** y asegúrate de rellenar la URL de Vercel en la Configuración General arriba.
            </p>
          </div>

          <div style={{ borderLeft: '3px solid #1877f2', paddingLeft: '16px' }}>
            <h4 style={{ fontWeight: '600', marginBottom: '6px' }}>3. Configuración de Facebook Reels</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Crea una aplicación comercial en <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" style={{ color: '#1877f2' }}>Meta for Developers</a>. Añade el producto **Inicio de sesión con Facebook**. Configura la URI de redirección: <code style={{ background: 'black', padding: '2px 4px', borderRadius: '4px' }}>http://localhost:3000/api/auth/facebook</code>. Necesitarás permisos como <code style={{ color: '#1877f2' }}>pages_manage_posts</code> y <code style={{ color: '#1877f2' }}>publish_video</code> para publicar en tu Página.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
