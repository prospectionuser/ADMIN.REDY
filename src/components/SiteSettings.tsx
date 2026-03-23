import React, { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SiteSettings() {
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [heroUrl, setHeroUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;

      if (data) {
        const logo = data.find(s => s.key === 'logo');
        const hero = data.find(s => s.key === 'hero_image');
        if (logo) setLogoUrl(logo.value);
        if (hero) setHeroUrl(hero.value);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `site/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: 'logo' | 'hero_image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = key === 'logo' ? setUploadingLogo : setUploadingHero;
    setUploading(true);

    try {
      const url = await uploadImage(file);
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value: url }, { onConflict: 'key' });

      if (error) throw error;

      // Update local state immediately with the new URL
      if (key === 'logo') {
        setLogoUrl(url);
      } else {
        setHeroUrl(url);
      }

      showNotification('success', `${key === 'logo' ? 'Logo' : 'Image Hero'} mis à jour avec succès !`);
    } catch (error: any) {
      console.error(`Error updating ${key}:`, error);
      showNotification('error', `Erreur lors de la mise à jour: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset input value to allow selecting the same file again if needed
      if (e.target) e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-medium text-stone-900">Paramètres du Site</h2>
          <p className="text-stone-500">Personnalisez l'apparence de votre boutique.</p>
        </div>
        {notification && (
          <div className={`px-4 py-2 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
          }`}>
            {notification.message}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Logo Section */}
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-stone-100 rounded-lg">
              <ImageIcon size={20} className="text-stone-600" />
            </div>
            <h3 className="text-xl font-serif font-medium text-stone-900">Logo du site</h3>
          </div>
          
          <div className="aspect-video rounded-2xl border border-stone-100 bg-stone-50 overflow-hidden flex items-center justify-center relative group">
            {logoUrl ? (
              <img 
                key={logoUrl} // Force re-render if URL changes
                src={logoUrl} 
                alt="Logo" 
                className={`max-w-full max-h-full object-contain p-4 transition-opacity duration-300 ${uploadingLogo ? 'opacity-30' : 'opacity-100'}`} 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="text-stone-300 flex flex-col items-center">
                <ImageIcon size={48} />
                <span className="text-xs mt-2">Aucun logo défini</span>
              </div>
            )}
            
            {uploadingLogo && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                <Loader2 className="animate-spin text-stone-900" size={32} />
              </div>
            )}

            {!uploadingLogo && (
              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => logoInputRef.current?.click()}
                  className="bg-white text-stone-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-50 transition-all flex items-center gap-2"
                >
                  <Upload size={16} />
                  Changer le logo
                </button>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={logoInputRef} 
            onChange={(e) => handleFileChange(e, 'logo')} 
            accept="image/*" 
            className="hidden" 
          />
          <p className="text-sm text-stone-500 italic">Format recommandé : PNG ou SVG avec fond transparent.</p>
        </div>

        {/* Hero Image Section */}
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-stone-100 rounded-lg">
              <ImageIcon size={20} className="text-stone-600" />
            </div>
            <h3 className="text-xl font-serif font-medium text-stone-900">Image Hero</h3>
          </div>
          
          <div className="aspect-video rounded-2xl border border-stone-100 bg-stone-50 overflow-hidden flex items-center justify-center relative group">
            {heroUrl ? (
              <img 
                key={heroUrl} // Force re-render if URL changes
                src={heroUrl} 
                alt="Hero" 
                className={`w-full h-full object-cover transition-opacity duration-300 ${uploadingHero ? 'opacity-30' : 'opacity-100'}`} 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="text-stone-300 flex flex-col items-center">
                <ImageIcon size={48} />
                <span className="text-xs mt-2">Aucune image hero définie</span>
              </div>
            )}

            {uploadingHero && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                <Loader2 className="animate-spin text-stone-900" size={32} />
              </div>
            )}

            {!uploadingHero && (
              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => heroInputRef.current?.click()}
                  className="bg-white text-stone-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-50 transition-all flex items-center gap-2"
                >
                  <Upload size={16} />
                  Changer l'image
                </button>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={heroInputRef} 
            onChange={(e) => handleFileChange(e, 'hero_image')} 
            accept="image/*" 
            className="hidden" 
          />
          <p className="text-sm text-stone-500 italic">Format recommandé : JPG ou WebP haute résolution (1920x1080).</p>
        </div>
      </div>
    </div>
  );
}
