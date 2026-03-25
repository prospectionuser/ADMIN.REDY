import React, { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, Image as ImageIcon, Trash2, Edit2, Plus, X, Check, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';

interface SiteSettingsProps {
  categories: Category[];
  onRefresh: () => void;
}

export default function SiteSettings({ categories, onRefresh }: SiteSettingsProps) {
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [heroUrl, setHeroUrl] = useState<string>('');
  const [heroBgUrl, setHeroBgUrl] = useState<string>('');
  const [heroTitle, setHeroTitle] = useState<string>('');
  const [heroSubtitle, setHeroSubtitle] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingHeroBg, setUploadingHeroBg] = useState(false);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const heroBgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('DEBUG: SiteSettings component mounted, calling fetchSettings');
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
        const heroBg = data.find(s => s.key === 'hero_background_url');
        const title = data.find(s => s.key === 'hero_title');
        const subtitle = data.find(s => s.key === 'hero_subtitle');
        
        if (logo) setLogoUrl(logo.value);
        if (hero) setHeroUrl(hero.value);
        if (heroBg) setHeroBgUrl(heroBg.value);
        if (title) setHeroTitle(title.value);
        if (subtitle) setHeroSubtitle(subtitle.value);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmittingCategory(true);
    try {
      const slug = generateSlug(newCategoryName);
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName, slug }]);

      if (error) throw error;

      setNewCategoryName('');
      onRefresh();
      showNotification('success', 'Catégorie ajoutée avec succès !');
    } catch (error: any) {
      console.error('Error adding category:', error);
      showNotification('error', `Erreur: ${error.message}`);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;

    setIsSubmittingCategory(true);
    try {
      const slug = generateSlug(editCategoryName);
      const { error } = await supabase
        .from('categories')
        .update({ name: editCategoryName, slug })
        .eq('id', editingCategory.id);

      if (error) throw error;

      setEditingCategory(null);
      setEditCategoryName('');
      onRefresh();
      showNotification('success', 'Catégorie mise à jour !');
    } catch (error: any) {
      console.error('Error updating category:', error);
      showNotification('error', `Erreur: ${error.message}`);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Assurez-vous qu\'aucun produit n\'y est rattaché.')) {
      return;
    }

    try {
      // Check if products exist in this category
      // Note: This assumes the 'category' field in products matches the category slug
      const categoryToDelete = categories.find(c => c.id === id);
      if (categoryToDelete) {
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category', categoryToDelete.name);
        
        if (countError) throw countError;
        if (count && count > 0) {
          showNotification('error', `Impossible de supprimer : ${count} produit(s) utilisent cette catégorie.`);
          return;
        }
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      onRefresh();
      showNotification('success', 'Catégorie supprimée.');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showNotification('error', `Erreur: ${error.message}`);
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

  const handleSaveHeroSettings = async () => {
    setIsSavingHero(true);
    try {
      const settings = [
        { key: 'hero_title', value: heroTitle },
        { key: 'hero_subtitle', value: heroSubtitle },
        { key: 'hero_background_url', value: heroBgUrl }
      ];

      const { error } = await supabase
        .from('site_settings')
        .upsert(settings, { onConflict: 'key' });

      if (error) throw error;
      showNotification('success', 'Configuration du Hero enregistrée !');
    } catch (error: any) {
      console.error('Error saving hero settings:', error);
      showNotification('error', `Erreur: ${error.message}`);
    } finally {
      setIsSavingHero(false);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: 'logo' | 'hero_image' | 'hero_background_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation for Hero Background (Video only as per new request)
    if (key === 'hero_background_url' && !file.type.startsWith('video/')) {
      showNotification('error', 'Veuillez sélectionner un fichier vidéo uniquement.');
      return;
    }

    let setUploading;
    if (key === 'logo') setUploading = setUploadingLogo;
    else if (key === 'hero_image') setUploading = setUploadingHero;
    else setUploading = setUploadingHeroBg;

    setUploading(true);

    try {
      let url;
      if (key === 'hero_background_url') {
        url = await uploadToCloudinary(file);
      } else {
        url = await uploadImage(file);
      }
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value: url }, { onConflict: 'key' });

      if (error) throw error;

      // Update local state immediately with the new URL
      if (key === 'logo') {
        setLogoUrl(url);
      } else if (key === 'hero_image') {
        setHeroUrl(url);
      } else {
        setHeroBgUrl(url);
      }

      if (key !== 'hero_background_url') {
        showNotification('success', `${key === 'logo' ? 'Logo' : 'Image Hero'} mis à jour avec succès !`);
      }
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

      {/* Hero Configuration Section */}
      <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg">
              <Edit2 size={20} className="text-stone-600" />
            </div>
            <h3 className="text-xl font-serif font-medium text-stone-900">Configuration du Hero</h3>
          </div>
          <button
            onClick={handleSaveHeroSettings}
            disabled={isSavingHero}
            className="bg-stone-900 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-stone-800 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg"
          >
            {isSavingHero ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Enregistrer les modifications
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Text Inputs */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest italic border-b border-stone-100 pb-2">Textes du Hero</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Titre du Hero</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Ex: REDY COSMÉTIQUE"
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Sous-titre du Hero</label>
                <textarea
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="Ex: Révélez votre éclat naturel avec nos soins d'exception."
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all h-24 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Video Upload & Preview */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest italic border-b border-stone-100 pb-2">Vidéo d'arrière-plan</h4>
            
            <div className="aspect-video rounded-2xl border border-stone-100 bg-stone-50 overflow-hidden flex items-center justify-center relative group">
              {heroBgUrl ? (
                <video 
                  key={heroBgUrl}
                  src={heroBgUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className={`w-full h-full object-cover transition-opacity duration-300 ${uploadingHeroBg ? 'opacity-30' : 'opacity-100'}`} 
                />
              ) : (
                <div className="text-stone-300 flex flex-col items-center">
                  <Package size={48} />
                  <span className="text-xs mt-2">Aucune vidéo définie</span>
                </div>
              )}

              {uploadingHeroBg && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                  <Loader2 className="animate-spin text-stone-900" size={32} />
                </div>
              )}

              {!uploadingHeroBg && (
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => heroBgInputRef.current?.click()}
                    className="bg-white text-stone-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-50 transition-all flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Uploader une vidéo
                  </button>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={heroBgInputRef} 
              onChange={(e) => handleFileChange(e, 'hero_background_url')} 
              accept="video/*" 
              className="hidden" 
            />
            <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                <strong>Important :</strong> Seuls les fichiers vidéo sont acceptés. L'URL sera mise à jour après l'upload, mais n'oubliez pas de cliquer sur "Enregistrer les modifications" pour valider le titre et le sous-titre.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Management Section */}
      <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg">
              <Plus size={20} className="text-stone-600" />
            </div>
            <h3 className="text-xl font-serif font-medium text-stone-900">Gestion des Catégories</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Category Form */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest italic">Ajouter une catégorie</h4>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Nom de la catégorie</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Soins Visage"
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingCategory || !newCategoryName.trim()}
                className="w-full bg-stone-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmittingCategory ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Ajouter
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest italic">Liste des catégories</h4>
            <div className="border border-stone-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Nom</th>
                    <th className="px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Slug</th>
                    <th className="px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-widest italic text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-stone-400 italic">
                        Aucune catégorie définie.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-6 py-4">
                          {editingCategory?.id === category.id ? (
                            <input
                              type="text"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="w-full px-3 py-1 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none text-sm"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium text-stone-900">{category.name}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-600">{category.slug}</code>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingCategory?.id === category.id ? (
                              <>
                                <button
                                  onClick={handleUpdateCategory}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Enregistrer"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => setEditingCategory(null)}
                                  className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                                  title="Annuler"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setEditCategoryName(category.name);
                                  }}
                                  className="p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
