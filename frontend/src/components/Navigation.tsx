'use client';

import Link from 'next/link';
import { ConnectButton } from './ConnectButton';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  const navItems = [
    { label: '🎨 Mint', href: '/' },
    { label: '🖼️ Gallery', href: '/gallery' },
    { label: '🧬 Breed', href: '/breed' },
    { label: '⚔️ Battle', href: '/battle' },
  ];

  return (
    <nav className="bg-[#1a1f2e] border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-[#7c3aed]">
              Battle Monsters
            </Link>

            <div className="flex gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-[#7c3aed] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#2a3142]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <ConnectButton />
        </div>
      </div>
    </nav>
  );
} 