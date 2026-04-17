const API_URL = 'http://localhost:3001';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  allowCaricature?: boolean;
}

export interface PrintOption {
  id: string;
  name: string;
  image: string;
}

export interface SiteImage {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
}

export interface SiteText {
  id: string;
  text: string;
}

export const api = {
  getProducts: async (): Promise<Product[]> => {
    try {
      const res = await fetch(`${API_URL}/products`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  
  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return res.json();
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return res.json();
  },

  deleteProduct: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
    });
  },

  getPrints: async (): Promise<PrintOption[]> => {
    const res = await fetch(`${API_URL}/prints`);
    return res.json();
  },

  getSiteImages: async (): Promise<SiteImage[]> => {
    try {
      const res = await fetch(`${API_URL}/siteImages`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  updateSiteImage: async (id: string, siteImage: Partial<SiteImage>): Promise<SiteImage> => {
    const res = await fetch(`${API_URL}/siteImages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteImage),
    });
    return res.json();
  },

  getSiteTexts: async (): Promise<SiteText[]> => {
    try {
      const res = await fetch(`${API_URL}/siteTexts`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  updateSiteText: async (id: string, text: string): Promise<SiteText> => {
    const res = await fetch(`${API_URL}/siteTexts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  }
};
