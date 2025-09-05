export const metadata = { title: "Calorie Meter", description: "Local-first macro & calorie tracker PWA" };
import "./globals.css";
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
        <script dangerouslySetInnerHTML={{__html:`if ('serviceWorker' in navigator) { window.addEventListener('load', function(){ navigator.serviceWorker.register('/service-worker.js'); }); }`}} />
        <div style={{maxWidth: 800, margin: '0 auto', padding: 16}}>{children}</div>
      </body>
    </html>
  );
}
