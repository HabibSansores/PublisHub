'use client';

export default function TermsOfService() {
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
          Términos de Servicio
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.95rem' }}>
          Última actualización: 8 de junio de 2026
        </p>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>1. Aceptación de los Términos</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Al utilizar la aplicación local <strong>HubPublish</strong>, aceptas cumplir con estos términos. El software se proporciona de forma gratuita y para uso individual.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>2. Responsabilidad de Credenciales y Uso</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
            Eres responsable exclusivo de la creación, gestión y seguridad de las claves de API y secretos de cliente de terceros (Google, TikTok, Meta) que configures en la aplicación.
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            El uso de esta herramienta está sujeto a las directrices de contenido y términos de servicio de cada plataforma externa. No somos responsables de ninguna suspensión de cuenta, bloqueo de API o penalización por parte de YouTube, TikTok o Facebook debido al contenido publicado a través de esta app.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>3. Limitación de Responsabilidad</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            El software se proporciona "tal cual", sin garantías de ningún tipo respecto a su funcionamiento, disponibilidad o estabilidad de las APIs de terceros, las cuales pueden cambiar sin previo aviso.
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
