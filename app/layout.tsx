import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import { getCurrentUser } from './actions/auth';
import { getStoreSettings } from './actions/settings';

export const metadata: Metadata = {
  title: 'Offline Fabric POS System',
  description: 'Custom Tailoring & Fabric POS Software',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Logged-in user fetch kar rahe hain
  const currentUser = await getCurrentUser();
  const settings = await getStoreSettings();

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 flex h-screen overflow-hidden font-sans">
        {/* Agar user logged in hai to hi Sidebar render hoga */}
        {currentUser && <Sidebar currentUser={currentUser} settings={settings} />}

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Agar user logged in hai to hi Header render hoga */}
          {currentUser && <Header currentUser={currentUser} />}
          
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}