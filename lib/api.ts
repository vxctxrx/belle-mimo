import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  text: string;
  rating: number;
}

export const api = {
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) return [];
    return data || [];
  },
  
  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const id = crypto.randomUUID();
    const newProduct = { ...product, id };
    const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
    if (error) throw error;
    return data;
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  getPrints: async (): Promise<PrintOption[]> => {
    const { data, error } = await supabase.from('prints').select('*');
    if (error) return [];
    return data || [];
  },

  getSiteImages: async (): Promise<SiteImage[]> => {
    const { data, error } = await supabase.from('siteImages').select('*');
    if (error) return [];
    return data || [];
  },

  updateSiteImage: async (id: string, siteImage: Partial<SiteImage>): Promise<SiteImage> => {
    const { data, error } = await supabase.from('siteImages').update(siteImage).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  getSiteTexts: async (): Promise<SiteText[]> => {
    const { data, error } = await supabase.from('siteTexts').select('*');
    if (error) return [];
    return data || [];
  },

  updateSiteText: async (id: string, text: string): Promise<SiteText> => {
    const { data, error } = await supabase.from('siteTexts').update({ text }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  getTestimonials: async (): Promise<Testimonial[]> => {
    const { data, error } = await supabase.from('testimonials').select('*').order('rating', { ascending: false });
    if (error) return [];
    return data || [];
  },

  createTestimonial: async (testimonial: Omit<Testimonial, 'id'>): Promise<Testimonial> => {
    const { data, error } = await supabase.from('testimonials').insert([testimonial]).select().single();
    if (error) throw error;
    return data;
  },

  updateTestimonial: async (id: string, testimonial: Partial<Testimonial>): Promise<Testimonial> => {
    const { data, error } = await supabase.from('testimonials').update(testimonial).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  deleteTestimonial: async (id: string): Promise<void> => {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw error;
  }
};
