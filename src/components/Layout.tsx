import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ClipboardCheck, BarChart2, Home, CheckSquare, Lightbulb } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Audit 6S</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl">
        <div className="container mx-auto px-4 py-2">
          <ul className="flex justify-around">
            <li>
              <Link 
                to="/" 
                className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
                  isActive('/') 
                    ? 'text-blue-600 bg-blue-50 transform -translate-y-1' 
                    : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                }`}
              >
                <Home size={24} />
                <span className="text-xs mt-1 font-medium">Accueil</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/actions" 
                className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
                  isActive('/actions') 
                    ? 'text-orange-600 bg-orange-50 transform -translate-y-1' 
                    : 'text-gray-600 hover:text-orange-500 hover:bg-gray-50'
                }`}
              >
                <CheckSquare size={24} />
                <span className="text-xs mt-1 font-medium">Actions</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/improvements" 
                className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
                  isActive('/improvements') 
                    ? 'text-purple-600 bg-purple-50 transform -translate-y-1' 
                    : 'text-gray-600 hover:text-purple-500 hover:bg-gray-50'
                }`}
              >
                <Lightbulb size={24} />
                <span className="text-xs mt-1 font-medium">Améliorations</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/reports" 
                className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
                  location.pathname.startsWith('/reports') 
                    ? 'text-green-600 bg-green-50 transform -translate-y-1' 
                    : 'text-gray-600 hover:text-green-500 hover:bg-gray-50'
                }`}
              >
                <BarChart2 size={24} />
                <span className="text-xs mt-1 font-medium">Rapports</span>
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