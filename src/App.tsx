import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Orders from './components/Orders';
import SiteSettings from './components/SiteSettings';
import { Product, Order, View } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    if (!session) return;
    setDataLoading(true);
    
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*, product:products(*)').order('created_at', { ascending: false })
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    
    setDataLoading(false);
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-serif font-medium text-stone-900">Redy</h1>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <main className="flex-1 md:ml-64 p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          {dataLoading && (
            <div className="fixed top-8 right-8 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-200 shadow-sm flex items-center gap-2 z-50">
              <Loader2 className="animate-spin text-stone-400" size={16} />
              <span className="text-xs font-medium text-stone-500 uppercase tracking-widest">Mise à jour...</span>
            </div>
          )}

          {currentView === 'dashboard' && <Dashboard products={products} orders={orders} />}
          {currentView === 'products' && <Products products={products} onRefresh={fetchData} />}
          {currentView === 'orders' && <Orders orders={orders} onRefresh={fetchData} />}
          {currentView === 'settings' && <SiteSettings />}
        </div>
      </main>
    </div>
  );
}
