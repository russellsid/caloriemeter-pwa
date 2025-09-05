// app/layout.tsx
export const metadata = {
  title: 'Calorie Meter',
  description: 'Local-first calorie & macro tracker',
};

import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        {/* (Keep SW registration minimal) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/service-worker.js');
                });
              }
            `,
          }}
        />

        {/* Top nav appears on every page */}
        <header className="cm-header">
          <a className="cm-logo" href="/">Calorie Meter</a>
          <nav className="cm-nav">
            <a className="btn" href="/">Home</a>
            <a className="btn" href="/add">+ Add</a>
            <a className="btn" href="/recipes">Recipes</a>
          </nav>
        </header>

        <main className="cm-container">{children}</main>
      </body>
    </html>
  );
}
