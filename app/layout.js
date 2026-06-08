import './globals.css';

export const metadata = {
  title: 'Multi-Publish Hub - Sube Videos Simultáneamente',
  description: 'Sube tus videos a YouTube Shorts, TikTok y Facebook Reels al mismo tiempo de manera eficiente.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
