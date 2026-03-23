import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, LogOut, X, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentView, setView, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products' as const, label: 'Produits', icon: Package },
    { id: 'orders' as const, label: 'Commandes', icon: ShoppingCart },
    { id: 'settings' as const, label: 'Paramètres', icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`w-64 bg-stone-900 text-stone-400 flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-medium text-white tracking-tight">Redy</h1>
            <p className="text-xs uppercase tracking-widest text-stone-500 mt-1">Administration</p>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-stone-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentView === item.id
                ? 'bg-stone-800 text-white'
                : 'hover:bg-stone-800/50 hover:text-stone-200'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:bg-red-900/20 hover:text-red-400 transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  </>
);
}
