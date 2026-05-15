import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ERM Chatbot',
  description: 'Full-screen chatbot and RACI user management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <div className="brand">
              <div className="brand-logo">ERM</div>
              <div>
                <div className="brand-title">ERM Workflow</div>
                <div className="brand-subtitle">RACI chatbot & user management</div>
              </div>
            </div>
            <nav className="site-nav">
              <Link href="/">Chat</Link>
              <Link href="/users">Users</Link>
              <Link href="/submissions">Submissions</Link>
            </nav>
          </header>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
