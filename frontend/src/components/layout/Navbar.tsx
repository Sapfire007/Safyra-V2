'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Products', path: '/products' },
  { name: 'About Us', path: '/about' },
  { name: 'Contact Us', path: '/contact' },
  { name: 'Dashboard', path: '/dashboard' }
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="group">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center mr-2">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-safyra-navy">Safyra</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`nav-link px-3 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                pathname === item.path
                  ? 'text-rose-600 bg-rose-50'
                  : 'text-gray-600 hover:text-rose-600 hover:bg-gray-50'
              } ${
                item.name === 'Dashboard'
                  ? 'border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300'
                  : ''
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          {user ? (
            <button
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-rose-600 transition-colors rounded-md hover:bg-gray-50"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span className="font-medium">Logout</span>
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="px-6 py-2 bg-rose-600 text-white font-medium rounded-full hover:bg-rose-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-safyra-navy"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`nav-link block px-4 py-3 rounded-md font-medium transition-all duration-200 ${
                  pathname === item.path
                    ? 'text-rose-600 bg-rose-50 border-l-4 border-rose-600'
                    : 'text-gray-600 hover:text-rose-600 hover:bg-gray-50'
                } ${
                  item.name === 'Dashboard'
                    ? 'border border-rose-200 bg-rose-50 text-rose-600'
                    : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {user ? (
              <button
                className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-rose-600 hover:bg-gray-50 rounded-md transition-all duration-200 font-medium"
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="mx-4 px-6 py-3 bg-rose-600 text-white font-medium rounded-full hover:bg-rose-700 transition-all duration-200 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
