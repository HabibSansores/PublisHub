'use client';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px' }}>
      <div className="glass-card" style={{ padding: '40px', lineHeight: '1.6' }}>
        <h1 style={{
          marginBottom: '24px',
          fontSize: '2rem',
          background: 'linear-gradient(135deg, #fff 30%, var(--accent-purple) 70%, var(--accent-cyan) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '800'
        }}>
          Política de Privacidad
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.95rem' }}>
          Última actualización: 8 de junio de 2026
        </p>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>1. Almacenamiento Local de Datos</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
            <strong>HubPublish</strong> es una herramienta auto-alojada que se ejecuta localmente en la computadora del usuario. Toda la información personal, incluyendo claves de API, secretos de cliente y tokens de acceso OAuth, se almacena de forma exclusiva en tu máquina local (dentro del archivo <code>data/db.json</code>).
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            Esta aplicación <strong>no</strong> cuenta con un servidor centralizado ni bases de datos en la nube de terceros. Tus credenciales nunca son transmitidas, compartidas ni vendidas.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>2. Comunicación con APIs Oficiales</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            La aplicación interactúa directamente con los servidores oficiales de YouTube (Google Cloud), TikTok Developer Portal y Facebook (Meta Graph API) mediante conexiones HTTPS seguras. La transferencia de tus videos se realiza directamente desde tu computadora a los servidores de las respectivas plataformas.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>3. Seguridad y Código Abierto</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Al ser una aplicación de código abierto y ejecutarse de manera local, tienes control total sobre la ejecución del código. Te recomendamos no compartir el archivo de base de datos local <code>data/db.json</code> y añadirlo a tu archivo <code>.gitignore</code> para evitar subirlo a repositorios públicos como GitHub.
          </p>
        </section>

        <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-muted)', paddingTop: '20px', textAlign: 'center' }}>
          <a href="/" className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
            Volver al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
