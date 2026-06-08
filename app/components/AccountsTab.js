'use client';
import { useState, useEffect } from 'react';

export default function AccountsTab({ showToast }) {
  const [data, setData] = useState({ settings: {}, accounts: {} });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      setData(json);
    } catch (err) {
      showToast('Error al cargar cuentas y ajustes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isConfigured = (platform) => {
    const s = data.settings[platform];
    if (platform === 'youtube') return !!(s?.clientId && s?.clientSecret);
    if (platform === 'tiktok') return !!(s?.clientKey && s?.clientSecret);
    if (platform === 'facebook') return !!(s?.appId && s?.appSecret);
    return false;
  };

  const handleConnect = (platform) => {
    if (!isConfigured(platform)) {
      showToast(`Por favor, configura las credenciales de API para ${platform} en la pestaña de Ajustes primero.`, 'warning');
      return;
    }
    // Redirect to OAuth login
    window.location.href = `/api/auth/${platform}?action=login`;
  };

  const handleDisconnect = (platform) => {
    if (confirm(`¿Estás seguro de que deseas desconectar tu cuenta de ${platform}?`)) {
      window.location.href = `/api/auth/${platform}?action=logout`;
    }
  };

  if (loading) {
    return (
      <div className="glass-card text-center" style={{ padding: '48px' }}>
        <p>Cargando estados de cuentas...</p>
      </div>
    );
  }

  const platforms = [
    { id: 'youtube', name: 'YouTube Shorts / Videos', logoClass: 'youtube', desc: 'Sube videos directamente a tu canal de YouTube' },
    { id: 'tiktok', name: 'TikTok', logoClass: 'tiktok', desc: 'Publica videos directamente a tu feed de TikTok' },
    { id: 'facebook', name: 'Facebook Reels / Pages', logoClass: 'facebook', desc: 'Sube Reels a tus páginas administradas de Facebook' }
  ];

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '8px', fontSize: '1.5rem' }}>👥 Conexiones de Plataforma</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Vincula y administra tus cuentas de creador para publicar en ellas de manera simultánea.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {platforms.map((p) => {
          const account = data.accounts[p.id];
          const configured = isConfigured(p.id);
          const connected = !!account;

          return (
            <div
              key={p.id}
              className={`platform-card ${connected ? 'platform-card-active' : ''}`}
            >
              <div className="platform-info">
                <div className={`platform-logo ${p.logoClass}`}>
                  {p.id === 'youtube' && 'YT'}
                  {p.id === 'tiktok' && 'TT'}
                  {p.id === 'facebook' && 'FB'}
                </div>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {p.name}
                    {connected ? (
                      <span className="platform-status-badge">
                        <span className="status-dot connected"></span>
                        <span style={{ color: 'var(--success)' }}>Conectado</span>
                      </span>
                    ) : (
                      <span className="platform-status-badge">
                        <span className="status-dot disconnected"></span>
                        <span>Desconectado</span>
                      </span>
                    )}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.desc}</p>
                  
                  {/* Account Profile info if connected */}
                  {connected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '6px', width: 'fit-content' }}>
                      {account.avatar && (
                        <img
                          src={account.avatar}
                          alt={account.title}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      )}
                      <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{account.title}</span>
                    </div>
                  )}

                  {!configured && (
                    <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '6px' }}>
                      ⚠️ Requiere configuración de API en Ajustes.
                    </p>
                  )}
                </div>
              </div>

              <div>
                {connected ? (
                  <button
                    onClick={() => handleDisconnect(p.id)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(p.id)}
                    className="btn btn-primary"
                    disabled={!configured}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Conectar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
