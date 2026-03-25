import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Upload, Loader2, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';

interface ProductsProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
}

export default function Products({ products, categories, onRefresh }: ProductsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    image_url: '',
    gallery_urls: [] as string[],
    video_url: '',
    category: '',
    category_id: '',
    is_active: true,
  });

  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      setFormData(prev => ({ 
        ...prev, 
        category: categories[0].name,
        category_id: categories[0].id 
      }));
    }
  }, [categories]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url || '',
        gallery_urls: product.gallery_urls || [],
        video_url: product.video_url || '',
        category: product.category || (categories.length > 0 ? categories[0].name : ''),
        category_id: product.category_id || (categories.length > 0 ? categories[0].id : ''),
        is_active: product.is_active,
      });
      setGalleryPreviews(product.gallery_urls || []);
      setVideoPreview(product.video_url || null);
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        description: '', 
        price: 0, 
        stock_quantity: 0, 
        image_url: '', 
        gallery_urls: [],
        video_url: '',
        category: categories.length > 0 ? categories[0].name : '',
        category_id: categories.length > 0 ? categories[0].id : '',
        is_active: true 
      });
      setGalleryPreviews([]);
      setVideoPreview(null);
    }
    setImageFiles([]);
    setVideoFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    
    const files = Array.from(fileList);
    setImageFiles(prev => [...prev, ...files]);
    
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeGalleryImage = (index: number) => {
    // If it's an existing URL
    const existingUrlsCount = formData.gallery_urls.length;
    
    if (index < existingUrlsCount) {
      const newUrls = [...formData.gallery_urls];
      newUrls.splice(index, 1);
      setFormData({ ...formData, gallery_urls: newUrls });
      setGalleryPreviews(prev => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
    } else {
      // It's a newly added file
      const fileIndex = index - existingUrlsCount;
      const newFiles = [...imageFiles];
      newFiles.splice(fileIndex, 1);
      setImageFiles(newFiles);
      setGalleryPreviews(prev => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
    }
  };

  const uploadFile = async (file: File, type: 'image' | 'video'): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Configuration Cloudinary manquante. Veuillez vérifier vos variables d'environnement.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "L'upload vers Cloudinary a échoué");
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let uploadedImageUrls: string[] = [];
      let uploadedVideoUrl = formData.video_url;

      // Upload images
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(file => uploadFile(file, 'image'));
        uploadedImageUrls = await Promise.all(uploadPromises);
      }

      // Upload video
      if (videoFile) {
        uploadedVideoUrl = await uploadFile(videoFile, 'video');
      }

      const finalGalleryUrls = [...formData.gallery_urls, ...uploadedImageUrls];
      const finalImageUrl = finalGalleryUrls.length > 0 ? finalGalleryUrls[0] : '';

      const payload = {
        ...formData,
        gallery_urls: finalGalleryUrls,
        image_url: finalImageUrl,
        video_url: uploadedVideoUrl,
      };

      console.log('Données envoyées :', payload);

      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        showNotification('success', 'Produit mis à jour avec succès !');
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
        showNotification('success', 'Produit ajouté avec succès !');
      }
      
      setIsModalOpen(false);
      onRefresh();
    } catch (error: any) {
      console.error('Error saving product:', error);
      showNotification('error', `Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStock = async (id: string, newStock: number) => {
    await supabase.from('products').update({ stock_quantity: Math.floor(newStock) }).eq('id', id);
    onRefresh();
  };

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      showNotification('success', 'Produit supprimé avec succès !');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      showNotification('error', `Erreur lors de la suppression: ${error.message}`);
    } finally {
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-medium text-stone-900">Produits</h2>
          <p className="text-stone-500">Gérez votre catalogue de cosmétiques.</p>
        </div>
        <div className="flex items-center gap-4">
          {notification && (
            <div className={`px-4 py-2 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300 ${
              notification.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {notification.message}
            </div>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Nouveau Produit
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
          <thead>
            <tr className="bg-stone-50 border-bottom border-stone-200">
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Produit</th>
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Catégorie</th>
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Prix</th>
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Stock</th>
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic">Statut</th>
              <th className="px-6 py-4 text-xs font-medium text-stone-500 uppercase tracking-widest italic text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-stone-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-stone-600 capitalize">
                    {product.category || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-stone-600">{Math.round(product.price)} DA</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-medium ${product.stock_quantity < 10 ? 'text-amber-600' : 'text-stone-900'}`}>
                      {product.stock_quantity}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => updateStock(product.id, product.stock_quantity + 1)}
                        className="p-1 hover:bg-stone-200 rounded text-stone-500"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => updateStock(product.id, Math.max(0, product.stock_quantity - 1))}
                        className="p-1 hover:bg-stone-200 rounded text-stone-500"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    product.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {product.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(product)}
                      className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => setProductToDelete(product)}
                      className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 md:px-8 py-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-serif font-medium text-stone-900">
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-900">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Nom du produit</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Catégorie</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => {
                        const selectedCategory = categories.find(c => c.id === e.target.value);
                        setFormData({ 
                          ...formData, 
                          category_id: e.target.value,
                          category: selectedCategory ? selectedCategory.name : ''
                        });
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none bg-white"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-none"
                      placeholder="Décrivez votre produit..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Prix (DA)</label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={isNaN(formData.price) ? '' : formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Stock</label>
                      <input
                        type="number"
                        required
                        value={isNaN(formData.stock_quantity) ? '' : formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value === '' ? 0 : Math.floor(parseInt(e.target.value)) })}
                        className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Galerie Photos</label>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {galleryPreviews.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group">
                          <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-stone-200 hover:border-stone-400 transition-all flex flex-col items-center justify-center bg-stone-50 group"
                      >
                        <Upload size={20} className="text-stone-300 group-hover:text-stone-500 transition-colors" />
                        <span className="text-[10px] font-medium text-stone-400 group-hover:text-stone-600 mt-1">Ajouter</span>
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Vidéo du produit</label>
                    <div 
                      onClick={() => videoInputRef.current?.click()}
                      className="aspect-video rounded-xl border-2 border-dashed border-stone-200 hover:border-stone-400 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center bg-stone-50 group mb-2"
                    >
                      {videoPreview ? (
                        <video 
                          src={videoPreview} 
                          className="w-full h-full object-cover" 
                          controls={false}
                          muted
                          playsInline
                        />
                      ) : (
                        <>
                          <Upload size={24} className="text-stone-300 group-hover:text-stone-500 transition-colors mb-1" />
                          <span className="text-[10px] font-medium text-stone-400 group-hover:text-stone-600">Uploader une vidéo</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={handleVideoChange}
                      accept="video/*"
                      className="hidden"
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest italic">Ou Lien Vidéo (URL)</label>
                      <input
                        type="url"
                        value={formData.video_url}
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none text-xs"
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-stone-700">Produit actif</label>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {imageFiles.length > 0 || videoFile ? 'Upload des médias...' : 'Enregistrement...'}
                    </>
                  ) : (
                    editingProduct ? 'Mettre à jour' : 'Créer le produit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {productToDelete && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-serif font-medium text-stone-900">Supprimer le produit ?</h3>
              <p className="text-stone-500">
                Êtes-vous sûr de vouloir supprimer <span className="font-medium text-stone-900">"{productToDelete.name}"</span> ? 
                Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 px-6 py-3 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(productToDelete.id)}
                className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
