import React, { useState, useMemo } from 'react';
import { ShoppingBag, Package, TrendingUp, AlertCircle, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import { Product, Order } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  products: Product[];
  orders: Order[];
}

type TimeFilter = 'day' | 'week' | 'month' | 'all';

export default function Dashboard({ products, orders }: DashboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const filteredOrders = useMemo(() => {
    if (timeFilter === 'all') return orders;
    
    const now = new Date();
    const filterDate = new Date();
    
    if (timeFilter === 'day') filterDate.setHours(0, 0, 0, 0);
    else if (timeFilter === 'week') filterDate.setDate(now.getDate() - 7);
    else if (timeFilter === 'month') filterDate.setMonth(now.getMonth() - 1);
    
    return orders.filter(order => new Date(order.created_at) >= filterDate);
  }, [orders, timeFilter]);

  const stats = useMemo(() => {
    const deliveredOrders = filteredOrders.filter(o => o.status === 'Livré');
    const totalRevenue = deliveredOrders.reduce((acc, o) => acc + o.total_price, 0);
    const totalOrders = filteredOrders.length;
    const activeProducts = products.filter(p => p.is_active).length;
    const lowStockCount = products.filter(p => p.stock_quantity < 10).length;
    const totalStock = products.reduce((acc, p) => acc + p.stock_quantity, 0);

    return [
      { label: 'Chiffre d\'Affaires', value: `${Math.round(totalRevenue).toLocaleString()} DA`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
      { label: 'Commandes', value: totalOrders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
      { label: 'Stock Total', value: totalStock, icon: Package, color: 'bg-stone-50 text-stone-600' },
      { label: 'Produits Actifs', value: activeProducts, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
      { label: 'Stock Faible', value: lowStockCount, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
    ];
  }, [filteredOrders, products]);

  const productPerformance = useMemo(() => {
    return products.map(product => {
      const productOrders = filteredOrders.filter(o => o.product_id === product.id);
      const deliveredProductOrders = productOrders.filter(o => o.status === 'Livré');
      
      const totalSales = productOrders.reduce((acc, o) => acc + (o.quantity || 1), 0);
      const revenue = deliveredProductOrders.reduce((acc, o) => acc + o.total_price, 0);
      
      return {
        name: product.name,
        sales: totalSales,
        revenue: revenue,
        stock_quantity: product.stock_quantity
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [products, filteredOrders]);

  const chartData = useMemo(() => {
    return productPerformance.slice(0, 5).map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name,
      revenue: p.revenue
    }));
  }, [productPerformance]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-medium text-stone-900">Tableau de Bord</h2>
          <p className="text-stone-500">Statistiques et performance de votre boutique.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            className="bg-stone-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-stone-800 transition-all flex items-center gap-2"
            onClick={() => window.open(`https://wa.me/213000000000?text=${encodeURIComponent('Bonjour, je souhaite passer une commande en gros.')}`, '_blank')}
          >
            <Package size={18} />
            Commande en gros
          </button>

          <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
            {(['day', 'week', 'month', 'all'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeFilter === filter 
                    ? 'bg-stone-900 text-white shadow-md' 
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {filter === 'day' ? 'Jour' : filter === 'week' ? 'Semaine' : filter === 'month' ? 'Mois' : 'Tout'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest italic">{stat.label}</p>
            <p className="text-2xl font-serif font-medium text-stone-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-stone-100 rounded-lg">
              <BarChart3 size={20} className="text-stone-600" />
            </div>
            <h3 className="text-xl font-serif font-medium text-stone-900 italic">Top 5 Produits par Revenu</h3>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#fafaf9' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e7e5e4', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                    fontFamily: 'serif'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} DA`, 'Revenu']}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1c1917' : '#78716c'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <h3 className="text-xl font-serif font-medium text-stone-900 italic">Alertes Stock</h3>
          </div>
          
          <div className="space-y-4">
            {products.filter(p => p.stock_quantity < 10).length > 0 ? (
              products.filter(p => p.stock_quantity < 10).slice(0, 6).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50/30 rounded-xl border border-amber-100">
                  <div className="flex flex-col">
                    <span className="text-stone-900 font-medium text-sm">{product.name}</span>
                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Rupture proche</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-amber-700">{product.stock_quantity}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                <Package size={48} className="opacity-20 mb-2" />
                <p className="text-sm italic">Tout est en stock</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-xl font-serif font-medium text-stone-900 italic">Performance par Produit</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest italic">Produit</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest italic text-center">Ventes</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest italic text-center">Revenu</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest italic text-center">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest italic text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {productPerformance.map((perf, i) => (
                <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-900">{perf.name}</td>
                  <td className="px-6 py-4 text-center text-stone-600 font-mono">{perf.sales}</td>
                  <td className="px-6 py-4 text-center text-stone-900 font-mono font-medium">{Math.round(perf.revenue).toLocaleString()} DA</td>
                  <td className="px-6 py-4 text-center text-stone-600 font-mono">{perf.stock_quantity}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      perf.stock_quantity === 0 ? 'bg-red-50 text-red-600' :
                      perf.stock_quantity < 10 ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {perf.stock_quantity === 0 ? 'Épuisé' : perf.stock_quantity < 10 ? 'Faible' : 'En stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
