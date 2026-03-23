import React from 'react';
import { ShoppingBag, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { Product, Order } from '../types';

interface DashboardProps {
  products: Product[];
  orders: Order[];
}

export default function Dashboard({ products, orders }: DashboardProps) {
  const totalOrders = orders.length;
  const lowStockProducts = products.filter(p => p.stock < 10);
  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const activeProducts = products.filter(p => p.is_active).length;

  const stats = [
    { label: 'Total Commandes', value: totalOrders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Stock Total', value: totalStock, icon: Package, color: 'bg-stone-50 text-stone-600' },
    { label: 'Produits Actifs', value: activeProducts, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Stock Faible', value: lowStockProducts.length, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-serif font-medium text-stone-900">Vue d'ensemble</h2>
        <p className="text-stone-500">Bienvenue sur votre tableau de bord Redy.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-serif font-medium text-stone-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-xl font-serif font-medium text-stone-900 mb-6 italic">Stock par produit</h3>
          <div className="space-y-4">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-stone-700 font-medium">{product.name}</span>
                <div className="flex items-center gap-4">
                  <div className="flex-1 sm:w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${product.stock < 10 ? 'bg-amber-500' : 'bg-stone-900'}`}
                      style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-medium w-8 text-right">{product.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-xl font-serif font-medium text-stone-900 mb-6 italic">Dernières commandes</h3>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-xl transition-colors">
                <div>
                  <p className="font-medium text-stone-900">{order.customer_name}</p>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{order.customer_phone}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  order.status === 'Nouveau' ? 'bg-blue-50 text-blue-600' :
                  order.status === 'Livré' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-stone-100 text-stone-600'
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
