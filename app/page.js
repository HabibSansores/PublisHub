'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import AccountsTab from './components/AccountsTab';
import SettingsTab from './components/SettingsTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [accounts, setAccounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    youtube: false,
    tiktok: false,
    facebook: false
  });

  // Upload Progress State
  const [uploadStatus, setUploadStatus] = useState({
    active: false,
    videoName: '',
    platforms: {}
  });

  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Show toast utility
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Load connected accounts
  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.accounts) {
        setAccounts(data.accounts);
        // Pre-select platforms that are connected
        setSelectedPlatforms({
          youtube: !!data.accounts.youtube,
          tiktok: !!data.accounts.tiktok,
          facebook: !!data.accounts.facebook
        });
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    
    // Check URL parameters for OAuth callbacks
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const disconnected = params.get('disconnected');
    const error = params.get('error');

    if (connected) {
      showToast(`¡Cuenta de ${connected.toUpperCase()} conectada con éxito!`, 'success');
      // Clear URL params
      window.history.replaceState({}, document.title, '/');
    } else if (disconnected) {
      showToast(`Cuenta de ${disconnected.toUpperCase()} desconectada.`, 'success');
      window.history.replaceState({}, document.title, '/');
    } else if (error) {
      showToast(`Error de autenticación: ${decodeURIComponent(error)}`, 'error');
      window.history.replaceState({}, document.title, '/');
    }

    // Check if there is already an active upload on startup
    pollUploadStatus();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const pollUploadStatus = async () => {
    try {
      const res = await fetch('/api/upload/status');
      const status = await res.json();
      setUploadStatus(status);

      if (status.active) {
        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(pollUploadStatus, 1000);
        }
      } else {
        // If not active anymore, clear interval but keep final state
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Error polling upload status:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setLocalPath(''); // Clear local path if browser file is selected
      const objectUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(objectUrl);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setLocalPath('');
      const objectUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(objectUrl);
    } else {
      showToast('Por favor, arrastra solo archivos de video válidos.', 'error');
    }
  };

  const removeSelectedVideo = () => {
    setSelectedFile(null);
    setVideoPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const togglePlatform = (platform) => {
    if (!accounts[platform]) {
      showToast(`Por favor, conecta primero tu cuenta de ${platform.toUpperCase()} en la pestaña Cuentas.`, 'warning');
      return;
    }
    setSelectedPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!selectedFile && !localPath) {
      showToast('Debes seleccionar un video o ingresar su ruta local.', 'error');
      return;
    }

    const activePlatforms = Object.keys(selectedPlatforms).filter((p) => selectedPlatforms[p]);
    if (activePlatforms.length === 0) {
      showToast('Selecciona al menos una plataforma conectada para publicar.', 'error');
      return;
    }

    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('platforms', JSON.stringify(activePlatforms));

        showToast('Subiendo archivo al servidor local e iniciando publicación...', 'success');
        response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
      } else {
        showToast('Iniciando publicación de archivo local...', 'success');
        response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoPath: localPath,
            title,
            description,
            platforms: activePlatforms
          })
        });
      }

      const result = await response.json();
      if (result.success) {
        showToast('Subida múltiple iniciada.', 'success');
        // Start polling immediately
        pollUploadStatus();
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err) {
      showToast(`Error al iniciar la publicación: ${err.message}`, 'error');
    }
  };

  // Reset uploader form once upload finishes and user clears
  const handleClearUploadConsole = () => {
    setUploadStatus({ active: false, videoName: '', platforms: {} });
    setTitle('');
    setDescription('');
    removeSelectedVideo();
    setLocalPath('');
  };

  const isUploadFinished = () => {
    if (Object.keys(uploadStatus.platforms).length === 0) return false;
    return Object.values(uploadStatus.platforms).every(
      (p) => p.status === 'success' || p.status === 'failed'
    );
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {/* Toast Notifications */}
        {toast && (
          <div className={`notification-banner ${toast.type === 'error' ? 'error' : ''}`}>
            <span>{toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : '✨'}</span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Tab Header */}
        <header className="app-header">
          <h1>
            {activeTab === 'dashboard' && '⚡ Panel de Publicación'}
            {activeTab === 'accounts' && '👥 Cuentas de Creador'}
            {activeTab === 'settings' && '⚙️ Configuración del Sistema'}
          </h1>
          <p>
            {activeTab === 'dashboard' && 'Sube tu video una sola vez y publícalo en todas tus redes simultáneamente.'}
            {activeTab === 'accounts' && 'Administra las cuentas vinculadas de tus plataformas sociales.'}
            {activeTab === 'settings' && 'Configura tus llaves de API locales y credenciales de cliente.'}
          </p>
        </header>

        {/* Content Area */}
        {loading ? (
          <div className="glass-card text-center" style={{ padding: '48px' }}>
            <p>Cargando aplicación...</p>
          </div>
        ) : (
          <>
            {activeTab === 'settings' && (
              <SettingsTab
                onSettingsSaved={loadAccounts}
                showToast={showToast}
              />
            )}
            
            {activeTab === 'accounts' && (
              <AccountsTab showToast={showToast} />
            )}

            {activeTab === 'dashboard' && (
              <div className="dashboard-grid">
                {/* Left Column: Form & Drag & Drop */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Progress overlay console if upload is active or finished */}
                  {(uploadStatus.active || Object.keys(uploadStatus.platforms).length > 0) ? (
                    <div className="glass-card">
                      <h2 style={{ marginBottom: '8px', fontSize: '1.4rem' }}>
                        {uploadStatus.active ? '📤 Publicando Video...' : '✅ Publicación Completada'}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                        Archivo: <strong>{uploadStatus.videoName}</strong>
                      </p>

                      <div className="upload-progress-container">
                        {Object.keys(uploadStatus.platforms).map((p) => {
                          const state = uploadStatus.platforms[p];
                          const isSuccess = state.status === 'success';
                          const isFailed = state.status === 'failed';
                          const isUploading = state.status === 'uploading';

                          return (
                            <div key={p} className="progress-row">
                              <div className="progress-info">
                                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                                  {p === 'youtube' && '🎥 YouTube Shorts'}
                                  {p === 'tiktok' && '🎵 TikTok Video'}
                                  {p === 'facebook' && '📘 Facebook Reel'}
                                </span>
                                <span className={isSuccess ? 'text-success' : isFailed ? 'text-error' : 'text-warning'}>
                                  {isSuccess && 'Completado (100%)'}
                                  {isFailed && 'Error'}
                                  {isUploading && `Subiendo (${state.progress}%)`}
                                  {state.status === 'pending' && 'Esperando...'}
                                </span>
                              </div>

                              <div className="progress-bar-bg">
                                <div
                                  className="progress-bar-fill"
                                  style={{
                                    width: `${state.progress}%`,
                                    background: isFailed ? 'var(--error)' : isSuccess ? 'var(--success)' : undefined
                                  }}
                                ></div>
                              </div>

                              {isFailed && (
                                <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '8px', background: 'rgba(255,0,0,0.1)', padding: '6px 10px', borderRadius: '4px' }}>
                                  Detalle: {state.error}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {isUploadFinished() && (
                        <button
                          onClick={handleClearUploadConsole}
                          className="btn btn-primary"
                          style={{ marginTop: '16px', width: '100%' }}
                        >
                          Entendido / Subir otro video
                        </button>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handlePublish} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Video Selector */}
                      <div className="form-group">
                        <label className="form-label">Archivo de Video</label>
                        
                        {!videoPreviewUrl ? (
                          <div
                            className="upload-zone"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <span className="upload-icon">📁</span>
                            <h3 className="upload-title">Arrastra tu video aquí</h3>
                            <p className="upload-desc">O haz clic para explorar tus archivos (MP4, MOV)</p>
                            <input
                              type="file"
                              accept="video/*"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              style={{ display: 'none' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="video-preview-box">
                              <video src={videoPreviewUrl} controls />
                              <button
                                type="button"
                                className="video-remove-btn"
                                onClick={removeSelectedVideo}
                              >
                                ✕
                              </button>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                              Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Local File Path Override (Convenient for big files) */}
                      {!selectedFile && (
                        <div className="form-group">
                          <label className="form-label">O Ruta Local del Video (Para archivos muy grandes)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ej: C:\Videos\mi-video.mp4"
                            value={localPath}
                            onChange={(e) => setLocalPath(e.target.value)}
                          />
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                            Ingresar la ruta absoluta es más rápido porque evita copiar el archivo en el navegador.
                          </p>
                        </div>
                      )}

                      {/* Video Title */}
                      <div className="form-group">
                        <label className="form-label">Título / Caption Principal</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Escribe un título llamativo..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          maxLength={100}
                        />
                      </div>

                      {/* Video Description */}
                      <div className="form-group">
                        <label className="form-label">Descripción / Contenido Adicional</label>
                        <textarea
                          className="form-textarea"
                          placeholder="Agrega hashtags (#Shorts, #Reels) y descripciones detalladas para tus videos..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '16px' }}
                      >
                        🚀 Publicar en Plataformas Seleccionadas
                      </button>
                    </form>
                  )}
                </div>

                {/* Right Column: Platform Selection checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="glass-card">
                    <h2 style={{ marginBottom: '8px', fontSize: '1.3rem' }}>📢 Canales de Destino</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                      Selecciona a qué plataformas deseas enviar este video. Debes tenerlas vinculadas primero.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {['youtube', 'tiktok', 'facebook'].map((p) => {
                        const connected = !!accounts[p];
                        const isChecked = selectedPlatforms[p];

                        return (
                          <div
                            key={p}
                            onClick={() => connected && togglePlatform(p)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-muted)',
                              background: connected
                                ? isChecked
                                  ? 'hsla(270, 95%, 60%, 0.08)'
                                  : 'hsla(260, 20%, 7%, 0.3)'
                                : 'hsla(260, 20%, 4%, 0.2)',
                              opacity: connected ? 1 : 0.5,
                              cursor: connected ? 'pointer' : 'not-allowed',
                              borderColor: isChecked ? 'var(--accent-purple)' : 'var(--border-muted)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className={`platform-logo ${p}`} style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                                {p === 'youtube' && 'YT'}
                                {p === 'tiktok' && 'TT'}
                                {p === 'facebook' && 'FB'}
                              </div>
                              <div>
                                <h4 style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
                                  {p === 'youtube' ? 'YouTube Shorts' : p === 'tiktok' ? 'TikTok' : 'Facebook Reels'}
                                </h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {connected ? `Perfil: ${accounts[p].title}` : 'No vinculada'}
                                </span>
                              </div>
                            </div>

                            {connected && (
                              <label className="platform-toggle" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePlatform(p)}
                                />
                                <span className="slider"></span>
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('accounts')}
                      className="btn btn-secondary"
                      style={{ marginTop: '20px', width: '100%', padding: '10px 16px', fontSize: '0.85rem' }}
                    >
                      🔗 Gestionar Vinculación de Cuentas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
