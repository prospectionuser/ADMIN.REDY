import React, { useState } from 'react';
import { Phone, MapPin, User, Package, Eye, X, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';

interface OrdersProps {
  orders: Order[];
  onRefresh: () => void;
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default function Orders({ orders, onRefresh }: OrdersProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const statusOptions = ['Nouveau', 'En préparation', 'Expédié', 'Livré', 'Annulé'] as const;

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      showNotification('Statut mis à jour');
      
      // Update selected order if it's the one being modified
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      onRefresh();
    } catch (error: any) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-medium text-stone-900">Commandes</h2>
          <p className="text-stone-500">Suivez et gérez les commandes de vos clients.</p>
        </div>
        {notification && (
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-medium border border-emerald-100 animate-in fade-in slide-in-from-top-4 duration-300">
            {notification}
          </div>
        )}
      </header>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
          <thead>
            <tr className="bg-stone-50 border-bottom border-stone-200">
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Client</th>
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Produit</th>
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Adresse</th>
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Statut</th>
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-stone-900 font-medium">
                      <User size={14} className="text-stone-400" />
                      {order.customer_name}
                    </div>
                    <div className="flex items-center gap-2 text-stone-500 text-sm">
                      <Phone size={14} className="text-stone-400" />
                      {order.customer_phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 text-stone-700">
                    <div className="w-8 h-8 rounded bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                      {order.product?.image_url ? (
                        <img src={order.product.image_url} alt={order.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Package size={14} />
                        </div>
                      )}
                    </div>
                    {order.product?.name || 'Produit inconnu'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2 text-stone-500 text-sm max-w-xs">
                    <MapPin size={14} className="text-stone-400 mt-1 shrink-0" />
                    {order.customer_address || 'Adresse non renseignée'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.status === 'Nouveau' ? 'bg-blue-50 text-blue-600' :
                    order.status === 'En préparation' ? 'bg-amber-50 text-amber-600' :
                    order.status === 'Expédié' ? 'bg-purple-50 text-purple-600' :
                    order.status === 'Livré' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-stone-400 hover:text-stone-900 transition-colors inline-flex items-center gap-1.5 text-sm font-medium"
                  >
                    <Eye size={18} />
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xl font-serif font-medium text-stone-900">Détails de la commande</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-900">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-stone-400 uppercase tracking-widest italic block mb-1">Client</label>
                    <div className="flex items-center gap-2 text-stone-900 font-medium">
                      <User size={16} className="text-stone-400" />
                      {selectedOrder.customer_name}
                    </div>
                    <div className="mt-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-0.5">Adresse de livraison :</label>
                      <div className="flex items-start gap-2 text-stone-600 text-sm bg-stone-50 p-2 rounded-lg border border-stone-100">
                        <MapPin size={14} className="text-stone-400 mt-0.5 shrink-0" />
                        {selectedOrder.customer_address || 'Adresse non renseignée'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-400 uppercase tracking-widest italic block mb-1">Téléphone</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-stone-600">
                        <Phone size={16} className="text-stone-400" />
                        {selectedOrder.customer_phone}
                      </div>
                      <a 
                        href={`https://wa.me/213${selectedOrder.customer_phone.startsWith('0') ? selectedOrder.customer_phone.substring(1) : selectedOrder.customer_phone}?text=${encodeURIComponent(`Bonjour, c'est Redy. Nous préparons votre commande de ${selectedOrder.product?.name || 'votre produit'}. Pouvez-vous nous confirmer votre adresse ?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#128C7E] transition-colors w-fit"
                      >
                        <WhatsAppIcon />
                        Contacter sur WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-stone-400 uppercase tracking-widest italic block mb-1">Modifier le statut</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as Order['status'])}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-bold border-2 focus:ring-0 outline-none cursor-pointer transition-all ${
                        selectedOrder.status === 'Nouveau' ? 'border-blue-200 bg-blue-50 text-blue-600' :
                        selectedOrder.status === 'En préparation' ? 'border-amber-200 bg-amber-50 text-amber-600' :
                        selectedOrder.status === 'Expédié' ? 'border-purple-200 bg-purple-50 text-purple-600' :
                        selectedOrder.status === 'Livré' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' :
                        'border-red-200 bg-red-50 text-red-600'
                      }`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-400 uppercase tracking-widest italic block mb-1">Prix Total</label>
                    <div className="text-lg font-mono font-medium text-stone-900">
                      {Math.round(selectedOrder.total_price)} DA
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-stone-100">
                <div>
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest italic block mb-1">Produit commandé</label>
                  <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="w-12 h-12 rounded bg-white overflow-hidden shrink-0 border border-stone-200">
                      {selectedOrder.product?.image_url ? (
                        <img src={selectedOrder.product.image_url} alt={selectedOrder.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-stone-900">
                      {selectedOrder.product?.name || 'Produit inconnu'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
