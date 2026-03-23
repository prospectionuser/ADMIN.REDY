export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  gallery_urls?: string[];
  video_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  wilaya?: string;
  product_id: string;
  status: 'Nouveau' | 'En préparation' | 'Expédié' | 'Livré' | 'Annulé';
  total_price: number;
  quantity?: number;
  created_at: string;
  product?: Product;
}

export interface SiteSetting {
  key: string;
  value: string;
}

export type View = 'dashboard' | 'products' | 'orders' | 'settings';
