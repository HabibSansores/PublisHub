'use client';
import Link from 'next/link';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
    { id: 'accounts', label: 'Cuentas', icon: '👥' },
    { id: 'settings', label: 'Ajustes', icon: '⚙️' }
  ];

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100vh', position: 'sticky', top: 0 }}>
      <div>
        <div className="sidebar-brand">
          <div className="sidebar-logo">🚀 HubPublish</div>
        </div>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{
        marginTop: 'auto',
        paddingTop: '20px',
        borderTop: '1px solid var(--border-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontSize: '0.85rem'
      }}>
        <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition-smooth)', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-main)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
          <span>🔒</span> <span>Privacidad</span>
        </Link>
        <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition-smooth)', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-main)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
          <span>📄</span> <span>Términos de Servicio</span>
        </Link>
      </div>
    </aside>
  );
}

