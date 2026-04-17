import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Sparkles, Check, Image as ImageIcon, Upload, Loader2, LayoutDashboard, Image as ImageIconSolid } from 'lucide-react';
import { api, Product, SiteImage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const convertToWebp = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Increased for banners
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No context');
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.onerror = () => reject('Erro ao carregar imagem');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject('Erro ao ler arquivo');
    reader.readAsDataURL(file);
  });
};

interface AdminDashboardProps {
  products: Product[];
  onProductsUpdate: (products: Product[]) => void;
  siteImages: SiteImage[];
  onSiteImagesUpdate: (images: SiteImage[]) => void;
  activeTab: 'products'|'images';
  onTabChange?: (tab: 'products'|'images') => void;
}

export const AdminDashboard = ({ products, onProductsUpdate, siteImages, onSiteImagesUpdate, activeTab, onTabChange }: AdminDashboardProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // States for products
  const [currentEdit, setCurrentEdit] = useState<Partial<Product> | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // States for site images
  const [currentImageEdit, setCurrentImageEdit] = useState<Partial<SiteImage> | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  React.useEffect(() => {
    // Reset edit states when switching tabs
    setEditingId(null);
    setIsAddingNew(false);
    setCurrentEdit(null);
    setCurrentImageEdit(null);
  }, [activeTab]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const base64Webp = await convertToWebp(file);
      if (activeTab === 'products' && currentEdit) {
        setCurrentEdit({ ...currentEdit, image: base64Webp });
      } else if (activeTab === 'images' && currentImageEdit) {
        setCurrentImageEdit({ ...currentImageEdit, image: base64Webp });
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao processar imagem.');
    }
    setIsUploadingImage(false);
  };

  // --- Product Handlers ---
  const handleEditProduct = (product: Product) => {
    setEditingId(product.id);
    setCurrentEdit(product);
    setIsAddingNew(false);
  };

  const handleAddNewProduct = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setCurrentEdit({
      name: '', price: 0, image: '', category: '', description: '', allowCaricature: false
    });
  };

  const handleSaveProduct = async (id?: string) => {
    if (!currentEdit) return;
    setIsLoading(true);
    try {
      if (id) await api.updateProduct(id, currentEdit);
      else await api.createProduct(currentEdit as Omit<Product, 'id'>);
      const updated = await api.getProducts();
      onProductsUpdate(updated);
      setEditingId(null);
      setIsAddingNew(false);
      setCurrentEdit(null);
    } catch (e) {
      alert('Erro ao salvar produto.');
    }
    setIsLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Deseja excluir este produto?')) {
      setIsLoading(true);
      try {
        await api.deleteProduct(id);
        const updated = await api.getProducts();
        onProductsUpdate(updated);
      } catch (e) { alert('Erro ao excluir produto.'); }
      setIsLoading(false);
    }
  };

  // --- Site Image Handlers ---
  const handleEditImage = (img: SiteImage) => {
    setEditingId(img.id);
    setCurrentImageEdit(img);
  };

  const handleSaveImage = async (id: string) => {
    if (!currentImageEdit) return;
    setIsLoading(true);
    try {
      await api.updateSiteImage(id, currentImageEdit);
      const updated = await api.getSiteImages();
      onSiteImagesUpdate(updated);
      setEditingId(null);
      setCurrentImageEdit(null);
    } catch (e) {
      alert('Erro ao salvar imagem.');
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setCurrentEdit(null);
    setCurrentImageEdit(null);
  };

  return (
    <div className="p-6 lg:p-12 min-h-screen bg-muted/20">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie o seu negócio e a aparência visual da loja</p>
          </div>
          <div className="flex gap-4">
            {activeTab === 'products' && (
              <Button onClick={handleAddNewProduct} disabled={isAddingNew || editingId !== null} className="rounded-full bg-primary font-bold shadow-lg h-12 px-6">
                <Plus className="w-5 h-5 mr-2" /> NOVO PRODUTO
              </Button>
            )}
          </div>
        </div>

        {/* --- Tabela de Produtos --- */}
        {activeTab === 'products' && (
        <div className="bg-white rounded-3xl shadow-xl border-4 border-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-5 px-8">Produto</th>
                  <th className="p-5">Categoria</th>
                  <th className="p-5">Preço</th>
                  <th className="p-5 text-center">Personalizável</th>
                  <th className="p-5 text-right px-8">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isAddingNew && currentEdit && (
                  <>
                    <tr className="bg-primary/5 border-b border-primary/10 transition-colors align-top">
                      <td className="p-5 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center border-2 border-white shadow-sm relative group">
                            {currentEdit.image ? <img src={currentEdit.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground/30" />}
                            {isUploadingImage && <div className="absolute inset-0 bg-white/50 flex flex-col items-center justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>}
                          </div>
                          <div className="space-y-2 w-full max-w-[200px]">
                            <div className="flex items-center gap-2">
                              <Input value={currentEdit.image || ''} onChange={e => setCurrentEdit({...currentEdit, image: e.target.value})} placeholder="URL Imagem" className="h-8 text-xs bg-white" />
                              <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-md transition-colors shrink-0" title="Subir Foto do PC">
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <Upload className="w-4 h-4" />
                              </label>
                            </div>
                            <Input value={currentEdit.name || ''} onChange={e => setCurrentEdit({...currentEdit, name: e.target.value})} placeholder="Nome" className="h-8 font-bold bg-white" />
                          </div>
                        </div>
                      </td>
                      <td className="p-5 align-middle">
                        <Input value={currentEdit.category || ''} onChange={e => setCurrentEdit({...currentEdit, category: e.target.value})} placeholder="Ex: Ecobags" className="h-8 max-w-[140px] text-xs bg-white uppercase" />
                      </td>
                      <td className="p-5 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-bold">R$</span>
                          <Input type="number" step="0.01" value={currentEdit.price || ''} onChange={e => setCurrentEdit({...currentEdit, price: parseFloat(e.target.value)})} placeholder="0.00" className="h-8 w-24 bg-white font-black text-primary" />
                        </div>
                      </td>
                      <td className="p-5 align-middle text-center">
                        <input type="checkbox" checked={currentEdit.allowCaricature || false} onChange={e => setCurrentEdit({...currentEdit, allowCaricature: e.target.checked})} className="w-5 h-5 accent-accent" />
                      </td>
                      <td className="p-5 px-8 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isLoading} className="hover:bg-red-50 hover:text-red-500 rounded-xl"><X className="w-5 h-5"/></Button>
                          <Button size="icon" className="bg-primary text-primary-foreground shadow flex-shrink-0 rounded-xl" onClick={() => handleSaveProduct()} disabled={isLoading}><Check className="w-5 h-5"/></Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-primary/5 border-b-2 border-primary/20">
                      <td colSpan={5} className="p-0 px-8 pb-5">
                        <div className="pl-20 mt-[-10px]">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Descrição do Produto</label>
                            <textarea value={currentEdit.description || ''} onChange={e => setCurrentEdit({...currentEdit, description: e.target.value})} placeholder="Detalhes do mimo..." className="w-full h-16 rounded-xl border border-border bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                        </div>
                      </td>
                    </tr>
                  </>
                )}

                {products.map(p => {
                  const isEdit = editingId === p.id;
                  const data = isEdit && currentEdit ? currentEdit : p;

                  return (
                    <React.Fragment key={p.id}>
                      <tr className={`border-b border-muted transition-colors align-top ${isEdit ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                        <td className="p-5 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center border-2 border-white shadow-sm relative group">
                              {data.image ? <img src={data.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 m-3 text-muted-foreground/30" />}
                              {isEdit && isUploadingImage && <div className="absolute inset-0 bg-white/50 flex flex-col items-center justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>}
                            </div>
                            
                            {isEdit ? (
                              <div className="space-y-2 w-full max-w-[200px]">
                                <div className="flex items-center gap-2">
                                  <Input value={data.image || ''} onChange={e => setCurrentEdit({...data, image: e.target.value})} placeholder="URL Imagem" className="h-8 text-xs bg-white" />
                                  <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-md transition-colors shrink-0" title="Subir Foto do PC">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    <Upload className="w-4 h-4" />
                                  </label>
                                </div>
                                <Input value={data.name || ''} onChange={e => setCurrentEdit({...data, name: e.target.value})} placeholder="Nome" className="h-8 font-bold bg-white" />
                              </div>
                            ) : (
                              <div className="font-bold">{p.name}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-5 align-middle">
                          {isEdit ? (
                            <Input value={data.category || ''} onChange={e => setCurrentEdit({...data, category: e.target.value})} placeholder="Categoria" className="h-8 max-w-[140px] text-xs uppercase bg-white" />
                          ) : (
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black bg-muted px-3 py-1 rounded-full">{p.category}</span>
                          )}
                        </td>
                        <td className="p-5 align-middle">
                          {isEdit ? (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground font-bold">R$</span>
                              <Input type="number" step="0.01" value={data.price || ''} onChange={e => setCurrentEdit({...data, price: parseFloat(e.target.value)})} placeholder="0.00" className="h-8 w-24 font-black text-primary bg-white" />
                            </div>
                          ) : (
                            <span className="font-black text-primary">R$ {Number(p.price).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-5 align-middle text-center">
                          {isEdit ? (
                            <input type="checkbox" checked={data.allowCaricature || false} onChange={e => setCurrentEdit({...data, allowCaricature: e.target.checked})} className="w-5 h-5 accent-accent" />
                          ) : (
                            p.allowCaricature ? <div className="bg-accent/10 w-8 h-8 rounded-full flex items-center justify-center mx-auto"><Sparkles className="w-4 h-4 text-accent"/></div> : <span className="text-muted-foreground font-black opacity-30">-</span>
                          )}
                        </td>
                        <td className="p-5 px-8 align-middle text-right">
                          {isEdit ? (
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isLoading} className="hover:bg-red-50 hover:text-red-500 rounded-xl"><X className="w-5 h-5"/></Button>
                              <Button size="icon" className="bg-primary text-primary-foreground shadow rounded-xl" onClick={() => handleSaveProduct(p.id)} disabled={isLoading}><Check className="w-5 h-5"/></Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                              <Button size="icon" variant="ghost" className="hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => handleEditProduct(p)} disabled={isAddingNew || editingId !== null}><Pencil className="w-4 h-4"/></Button>
                              <Button size="icon" variant="ghost" className="hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleDeleteProduct(p.id)} disabled={isAddingNew || editingId !== null}><Trash2 className="w-4 h-4"/></Button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {isEdit && (
                        <tr className="bg-primary/5 border-b-2 border-primary/20">
                          <td colSpan={5} className="p-0 px-8 pb-5">
                            <div className="pl-20 mt-[-10px]">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Descrição do Produto</label>
                                <textarea value={data.description || ''} onChange={e => setCurrentEdit({...data, description: e.target.value})} className="w-full h-16 rounded-xl border border-border bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* --- Tabela de Imagens --- */}
        {activeTab === 'images' && (
        <div className="bg-white rounded-3xl shadow-xl border-4 border-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-5 px-8">Localização Interna</th>
                  <th className="p-5">Imagem Atual</th>
                  <th className="p-5">Categoria</th>
                  <th className="p-5 text-right px-8">Ação</th>
                </tr>
              </thead>
              <tbody>
                {siteImages.map(img => {
                  const isEdit = editingId === img.id;
                  const data = isEdit && currentImageEdit ? currentImageEdit : img;

                  return (
                    <tr key={img.id} className={`border-b border-muted transition-colors align-top ${isEdit ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                      <td className="p-5 px-8 align-middle">
                        <div className="font-bold mb-1">{data.name}</div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{data.description}</p>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className={`rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center border-2 border-white shadow-sm relative ${data.id === 'hero_bg' ? 'w-32 h-20' : 'w-20 h-20'}`}>
                            {data.image ? <img src={data.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 m-3 text-muted-foreground/30" />}
                            {isEdit && isUploadingImage && <div className="absolute inset-0 bg-white/50 flex flex-col items-center justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>}
                          </div>
                          {isEdit && (
                            <div className="space-y-2 w-full max-w-[200px]">
                              <div className="flex items-center gap-2">
                                <Input value={data.image || ''} onChange={e => setCurrentImageEdit({...data, image: e.target.value})} placeholder="URL Imagem" className="h-8 text-xs bg-white" />
                                <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-md transition-colors shrink-0" title="Subir Nova Foto">
                                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                  <Upload className="w-4 h-4" />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-5 align-middle">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black bg-muted px-3 py-1 rounded-full">{data.category}</span>
                      </td>
                      <td className="p-5 px-8 align-middle text-right group">
                        {isEdit ? (
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isLoading} className="hover:bg-red-50 hover:text-red-500 rounded-xl"><X className="w-5 h-5"/></Button>
                            <Button size="icon" className="bg-primary text-primary-foreground shadow rounded-xl" onClick={() => handleSaveImage(img.id)} disabled={isLoading}><Check className="w-5 h-5"/></Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                            <Button size="icon" variant="ghost" className="hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => handleEditImage(img)} disabled={isAddingNew || editingId !== null}><Pencil className="w-4 h-4"/></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
