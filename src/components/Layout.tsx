import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ClipboardCheck, BarChart2, Home, CheckSquare } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Audit 6S</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="container mx-auto px-4 py-2">
          <ul className="flex justify-around">
            <li>
              <Link 
                to="/" 
                className={`flex flex-col items-center p-2 ${
                  isActive('/') ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <Home size={24} />
                <span className="text-xs mt-1">Accueil</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/actions" 
                className={`flex flex-col items-center p-2 ${
                  isActive('/actions') ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <CheckSquare size={24} />
                <span className="text-xs mt-1">Actions</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/reports" 
                className={`flex flex-col items-center p-2 ${
                  location.pathname.startsWith('/reports') ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <BarChart2 size={24} />
                <span className="text-xs mt-1">Rapports</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Add padding to account for the fixed bottom nav */}
      <div className="pb-16"></div>
    </div>
  );
};

export default Layout;