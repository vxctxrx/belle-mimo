/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShoppingBag, 
  User, 
  ChevronRight, 
  Star, 
  Instagram, 
  Facebook, 
  Twitter,
  MessageCircle,
  Heart,
  ArrowRight,
  Plus,
  Minus,
  Truck,
  CreditCard,
  QrCode,
  FileText,
  CheckCircle2,
  Copy,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  LogOut,
  X,
  Settings
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { api, supabase, Product, PrintOption, SiteImage, SiteText, Testimonial } from '@/lib/api';
import { AdminDashboard } from '@/components/AdminDashboard';

interface CartItem extends Product {
  quantity: number;
  selectedPrint?: PrintOption;
  caricaturePhoto?: string;
}

interface UserData {
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  cep: string;
  address: string;
  isAdmin?: boolean;
}

// --- Mock Data ---

const MOCK_PRINTS: PrintOption[] = [
  { id: 'p1', name: 'Floral Delicado', image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=200&q=80' },
  { id: 'p2', name: 'Geométrico Moderno', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=200&q=80' },
  { id: 'p3', name: 'Poás Clássico', image: 'https://images.unsplash.com/photo-1554188248-986adbb73be4?auto=format&fit=crop&w=200&q=80' },
  { id: 'p4', name: 'Tropical Summer', image: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=200&q=80' },
];

// --- AI Initialization ---
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

// --- Components ---

const Logo = ({ onClick }: { onClick?: () => void }) => {
  return (
    <div className="flex items-center select-none cursor-pointer group h-14" onClick={onClick}>
      <img src="/logo.png" alt="Belle Mimo Logo" className="h-full w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform" />
    </div>
  );
};

const EditableText = ({ 
  id, 
  fallback, 
  siteTexts, 
  isEditMode, 
  className, 
  tag: Tag = "span" 
}: { 
  id: string, 
  fallback: string, 
  siteTexts?: SiteText[], 
  isEditMode: boolean, 
  className?: string, 
  tag?: keyof JSX.IntrinsicElements 
}) => {
  const [text, setText] = React.useState(fallback);
  
  React.useEffect(() => {
    const found = siteTexts?.find(t => t.id === id);
    if (found) setText(found.text);
  }, [siteTexts, id, fallback]);

  const handleBlur = async (e: React.FocusEvent<HTMLElement>) => {
    const newText = e.currentTarget.innerHTML || '';
    if (newText !== text) {
      setText(newText);
      try {
        await api.updateSiteText(id, newText);
      } catch (err) {
        console.error("Failed to update site text", err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <Tag 
      className={`${className || ''} ${isEditMode ? 'outline-dashed outline-2 outline-primary/50 cursor-text hover:outline-primary transition-all rounded-sm ui-editable' : ''}`}
      contentEditable={isEditMode}
      suppressContentEditableWarning={true}
      onBlur={isEditMode ? handleBlur : undefined}
      onKeyDown={isEditMode ? handleKeyDown : undefined}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};

const ART_STYLES = [
  { 
    id: 'caricature', 
    name: 'Caricatura', 
    preview: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=400&q=80',
    prompt: 'Transforme esta foto em uma caricatura artística, colorida e divertida. Estilo cartoon, traços marcantes e expressivos, mantendo as características principais da pessoa, mas de forma exagerada e amigável. O fundo deve ser removido ou simplificado.' 
  },
  { 
    id: 'watercolor', 
    name: 'Aquarela', 
    preview: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=400&q=80',
    prompt: 'Transforme esta foto em uma pintura de aquarela suave e artística, com manchas de tinta, transparências e cores vibrantes. Estilo artístico e fluido.' 
  },
  { 
    id: 'oil', 
    name: 'Pintura a Óleo', 
    preview: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=400&q=80',
    prompt: 'Transforme esta foto em uma pintura a óleo clássica, com texturas de pinceladas visíveis, cores ricas e profundas. Estilo renascentista moderno.' 
  },
  { 
    id: 'sketch', 
    name: 'Esboço a Lápis', 
    preview: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=400&q=80',
    prompt: 'Transforme esta foto em um esboço detalhado feito a lápis de grafite, com hachuras, sombreamento artístico e traços finos. Estilo desenho à mão.' 
  },
  { 
    id: 'popart', 
    name: 'Pop Art', 
    preview: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=400&q=80',
    prompt: 'Transforme esta foto em uma arte no estilo Pop Art clássico, com cores contrastantes, vibrantes, contornos pretos fortes e estilo quadrinhos retrô.' 
  },
  { 
    id: 'anime', 
    name: 'Anime', 
    preview: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?auto=format&fit=crop&w=400&q=80',
    prompt: 'Transforme esta foto em um personagem de anime japonês de alta qualidade, mantendo as características físicas mas adaptando para o estilo de animação moderna.' 
  }
];

const ArtStudio = ({ 
  onApprove,
  onClose,
  siteTexts,
  isEditMode
}: { 
  onApprove: (art: string) => void;
  onClose: () => void;
  siteTexts: SiteText[];
  isEditMode: boolean;
}) => {
  const [originalPhoto, setOriginalPhoto] = React.useState<string | undefined>(undefined);
  const [generatedArt, setGeneratedArt] = React.useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [selectedStyle, setSelectedStyle] = React.useState(ART_STYLES[0]);
  const [previewStyle, setPreviewStyle] = React.useState<typeof ART_STYLES[0] | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalPhoto(reader.result as string);
        setGeneratedArt(undefined);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateArt = async () => {
    if (!originalPhoto) return;
    setIsGenerating(true);
    try {
      const base64Data = originalPhoto.split(',')[1];
      const mimeType = originalPhoto.split(';')[0].split(':')[1];

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: selectedStyle.prompt,
            },
          ],
        },
      });

      const candidate = result.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            setGeneratedArt(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            return;
          }
        }
      }
    } catch (error: any) {
      console.error("Erro ao gerar arte:", error);
      alert(`Ops! Não foi possível gerar a imagem.\n\nMotivo comum: A geração de imagens (Imagen 3/4) atualmente requer uma conta com faturamento ativo no Google AI Studio (Plano Pago).\n\nDetalhe técnico: ${error.message || error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-white p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Side: Preview */}
          <div className="flex-1 space-y-6">
            <div className="aspect-square bg-muted rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl relative group">
              {generatedArt ? (
                <img src={generatedArt} className="w-full h-full object-cover" />
              ) : originalPhoto ? (
                <div className="relative w-full h-full">
                  <img src={originalPhoto} className="w-full h-full object-cover opacity-50 grayscale" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xl font-bold text-primary bg-white/80 px-8 py-4 rounded-full backdrop-blur-sm">
                      Pronto para transformar ✨
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                  <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                    <ImageIcon className="w-16 h-16 text-primary/40" />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground mb-2">Seu Estúdio de Arte</h3>
                  <p className="max-w-xs text-lg">Suba uma foto e escolha um estilo para começar a mágica.</p>
                </div>
              )}
              
              {isGenerating && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-20">
                  <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                  <p className="text-2xl font-black text-primary animate-pulse tracking-tighter">CRIANDO SUA OBRA DE ARTE...</p>
                </div>
              )}
            </div>

            {generatedArt && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <Button 
                  onClick={() => onApprove(generatedArt)}
                  className="h-20 rounded-full bg-green-500 hover:bg-green-600 text-white px-16 text-2xl font-black shadow-xl shadow-green-200 flex items-center gap-4 group"
                >
                  <CheckCircle2 className="w-8 h-8 group-hover:scale-125 transition-transform" />
                  APROVAR E USAR NOS MIMOS
                </Button>
              </motion.div>
            )}
          </div>

          {/* Right Side: Controls */}
          <div className="w-full lg:w-[400px] space-y-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <EditableText id="studio_title" fallback="ESTÚDIO BELLE MIMO" siteTexts={siteTexts} isEditMode={isEditMode} tag="h2" className="text-3xl font-black tracking-tighter uppercase" />
                <Badge className="bg-accent text-accent-foreground shrink-0">IA GENERATIVA ✨</Badge>
              </div>
              <EditableText id="studio_subtitle" fallback="Transforme suas fotos favoritas em artes exclusivas para seus produtos." siteTexts={siteTexts} isEditMode={isEditMode} tag="p" className="text-muted-foreground font-medium" />
            </div>

            {/* Step 1: Upload */}
            <div className="space-y-4">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-primary/60">Opção 1: Sua Foto</span>
              <input
                type="file"
                id="studio-upload"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              <label
                htmlFor="studio-upload"
                className={`flex flex-col items-center justify-center w-full h-40 border-4 border-dashed rounded-[2rem] cursor-pointer transition-all ${
                  originalPhoto ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                {originalPhoto ? (
                  <div className="flex items-center gap-6 px-8">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md">
                      <img src={originalPhoto} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-primary">Foto Carregada!</p>
                      <p className="text-sm text-muted-foreground">Clique para trocar a foto</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-primary mb-3" />
                    <p className="text-xl font-bold">Escolher Foto</p>
                    <p className="text-sm text-muted-foreground">JPG, PNG ou WebP</p>
                  </>
                )}
              </label>
            </div>

            {/* Step 2: Styles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-primary/60">Opção 2: Escolha o Estilo</span>
                <span className="text-[10px] font-bold text-accent uppercase animate-pulse">Clique para ver exemplo ✨</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ART_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedStyle(style);
                      setGeneratedArt(undefined);
                      setPreviewStyle(style);
                    }}
                    className={`p-3 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${
                      selectedStyle.id === style.id 
                        ? 'border-primary bg-primary text-white shadow-lg scale-105' 
                        : 'border-muted hover:border-primary/30 text-muted-foreground bg-white'
                    }`}
                  >
                    <div className={`w-full aspect-video rounded-xl overflow-hidden border-4 shadow-md transition-transform ${
                      selectedStyle.id === style.id ? 'border-white scale-105' : 'border-muted'
                    }`}>
                      <img 
                        src={style.preview} 
                        alt={style.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-base font-black tracking-tighter uppercase">{style.name}</span>
                  </button>
                ))}
              </div>
              
              <motion.div 
                key={selectedStyle.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-primary/5 rounded-2xl border border-primary/10"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-10 rounded-lg overflow-hidden border-2 border-primary/20">
                    <img src={selectedStyle.preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <p className="text-sm font-black text-primary uppercase tracking-widest">{selectedStyle.name}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{selectedStyle.prompt.split('.')[0]}."
                </p>
              </motion.div>
            </div>

            {/* Opção 3: Action */}
            <div className="space-y-4">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-primary/60">Opção 3: Criar Arte</span>
              <Button 
                disabled={!originalPhoto || isGenerating}
                onClick={generateArt}
                className="w-full h-20 rounded-[2rem] bg-primary hover:bg-primary/90 text-xl font-black shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    PROCESSANDO...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    GERAR ARTE AGORA
                  </>
                )}
              </Button>
            </div>

            <div className="p-6 bg-muted/50 rounded-3xl border border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                * A arte gerada é única e exclusiva. Após aprovar, você poderá selecioná-la em qualquer produto que permita personalização.
              </p>
            </div>

            {/* Style Preview Popup */}
            <AnimatePresence>
              {previewStyle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[3rem] overflow-hidden max-w-lg w-full shadow-2xl relative"
                  >
                    <button 
                      onClick={() => setPreviewStyle(null)}
                      className="absolute top-6 right-6 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-white transition-colors"
                    >
                      <X className="w-6 h-6 text-primary" />
                    </button>

                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={previewStyle.preview} 
                        alt={previewStyle.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="p-10 space-y-6">
                      <div className="space-y-2">
                        <Badge className="bg-primary/10 text-primary border-none text-xs font-black uppercase tracking-widest">Estilo Selecionado</Badge>
                        <h3 className="text-4xl font-black tracking-tighter text-primary uppercase">{previewStyle.name}</h3>
                      </div>
                      
                      <p className="text-lg text-muted-foreground leading-relaxed italic border-l-4 border-primary/20 pl-6">
                        "{previewStyle.prompt.split('.')[0]}."
                      </p>

                      <Button 
                        onClick={() => setPreviewStyle(null)}
                        className="w-full h-16 rounded-full bg-primary text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                      >
                        ENTENDI, VAMOS CRIAR!
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudioHighlight = ({ onGoToStudio, siteImages, siteTexts, isEditMode, isAdmin }: { onGoToStudio: () => void, siteImages: SiteImage[], siteTexts: SiteText[], isEditMode: boolean, isAdmin?: boolean }) => {
  const images = siteImages.filter(i => i.category === 'Estúdio');
  const demo1 = images.find(i => i.id === 'studio_demo1')?.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80';
  const img1 = images.find(i => i.id === 'studio_demo2')?.image || 'https://picsum.photos/seed/art1/400/400';
  const img2 = images.find(i => i.id === 'studio_demo3')?.image || 'https://picsum.photos/seed/art2/400/400';
  const img3 = images.find(i => i.id === 'studio_demo4')?.image || 'https://picsum.photos/seed/art3/400/400';

  return (
  <section className="py-24 px-6 lg:px-12 bg-accent/5 relative overflow-hidden">
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <Badge className="bg-accent text-accent-foreground px-6 py-2 rounded-full font-bold">TECNOLOGIA ✨</Badge>
          <EditableText 
            id="studio_title" 
            fallback="Transforme suas <br /> <span class='text-primary italic'>Fotos em Arte</span>" 
            siteTexts={siteTexts} 
            isEditMode={isEditMode} 
            tag="h2" 
            className="text-5xl lg:text-7xl font-black tracking-tighter leading-none" 
          />
          <EditableText 
            id="studio_desc" 
            fallback="Nosso estúdio exclusivo usa Inteligência Artificial para criar caricaturas, aquarelas e pinturas a partir das suas fotos. Personalize seus mimos com artes únicas que ninguém mais tem!" 
            siteTexts={siteTexts} 
            isEditMode={isEditMode} 
            tag="p" 
            className="text-xl text-muted-foreground max-w-xl font-medium leading-relaxed" 
          />
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-border">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold">6 Estilos Artísticos</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-border">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold">Aprovação Instantânea</span>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={onGoToStudio}
              className="h-16 rounded-full bg-primary hover:bg-primary/90 px-12 text-lg font-bold shadow-xl shadow-primary/20 group"
            >
              <EditableText id="btn_studio" fallback="EXPERIMENTAR O ESTÚDIO" siteTexts={siteTexts} isEditMode={isEditMode} tag="span" />
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Button>
          )}
        </div>
        <div className="flex-1 relative">
          <div className="grid grid-cols-2 gap-4 relative">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="aspect-square rounded-3xl overflow-hidden shadow-xl border-4 border-white relative"
            >
              <Badge className="absolute top-4 left-4 z-10 bg-white/90 text-primary border-none shadow-md backdrop-blur-sm px-3 py-1 font-black text-xs tracking-widest uppercase">Antes</Badge>
              <img src={demo1} className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="aspect-square rounded-3xl overflow-hidden shadow-xl border-4 border-white mt-8 relative"
            >
              <Badge className="absolute top-4 left-4 z-10 bg-white/90 text-primary border-none shadow-md backdrop-blur-sm px-3 py-1 font-black text-xs tracking-widest uppercase">Antes</Badge>
              <img src={img1} className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="aspect-square rounded-3xl overflow-hidden shadow-xl border-4 border-white -mt-8 relative"
            >
              <Badge className="absolute top-4 left-4 z-10 bg-accent text-accent-foreground border-none shadow-md backdrop-blur-sm px-3 py-1 font-black text-xs tracking-widest uppercase">Depois ✨</Badge>
              <img src={img2} className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="aspect-square rounded-3xl overflow-hidden shadow-xl border-4 border-white relative"
            >
              <Badge className="absolute top-4 left-4 z-10 bg-accent text-accent-foreground border-none shadow-md backdrop-blur-sm px-3 py-1 font-black text-xs tracking-widest uppercase">Depois ✨</Badge>
              <img src={img3} className="w-full h-full object-cover" />
            </motion.div>
          </div>
          {/* Decorative Sparkles */}
          <Sparkles className="absolute -top-8 -right-8 w-16 h-16 text-accent animate-pulse" />
          <Sparkles className="absolute -bottom-8 -left-8 w-12 h-12 text-primary animate-pulse delay-700" />
        </div>
      </div>
    </div>
  </section>
);
};

const AboutUs = ({ siteImages, siteTexts, isEditMode }: { siteImages: SiteImage[], siteTexts: SiteText[], isEditMode: boolean }) => {
  const images = siteImages.filter(i => i.category === 'Quem Somos');
  const img1 = images.find(i => i.id === 'about_img1')?.image || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80';
  const img2 = images.find(i => i.id === 'about_img2')?.image || 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80';
  const img3 = images.find(i => i.id === 'about_img3')?.image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80';
  const img4 = images.find(i => i.id === 'about_img4')?.image || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80';

  return (
  <section className="py-24 px-6 lg:px-12 bg-white relative overflow-hidden">
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
        <div className="flex-1 space-y-8">
          <EditableText 
            id="about_title" 
            fallback="Quem <br /> <span class='text-secondary italic'>Somos</span>" 
            siteTexts={siteTexts} 
            isEditMode={isEditMode} 
            tag="h2" 
            className="text-5xl lg:text-7xl font-black tracking-tighter leading-none text-foreground" 
          />
          <EditableText 
            id="about_desc" 
            fallback="A Belle Mimo nasceu com um propósito simples: transformar suas memórias mais queridas em produtos físicos cheios de amor. Nossa paixão pela arte e pelo design nos guia para criar peças únicas, utilizando a tecnologia aliada a um cuidado artesanal que você pode sentir em cada detalhe." 
            siteTexts={siteTexts} 
            isEditMode={isEditMode} 
            tag="p" 
            className="text-xl text-muted-foreground max-w-xl font-medium leading-relaxed" 
          />
        </div>
        <div className="flex-1 relative w-full">
          <div className="grid grid-cols-2 gap-4 relative">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="aspect-square rounded-3xl overflow-hidden shadow-xl border-4 border-white relative"
            >
              <img src={img1} className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="aspect-square rounded-3xl overflow-hidden shadow-xl border-4 border-white mt-8 relative"
            >
              <img src={img2} className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="aspect-square rounded-3xl overflow-hidden shadow-xl border-4 border-white -mt-8 relative"
            >
              <img src={img3} className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="aspect-square rounded-3xl overflow-hidden shadow-xl border-4 border-white relative"
            >
              <img src={img4} className="w-full h-full object-cover" />
            </motion.div>
          </div>
          {/* Decorative Sparkles */}
          <Sparkles className="absolute -top-8 -left-8 w-16 h-16 text-secondary animate-pulse" />
          <Sparkles className="absolute -bottom-8 -right-8 w-12 h-12 text-primary animate-pulse delay-700" />
        </div>
      </div>
    </div>
  </section>
  );
};

const Navbar = ({ 
  onUserClick, 
  onCartClick, 
  cartCount,
  onCategoryClick,
  activeView,
  onViewChange,
  user,
  onLogout,
  siteImages,
  isVisualEditMode,
  setIsVisualEditMode,
  onAdminTabChange
}: { 
  onUserClick: () => void; 
  onCartClick: () => void; 
  cartCount: number;
  onCategoryClick: (category: string) => void;
  activeView: 'home' | 'studio' | 'admin';
  onViewChange: (view: 'home' | 'studio' | 'admin') => void;
  user: UserData | null;
  onLogout: () => void;
  siteImages: SiteImage[];
  isVisualEditMode: boolean;
  setIsVisualEditMode: (val: boolean) => void;
  onAdminTabChange: (tab: 'products'|'images'|'reviews') => void;
}) => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-border px-6 lg:px-12 h-24 flex items-center justify-between">
      <Logo onClick={() => {
        onViewChange('home');
        onCategoryClick('TODOS');
      }} />
      
      <div className="hidden md:flex items-center gap-10 text-sm font-black tracking-widest">
        <button 
          onClick={() => onViewChange('home')}
          className={`transition-all hover:scale-110 active:scale-95 uppercase ${activeView === 'home' ? 'text-primary' : 'hover:text-secondary'}`}
        >
          HOME
        </button>
        {user?.isAdmin && (
          <button 
            onClick={() => onViewChange('studio')}
            className={`transition-all hover:scale-110 active:scale-95 uppercase flex items-center gap-2 ${activeView === 'studio' ? 'text-primary' : 'hover:text-secondary'}`}
          >
            ESTÚDIO <Sparkles className="w-4 h-4" />
          </button>
        )}
        {['ECOBAGS', 'ALMOFADAS', 'AVENTAIS', 'NECESSAIRES'].map((item) => (
          <button 
            key={item} 
            onClick={() => {
              onViewChange('home');
              onCategoryClick(item);
            }}
            className="hover:text-secondary transition-all hover:scale-110 active:scale-95 uppercase"
          >
            {item}
          </button>
        ))}
        {user?.isAdmin && (
          <div className="flex gap-2 ml-4">
            <Button 
              variant={isVisualEditMode ? 'default' : 'outline'}
              onClick={() => setIsVisualEditMode(!isVisualEditMode)}
              className={`rounded-full px-6 py-2 font-bold border-2 transition-all ${isVisualEditMode ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105' : 'bg-transparent border-primary/20 text-primary hover:bg-primary/5'}`}
            >
              {isVisualEditMode ? 'TEXTOS ON ✨' : 'EDITAR TEXTOS'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                onViewChange('admin');
                onAdminTabChange('products');
              }}
              className="rounded-full px-6 py-2 font-bold border-2 bg-transparent border-primary/20 text-primary hover:bg-primary/5"
            >
              EDITAR PRODUTOS
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                onViewChange('admin');
                onAdminTabChange('images');
              }}
              className="rounded-full px-6 py-2 font-bold border-2 bg-transparent border-primary/20 text-primary hover:bg-primary/5"
            >
              EDITAR IMAGENS
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                onViewChange('admin');
                onAdminTabChange('reviews');
              }}
              className="rounded-full px-6 py-2 font-bold border-2 bg-transparent border-primary/20 text-primary hover:bg-primary/5"
            >
              EDITAR AVALIAÇÕES
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex items-center">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden mr-2"
              >
                <Input 
                  placeholder="Pesquisar..." 
                  className="h-10 bg-white border-2 border-primary/20 rounded-full focus-visible:ring-primary"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="rounded-full hover:bg-primary/10 w-12 h-12"
          >
            <Search className="w-6 h-6" />
          </Button>
        </div>
        
        {user?.isAdmin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-primary/10 relative w-12 h-12"
            onClick={onCartClick}
          >
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-secondary text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                {cartCount}
              </span>
            )}
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden lg:block text-xs font-bold text-primary uppercase tracking-tighter">
              Olá, {user.name.split(' ')[0]}
            </span>
          )}
          <Button 
            variant="ghost" 
            className={`rounded-full hover:bg-primary/10 h-12 ${user ? 'px-4 border-2 border-primary/20 text-primary bg-primary/5' : 'w-12 px-0'}`}
            onClick={user ? onLogout : onUserClick}
          >
            {user ? (
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                <span className="font-bold text-sm">SAIR</span>
              </div>
            ) : (
              <User className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ onExploreClick, siteImages, siteTexts, isEditMode }: { onExploreClick: () => void, siteImages: SiteImage[], siteTexts: SiteText[], isEditMode: boolean }) => {
  const bgImage1 = siteImages.find(img => img.id === 'hero_bg')?.image || "https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&w=800&q=80";
  const bgImage2 = siteImages.find(img => img.id === 'hero_bg2')?.image || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80";
  const bgImage3 = siteImages.find(img => img.id === 'hero_bg3')?.image || "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=400&q=80";
  const bgImage4 = siteImages.find(img => img.id === 'hero_bg4')?.image || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80";

  return (
  <section className="relative w-full min-h-[80vh] grid grid-cols-1 lg:grid-cols-2 overflow-hidden px-6 lg:px-12 py-12 gap-12">
    {/* Floating Elements */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div 
        animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[10%] w-24 h-24 bg-accent/20 rounded-3xl" 
      />
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-[10%] w-32 h-32 bg-secondary/10 rounded-full" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" 
      />
    </div>

    {/* Left Side: Hero Image Grid */}
    <div className="relative flex items-center justify-center">
      <div className="relative w-full max-w-[650px] grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1 }}
          className="relative aspect-[5/4] bg-white p-2 rounded-[2rem] shadow-xl border-4 border-white"
        >
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
            <img src={bgImage1} alt="Coleção Belle Mimo 1" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="relative aspect-[5/4] bg-white p-2 rounded-[2rem] shadow-xl border-4 border-white mt-8"
        >
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
            <img src={bgImage2} alt="Coleção Belle Mimo 2" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative aspect-[5/4] bg-white p-2 rounded-[2rem] shadow-xl border-4 border-white -mt-8"
        >
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
            <img src={bgImage3} alt="Coleção Belle Mimo 3" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative aspect-[5/4] bg-white p-2 rounded-[2rem] shadow-xl border-4 border-white"
        >
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
            <img src={bgImage4} alt="Coleção Belle Mimo 4" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </motion.div>

        {/* Playful Badge */}
        <motion.div 
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-6 -right-6 bg-accent p-6 rounded-full shadow-lg border-4 border-white transform rotate-12 z-10 flex items-center justify-center"
        >
          <EditableText 
            id="hero_badge" 
            fallback="FEITO <br /> COM AMOR" 
            siteTexts={siteTexts} 
            isEditMode={isEditMode} 
            tag="div" 
            className="font-heading font-black tracking-wider uppercase text-accent-foreground text-center leading-tight" 
          />
        </motion.div>
      </div>
    </div>

    {/* Right Side: Content */}
    <div className="relative z-10 flex flex-col justify-center text-center lg:text-left">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <EditableText 
          id="hero_title" 
          fallback="Transformando momentos em memórias duradouras." 
          siteTexts={siteTexts} 
          isEditMode={isEditMode} 
          tag="h1" 
          className="font-heading text-5xl lg:text-7xl font-black leading-[0.9] mb-8 text-foreground tracking-tighter" 
        />
        <EditableText 
          id="hero_subtitle" 
          fallback="Descubra a arte da personalização. Cada mimo é planejado cuidadosamente com seu toque especial." 
          siteTexts={siteTexts} 
          isEditMode={isEditMode} 
          tag="p" 
          className="text-xl text-muted-foreground max-w-lg mb-12 leading-relaxed font-medium" 
        />
        {/* Button removed as requested */}
      </motion.div>
    </div>
  </section>
);
};

const ProductCard: React.FC<{ product: Product; onClick: (p: Product) => void; isAdmin?: boolean }> = ({ product, onClick, isAdmin }) => {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={() => onClick(product)}
      className="bg-white p-4 rounded-[2rem] flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(157,80,187,0.1)] transition-all duration-300 border border-border/50 group cursor-pointer"
    >
      <div className="w-full aspect-square bg-muted rounded-[1.5rem] mb-4 flex items-center justify-center overflow-hidden relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        {isAdmin && product.allowCaricature && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-accent/90 text-accent-foreground border-none font-bold shadow-md shadow-accent/20 px-2 py-1 flex items-center gap-1 backdrop-blur-sm">
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-widest hidden group-hover:inline-block transition-all">Arte IA</span>
            </Badge>
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-secondary hover:text-white shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="px-1">
        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">{product.category}</p>
        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors leading-tight tracking-tight">{product.name}</h3>
        <div className="flex items-center justify-between mt-auto">
          {isAdmin && (
            <>
              <p className="text-xl font-black text-primary">R$ {product.price.toFixed(2).replace('.', ',')}</p>
              <Button size="sm" className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-sm px-5">
                ESCOLHER
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const Testimonials = ({ 
  testimonials,
  siteTexts,
  isEditMode,
  isAdmin
}: { 
  testimonials: Testimonial[];
  siteTexts: SiteText[];
  isEditMode: boolean;
  isAdmin?: boolean;
}) => {
  if (!isAdmin && (!testimonials || testimonials.length === 0)) {
    return null;
  }

  return (
  <section className="py-24 px-6 lg:px-24">
    <div className="text-center mb-16">
      <EditableText 
        id="testimonials_title" 
        fallback="O que dizem nossos clientes" 
        siteTexts={siteTexts} 
        isEditMode={isEditMode} 
        tag="h2" 
        className="font-heading text-5xl lg:text-6xl font-black mb-4 tracking-tighter block" 
      />
      <EditableText 
        id="testimonials_subtitle" 
        fallback="Experiências reais de quem já se encantou com nossos mimos" 
        siteTexts={siteTexts} 
        isEditMode={isEditMode} 
        tag="p" 
        className="text-xl text-muted-foreground mt-4 font-medium" 
      />
    </div>

    {testimonials.length === 0 ? (
      <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-border max-w-md mx-auto">
        <EditableText 
          id="testimonials_empty" 
          fallback="o que dizem nossos clientes" 
          siteTexts={siteTexts} 
          isEditMode={isEditMode} 
          tag="p" 
          className="text-lg text-muted-foreground italic block" 
        />
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t) => (
          <Card key={t.id} className="border-none shadow-sm rounded-3xl p-8 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={t.avatar} 
                alt={t.name} 
                className="w-12 h-12 rounded-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="font-bold">{t.name}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-accent text-accent" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-muted-foreground italic">"{t.text}"</p>
          </Card>
        ))}
      </div>
    )}
  </section>
  );
};

const CollectionHighlights = ({ 
  products,
  onProductClick, 
  currentCategory,
  onCategoryChange,
  siteTexts,
  isEditMode,
  isAdmin
}: { 
  products: Product[];
  onProductClick: (p: Product) => void;
  currentCategory: string;
  onCategoryChange: (category: string) => void;
  siteTexts: SiteText[];
  isEditMode: boolean;
  isAdmin?: boolean;
}) => {
  const categories = ['TODOS', 'ECOBAGS', 'ALMOFADAS', 'AVENTAIS', 'NECESSAIRES'];
  
  const filteredProducts = currentCategory === 'TODOS' 
    ? products 
    : products.filter(p => p.category.toUpperCase() === currentCategory.toUpperCase());

  return (
    <section id="products" className="py-24 px-6 lg:px-12 scroll-mt-24 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-secondary text-secondary px-6 py-1 rounded-full font-bold uppercase tracking-widest">
            <EditableText id="col_badge" fallback="Nossas Coleções" siteTexts={siteTexts} isEditMode={isEditMode} tag="span" />
          </Badge>
          <EditableText id="col_title" fallback="Escolha seu <span className='text-secondary'>Mimo</span>" siteTexts={siteTexts} isEditMode={isEditMode} tag="h2" className="font-heading text-5xl lg:text-7xl font-black mb-8 tracking-tighter" />
          
          {/* Tabs Interface */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 border-2 ${
                  currentCategory === cat 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105' 
                    : 'bg-transparent border-muted text-muted-foreground hover:border-primary/30 hover:text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard product={product} onClick={onProductClick} isAdmin={isAdmin} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <EditableText id="col_empty" fallback="Nenhum produto encontrado nesta categoria ainda. ✨" siteTexts={siteTexts} isEditMode={isEditMode} tag="p" className="text-muted-foreground text-lg italic" />
          </div>
        )}
      </div>
    </section>
  );
};

const Footer = ({ 
  onCategoryClick, 
  onContactClick,
  siteImages,
  siteTexts,
  isEditMode
}: { 
  onCategoryClick: (cat: string) => void;
  onContactClick: () => void;
  siteImages: SiteImage[];
  siteTexts: SiteText[];
  isEditMode: boolean;
}) => {
  const [email, setEmail] = React.useState('');
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  const handleSubscribe = () => {
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-foreground text-white py-24 px-6 lg:px-12 rounded-t-[4rem]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 mb-20">
        <div className="flex flex-col gap-8">
          <Logo onClick={() => onCategoryClick('TODOS')} />
          <EditableText 
            id="footer_desc" 
            fallback="Transformando momentos em memórias através de mimos personalizados e sustentáveis." 
            siteTexts={siteTexts} 
            isEditMode={isEditMode} 
            tag="p" 
            className="text-gray-400 text-base leading-relaxed" 
          />
          <div className="flex flex-col gap-3 mt-4">
            <a 
              href="https://api.whatsapp.com/send?phone=5511947652272" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center lg:justify-start gap-4 bg-[#25D366] hover:bg-[#1da851] text-white p-5 rounded-2xl transition-all font-black w-full max-w-[320px] shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 hover:-translate-y-1 active:scale-95 text-lg"
            >
              <MessageCircle className="w-8 h-8" />
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] opacity-90 font-bold">Fale conosco pelo</span>
                <span className="text-xl">WhatsApp</span>
              </div>
            </a>
            <a 
              href="https://instagram.com/lojabellemimo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center lg:justify-start gap-4 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] hover:opacity-90 text-white p-5 rounded-2xl transition-all font-black w-full max-w-[320px] shadow-lg shadow-[#FD1D1D]/30 hover:shadow-xl hover:shadow-[#FD1D1D]/40 hover:-translate-y-1 active:scale-95 text-lg"
            >
              <Instagram className="w-8 h-8" />
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] opacity-90 font-bold">Siga nosso</span>
                <span className="text-xl">Instagram</span>
              </div>
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-black mb-8 uppercase tracking-[0.2em] text-[10px] text-gray-500">Categorias</h4>
          <ul className="flex flex-col gap-5 text-base text-gray-400 font-medium">
            {['Ecobags', 'Almofadas', 'Aventais', 'Necessaires'].map(cat => (
              <li key={cat}>
                <button 
                  onClick={() => onCategoryClick(cat.toUpperCase())}
                  className="hover:text-secondary transition-colors"
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-black mb-8 uppercase tracking-[0.2em] text-[10px] text-gray-500">Ajuda</h4>
          <ul className="flex flex-col gap-5 text-base text-gray-400 font-medium">
            <li><button onClick={onContactClick} className="hover:text-secondary transition-colors">Contato</button></li>
            <li><button className="hover:text-secondary transition-colors">Termos de Uso</button></li>
            <li><button className="hover:text-secondary transition-colors">Política de Privacidade</button></li>
          </ul>
        </div>

        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
          <h4 className="font-black mb-6 text-xl tracking-tight">Newsletter</h4>
          <p className="text-sm text-gray-400 mb-6 font-medium">Receba lançamentos exclusivos e mimos em seu e-mail.</p>
          <div className="flex flex-col gap-3">
            <Input 
              placeholder="Seu melhor e-mail" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-none text-white placeholder:text-gray-500 h-12 rounded-xl" 
            />
            <Button 
              onClick={handleSubscribe}
              disabled={isSubscribed}
              className="bg-secondary hover:bg-secondary/90 h-12 rounded-xl font-bold transition-all"
            >
              {isSubscribed ? 'OBRIGADO! ✨' : 'QUERO RECEBER'}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
        <p>© 2024 Belle Mimo. Todos os direitos reservados.</p>
        <div className="flex gap-8">
          <span>CNPJ: 00.000.000/0001-00</span>
          <span>Feito com ❤️ no Brasil</span>
        </div>
      </div>
    </footer>
  );
};

const AuthModal = ({ 
  isOpen, 
  onClose,
  onLogin
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onLogin: (user: UserData) => void;
}) => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    birthDate: '',
    cep: '',
    address: ''
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = React.useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'O e-mail é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Ops! Esse e-mail não parece válido 🧐';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    if (!isLogin) {
      if (!formData.name) newErrors.name = 'O nome é obrigatório';
      if (!formData.cpf) newErrors.cpf = 'CPF ou RG é obrigatório';
      if (!formData.birthDate) {
        newErrors.birthDate = 'Data de nascimento obrigatória';
      }
      if (!formData.cep) newErrors.cep = 'O CEP é obrigatório';
      if (!formData.address) newErrors.address = 'O endereço é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSuccess(true);
      
      try {
        if (isLogin) {
          // Attempt admin login via Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          });
          
          if (!error && data?.user) {
            // Admin successfully logged in
            onLogin({
              name: data.user.user_metadata?.name || 'Administrador',
              email: data.user.email!,
              cpf: '000.000.000-00',
              birthDate: '',
              cep: '',
              address: '',
              isAdmin: true
            });
            setTimeout(() => {
              setIsSuccess(false);
              onClose();
            }, 2000);
            return;
          }
          
          // Se falhou no Supabase, assumimos que pode ser um cliente comum
          if (formData.email.toLowerCase().includes('admin')) {
             setIsSuccess(false);
             setErrors({ email: 'Credenciais incorretas.' });
             return;
          }

          // Fake customer login
          let userData: UserData = {
            name: formData.name || 'Usuário Belle Mimo',
            email: formData.email,
            cpf: '000.000.000-00',
            birthDate: '',
            cep: '',
            address: ''
          };
          setTimeout(() => {
            setIsSuccess(false);
            onLogin(userData);
            onClose();
          }, 2000);
        } else {
          // Fake customer signup
          let userData: UserData = {
            name: formData.name || 'Usuário Belle Mimo',
            email: formData.email,
            cpf: formData.cpf || '000.000.000-00',
            birthDate: formData.birthDate || '',
            cep: formData.cep || '',
            address: formData.address || ''
          };
          
          setTimeout(() => {
            setIsSuccess(false);
            onLogin(userData);
            onClose();
          }, 2000);
        }
      } catch (err) {
        console.error(err);
        setIsSuccess(false);
        setErrors({ email: 'Erro de conexão.' });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white"
          >
            <div className="p-8 lg:p-12 max-h-[85vh] overflow-y-auto custom-scrollbar">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Star className="w-12 h-12 fill-current" />
                  </div>
                  <h2 className="font-heading text-3xl font-bold mb-4 text-green-600">Sucesso!</h2>
                  <p className="text-muted-foreground font-medium">
                    {isLogin ? 'Bem-vindo de volta à Belle Mimo!' : 'Seu cadastro foi realizado com carinho!'}
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-white rotate-6">
                      <User className="w-10 h-10 text-accent-foreground" />
                    </div>
                    <h2 className="font-heading text-3xl font-bold mb-2">
                      {isLogin ? 'Bem-vindo de volta!' : 'Cadastro Completo'}
                    </h2>
                    <p className="text-muted-foreground font-medium">
                      {isLogin ? 'Sentimos sua falta por aqui ✨' : 'Preencha seus dados para uma experiência personalizada 💖'}
                    </p>
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {!isLogin && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-bold ml-4">Nome Completo</label>
                          <Input 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Seu nome completo" 
                            className={`h-14 rounded-full border-2 ${errors.name ? 'border-destructive' : 'border-muted'} focus-visible:ring-primary px-6`}
                          />
                          {errors.name && <p className="text-xs text-destructive ml-4 font-bold">{errors.name}</p>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold ml-4">CPF ou RG</label>
                            <Input 
                              name="cpf"
                              value={formData.cpf}
                              onChange={handleChange}
                              placeholder="000.000.000-00" 
                              className={`h-14 rounded-full border-2 ${errors.cpf ? 'border-destructive' : 'border-muted'} focus-visible:ring-primary px-6`}
                            />
                            {errors.cpf && <p className="text-xs text-destructive ml-4 font-bold">{errors.cpf}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold ml-4">Data de Nascimento</label>
                            <Input 
                              name="birthDate"
                              type="date"
                              value={formData.birthDate}
                              onChange={handleChange}
                              className={`h-14 rounded-full border-2 ${errors.birthDate ? 'border-destructive' : 'border-muted'} focus-visible:ring-primary px-6`}
                            />
                            {errors.birthDate && <p className="text-xs text-destructive ml-4 font-bold">{errors.birthDate}</p>}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold ml-4">CEP</label>
                          <Input 
                            name="cep"
                            value={formData.cep}
                            onChange={handleChange}
                            placeholder="00000-000" 
                            className={`h-14 rounded-full border-2 ${errors.cep ? 'border-destructive' : 'border-muted'} focus-visible:ring-primary px-6`}
                          />
                          {errors.cep && <p className="text-xs text-destructive ml-4 font-bold">{errors.cep}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold ml-4">Endereço Completo</label>
                          <Input 
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Rua, número, bairro..." 
                            className={`h-14 rounded-full border-2 ${errors.address ? 'border-destructive' : 'border-muted'} focus-visible:ring-primary px-6`}
                          />
                          {errors.address && <p className="text-xs text-destructive ml-4 font-bold">{errors.address}</p>}
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-4">E-mail ou Usuário</label>
                      <Input 
                        name="email"
                        type="text"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seu@email.com" 
                        className={`h-14 rounded-full border-2 ${errors.email ? 'border-destructive' : 'border-muted'} focus-visible:ring-primary px-6`}
                      />
                      {errors.email && <p className="text-xs text-destructive ml-4 font-bold">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-4">Senha</label>
                      <Input 
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••" 
                        className={`h-14 rounded-full border-2 ${errors.password ? 'border-destructive' : 'border-muted'} focus-visible:ring-primary px-6`}
                      />
                      {errors.password && <p className="text-xs text-destructive ml-4 font-bold">{errors.password}</p>}
                    </div>
                    
                    <Button type="submit" className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-lg font-bold shadow-lg shadow-primary/30 mt-6">
                      {isLogin ? 'ENTRAR' : 'FINALIZAR CADASTRO'}
                    </Button>
                  </form>

                  <div className="mt-10 text-center">
                    <p className="text-sm text-muted-foreground font-medium mb-4">
                      {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
                    </p>
                    <Button 
                      variant="outline" 
                      className="rounded-full border-2 border-secondary text-secondary hover:bg-secondary/5 font-bold px-8"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setErrors({});
                      }}
                    >
                      {isLogin ? 'CRIAR CONTA' : 'FAZER LOGIN'}
                    </Button>
                  </div>
                </>
              )}
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ProductDetailsModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onBuy,
  onAddToCart,
  approvedArts,
  onGoToStudio,
  user
}: { 
  product: Product | null; 
  isOpen: boolean; 
  onClose: () => void;
  onBuy: (p: Product, quantity: number, shipping: { days: number; price: number } | null, print?: PrintOption, caricature?: string) => void;
  onAddToCart: (p: Product, quantity: number, print?: PrintOption, caricature?: string) => void;
  approvedArts: string[];
  onGoToStudio: () => void;
  user: UserData | null;
}) => {
  const [quantity, setQuantity] = React.useState(1);
  const [cep, setCep] = React.useState('');
  const [shipping, setShipping] = React.useState<{ days: number; price: number } | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [selectedPrint, setSelectedPrint] = React.useState<PrintOption | undefined>(product?.prints?.[0]);
  const [selectedArt, setSelectedArt] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (product) {
      setSelectedPrint(product.prints?.[0]);
      setSelectedArt(undefined);
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const handleCalculateShipping = () => {
    if (cep.length < 8) return;
    setIsCalculating(true);
    setTimeout(() => {
      setShipping({
        days: Math.floor(Math.random() * 5) + 3,
        price: Math.floor(Math.random() * 15) + 10
      });
      setIsCalculating(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white flex flex-col md:flex-row"
          >
            <div className="w-full md:w-1/2 aspect-square bg-muted relative">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={onClose}
                className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive hover:text-white transition-colors shadow-sm"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </div>

            <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
              <Badge className="bg-secondary hover:bg-secondary text-white w-fit mb-4">{product.category}</Badge>
              <h2 className="font-heading text-4xl font-bold mb-4">{product.name}</h2>
              {user?.isAdmin && (
                <p className="text-3xl font-black text-primary mb-6">R$ {product.price.toFixed(2).replace('.', ',')}</p>
              )}
              
              <p className="text-muted-foreground leading-relaxed mb-8 font-medium">
                {product.description}
              </p>

              <div className="space-y-8">
                {/* Quantity */}
                {user?.isAdmin && (
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-sm uppercase tracking-widest">Quantidade</span>
                    <div className="flex items-center gap-4 bg-muted p-2 rounded-full">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full w-8 h-8 bg-white hover:bg-primary hover:text-white"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-bold text-lg w-4 text-center">{quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full w-8 h-8 bg-white hover:bg-primary hover:text-white"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Print Selection */}
                {product.prints && (
                  <div className="space-y-4">
                    <span className="font-bold text-sm uppercase tracking-widest block">Escolha sua Estampa</span>
                    <div className="grid grid-cols-4 gap-3">
                      {product.prints.map((print) => (
                        <button
                          key={print.id}
                          onClick={() => setSelectedPrint(print)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                            selectedPrint?.id === print.id ? 'border-primary scale-105 shadow-md' : 'border-transparent hover:border-primary/30'
                          }`}
                        >
                          <img src={print.image} alt={print.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className={`absolute inset-0 bg-primary/10 transition-opacity ${selectedPrint?.id === print.id ? 'opacity-100' : 'opacity-0'}`} />
                        </button>
                      ))}
                    </div>
                    {selectedPrint && <p className="text-xs font-bold text-primary">Selecionado: {selectedPrint.name}</p>}
                  </div>
                )}

                {/* Studio Art Selection */}
                {user?.isAdmin && product.allowCaricature && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm uppercase tracking-widest block">Sua Arte do Estúdio</span>
                      <Badge className="bg-accent text-accent-foreground">PERSONALIZADO ✨</Badge>
                    </div>
                    
                    {approvedArts.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {approvedArts.map((art, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedArt(selectedArt === art ? undefined : art)}
                            className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all ${
                              selectedArt === art ? 'border-primary scale-105 shadow-lg' : 'border-transparent hover:border-primary/30'
                            }`}
                          >
                            <img src={art} className="w-full h-full object-cover" />
                            {selectedArt === art && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <CheckCircle2 className="text-white w-8 h-8" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-muted/50 rounded-3xl border-2 border-dashed border-muted text-center">
                        <p className="text-sm font-bold mb-2">Nenhuma arte aprovada ainda</p>
                        <p className="text-xs text-muted-foreground mb-4">Vá ao Estúdio para criar sua arte exclusiva!</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full border-primary text-primary"
                          onClick={onGoToStudio}
                        >
                          IR PARA O ESTÚDIO
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Shipping */}
                {user?.isAdmin && (
                  <div className="space-y-4">
                    <span className="font-bold text-sm uppercase tracking-widest block">Calcular Frete</span>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="00000-000" 
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        className="h-12 rounded-full border-2 border-muted focus-visible:ring-primary px-6"
                      />
                      <Button 
                        onClick={handleCalculateShipping}
                        className="h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6"
                      >
                        {isCalculating ? '...' : 'OK'}
                      </Button>
                    </div>
                    {shipping && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-4"
                      >
                        <Truck className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="text-sm font-bold text-green-700">Entrega em {shipping.days} dias úteis</p>
                          <p className="text-xs text-green-600">Valor: R$ {shipping.price.toFixed(2).replace('.', ',')}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {user?.isAdmin && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => onAddToCart(product, quantity, selectedPrint, selectedArt)}
                      className="h-16 rounded-full border-2 border-primary text-primary hover:bg-primary/5 text-sm sm:text-base lg:text-lg font-bold px-4 whitespace-normal leading-tight"
                    >
                      ADICIONAR AO CARRINHO
                    </Button>
                    <Button 
                      onClick={() => onBuy(product, quantity, shipping, selectedPrint, selectedArt)}
                      className="h-16 rounded-full bg-primary hover:bg-primary/90 text-white text-sm sm:text-base lg:text-lg font-bold shadow-lg shadow-primary/30 px-4 whitespace-normal leading-tight"
                    >
                      COMPRAR AGORA
                    </Button>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="pt-6 border-t border-muted flex justify-between items-center gap-4">
                  <div className="flex flex-col items-center text-center gap-1">
                    <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Pagamento Seguro</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-1">
                    <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Qualidade Premium</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-1">
                    <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Entrega Garantida</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const CartModal = ({ 
  isOpen, 
  onClose, 
  cart, 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckout,
  user
}: { 
  isOpen: boolean; 
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: number, delta: number, printId?: string, caricature?: string) => void;
  onRemoveItem: (id: number, printId?: string, caricature?: string) => void;
  onCheckout: () => void;
  user: UserData | null;
}) => {
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const freeShippingThreshold = 250;
  const progress = Math.min((total / freeShippingThreshold) * 100, 100);
  const remaining = freeShippingThreshold - total;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
          >
            <div className="p-8 border-b border-border flex items-center justify-between">
              <h2 className="font-heading text-3xl font-black flex items-center gap-3 tracking-tighter">
                <ShoppingBag className="w-8 h-8 text-primary" />
                Seu Carrinho
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <ArrowRight className="w-6 h-6" />
              </Button>
            </div>

            {/* Free Shipping Progress */}
            {cart.length > 0 && (
              <div className="px-8 py-4 bg-primary/5 border-b border-primary/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    {total >= freeShippingThreshold 
                      ? '✨ Parabéns! Você ganhou Frete Grátis!' 
                      : `Faltam R$ ${remaining.toFixed(2).replace('.', ',')} para Frete Grátis`}
                  </span>
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            )}

            <ScrollArea className="flex-grow p-8">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Seu carrinho está vazio.</p>
                  <Button variant="link" onClick={onClose} className="text-primary font-bold mt-2">
                    Vamos mimal? ✨
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${item.selectedPrint?.id}-${idx}`} className="flex gap-4 group">
                      <div className="w-24 h-24 bg-muted rounded-2xl overflow-hidden flex-shrink-0 relative">
                        <img 
                          src={item.selectedPrint?.image || item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        {item.caricaturePhoto && (
                          <div className="absolute top-1 right-1 w-8 h-8 rounded-lg border-2 border-white shadow-md overflow-hidden bg-white">
                            <img src={item.caricaturePhoto} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                              {item.selectedPrint && (
                                <p className="text-[10px] font-bold text-primary uppercase mt-1">Estampa: {item.selectedPrint.name}</p>
                              )}
                              {item.caricaturePhoto && (
                                <p className="text-[10px] font-bold text-accent uppercase">✨ Com Caricatura</p>
                              )}
                            </div>
                            <button 
                              onClick={() => onRemoveItem(item.id, item.selectedPrint?.id, item.caricaturePhoto)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <ArrowRight className="w-4 h-4 rotate-180" />
                            </button>
                          </div>
                          <p className="text-primary font-black text-sm mt-1">R$ {item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-muted w-fit p-1 rounded-full">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-6 h-6 rounded-full bg-white"
                            onClick={() => onUpdateQuantity(item.id, -1, item.selectedPrint?.id, item.caricaturePhoto)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-6 h-6 rounded-full bg-white"
                            onClick={() => onUpdateQuantity(item.id, 1, item.selectedPrint?.id, item.caricaturePhoto)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <div className="p-8 bg-muted/30 border-t border-border space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cupom de Desconto</span>
                  <div className="flex gap-2">
                    <Input placeholder="Digite seu cupom" className="h-12 rounded-xl bg-white border-muted" />
                    <Button variant="outline" className="h-12 rounded-xl border-primary text-primary px-6 font-bold">APLICAR</Button>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                    <p className="text-3xl font-black text-primary">R$ {total.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Frete</span>
                    <p className="text-sm font-bold text-green-600">{total >= freeShippingThreshold ? 'GRÁTIS' : 'Calculado no checkout'}</p>
                  </div>
                </div>
                
                <Button 
                  onClick={onCheckout}
                  className="w-full h-16 rounded-full bg-primary hover:bg-primary/90 text-lg font-bold shadow-lg shadow-primary/30"
                >
                  {user ? 'FINALIZAR COMPRA' : 'FAÇA LOGIN PARA COMPRAR'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  className="w-full text-muted-foreground font-bold text-xs"
                >
                  CONTINUAR COMPRANDO
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const CheckoutModal = ({ 
  cart, 
  shipping, 
  isOpen, 
  onClose,
  user
}: { 
  cart: CartItem[]; 
  shipping: { days: number; price: number } | null;
  isOpen: boolean; 
  onClose: () => void;
  user: UserData | null;
}) => {
  const [paymentMethod, setPaymentMethod] = React.useState<'card' | 'pix' | 'boleto'>('card');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [cardData, setCardData] = React.useState({ number: '', name: '', expiry: '', cvc: '' });
  const [copied, setCopied] = React.useState(false);
  const [pixCpf, setPixCpf] = React.useState(user?.cpf || '');
  const [showPixDetails, setShowPixDetails] = React.useState(false);

  React.useEffect(() => {
    if (user?.cpf) setPixCpf(user.cpf);
  }, [user]);

  if (cart.length === 0) return null;

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + (shipping?.price || 0);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + (shipping?.days || 7));

  const handleNextStep = () => {
    if (paymentMethod === 'card' && (!cardData.number || !cardData.name)) {
      alert('Por favor, preencha os dados do cartão.');
      return;
    }
    if (paymentMethod === 'pix' && !showPixDetails) {
      alert('Por favor, gere o QR Code do PIX primeiro.');
      return;
    }
    setIsConfirming(true);
  };

  const handleFinish = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsFinished(true);
    }, 2000);
  };

  const pixCode = "00020126580014BR.GOV.BCB.PIX0136belle-mimo-pix-key-12345678905204000053039865404" + total.toFixed(2) + "5802BR5910Belle Mimo6009SAO PAULO62070503***6304";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white"
          >
            <div className="p-8 lg:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
              {isFinished ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h2 className="font-heading text-4xl font-bold mb-4 text-green-600">Pedido Confirmado!</h2>
                  <p className="text-xl text-muted-foreground font-medium mb-8">
                    Seu mimo chegará até o dia <span className="text-foreground font-bold">{deliveryDate.toLocaleDateString('pt-BR')}</span> 💖
                  </p>
                  <Button 
                    onClick={onClose}
                    className="rounded-full px-12 py-6 bg-primary font-bold"
                  >
                    VOLTAR À LOJA
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="font-heading text-3xl font-bold">
                      {isConfirming ? 'Confirmar Pedido' : 'Finalizar Compra'}
                    </h2>
                    <button 
                      onClick={isConfirming ? () => setIsConfirming(false) : onClose} 
                      className="text-muted-foreground hover:text-destructive flex items-center gap-2 font-bold"
                    >
                      <ArrowRight className="w-6 h-6 rotate-180" />
                      {isConfirming && 'VOLTAR'}
                    </button>
                  </div>

                  {isConfirming ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Customer Info */}
                        <div className="space-y-4">
                          <h3 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                            <User className="w-4 h-4" /> Dados do Cliente
                          </h3>
                          <div className="bg-muted/50 p-6 rounded-3xl space-y-3 border-2 border-white shadow-sm">
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Nome</p>
                              <p className="font-bold">{user?.name || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">E-mail</p>
                              <p className="font-bold">{user?.email || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">CPF</p>
                              <p className="font-bold">{user?.cpf || pixCpf || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Endereço de Entrega</p>
                              <p className="font-bold text-sm leading-tight">{user?.address || 'Não informado'}</p>
                              <p className="text-xs text-muted-foreground mt-1">CEP: {user?.cep || 'Não informado'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="space-y-4">
                          <h3 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" /> Detalhes do Pedido
                          </h3>
                          <div className="bg-muted/50 p-6 rounded-3xl space-y-4 border-2 border-white shadow-sm">
                            <div className="space-y-3">
                              {cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <span className="font-medium">{item.quantity}x {item.name}</span>
                                  <span className="font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-4 border-t border-white space-y-2">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Frete</span>
                                <span>R$ {shipping?.price.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-lg font-black text-primary">
                                <span>Total</span>
                                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                              </div>
                            </div>
                            <div className="pt-2">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Forma de Pagamento</p>
                              <div className="flex items-center gap-2 mt-1">
                                {paymentMethod === 'card' && <CreditCard className="w-4 h-4 text-primary" />}
                                {paymentMethod === 'pix' && <QrCode className="w-4 h-4 text-primary" />}
                                {paymentMethod === 'boleto' && <FileText className="w-4 h-4 text-primary" />}
                                <span className="font-bold text-sm">
                                  {paymentMethod === 'card' ? 'Cartão de Crédito' : paymentMethod === 'pix' ? 'PIX' : 'Boleto'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-accent/5 p-6 rounded-[2.5rem] border-2 border-accent/10 text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-4">
                          Ao clicar em finalizar, você concorda com nossos termos de serviço e política de entrega.
                        </p>
                        <Button 
                          onClick={handleFinish}
                          disabled={isProcessing}
                          className="w-full max-w-md h-16 rounded-full bg-primary hover:bg-primary/90 text-xl font-bold shadow-xl shadow-primary/20"
                        >
                          {isProcessing ? (
                            <div className="flex items-center gap-3">
                              <Loader2 className="w-6 h-6 animate-spin" />
                              PROCESSANDO...
                            </div>
                          ) : 'CONFIRMAR E FINALIZAR'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {/* Summary */}
                      <div className="space-y-6">
                        <div className="bg-muted p-6 rounded-3xl space-y-4">
                          <ScrollArea className="max-h-[200px] pr-4">
                            <div className="space-y-4">
                              {cart.map((item, idx) => (
                                <div key={`${item.id}-${idx}`} className="flex gap-4">
                                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                                    <img 
                                      src={item.selectedPrint?.image || item.image} 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                    {item.caricaturePhoto && (
                                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <ImageIcon className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm leading-tight">{item.name}</p>
                                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                                      <p className="text-[10px] text-muted-foreground">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                                      {item.selectedPrint && (
                                        <p className="text-[10px] text-primary font-bold uppercase">• Estampa: {item.selectedPrint.name}</p>
                                      )}
                                      {item.caricaturePhoto && (
                                        <p className="text-[10px] text-accent font-bold uppercase">• Com Caricatura</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <div className="pt-4 border-t border-white/50 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal</span>
                              <span>R$ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Frete</span>
                              <span>R$ {shipping ? shipping.price.toFixed(2) : '0,00'}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black text-primary pt-2">
                              <span>Total</span>
                              <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-accent/10 p-4 rounded-2xl border border-accent/20 flex items-center gap-3">
                          <Truck className="w-5 h-5 text-accent-foreground" />
                          <p className="text-sm font-bold">Estimativa: {deliveryDate.toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>

                      {/* Payment */}
                      <div className="space-y-6">
                        <span className="font-bold text-sm uppercase tracking-widest block">Forma de Pagamento</span>
                        <div className="space-y-3">
                          <button 
                            onClick={() => setPaymentMethod('card')}
                            className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}
                          >
                            <CreditCard className="w-6 h-6" />
                            <span className="font-bold">Cartão de Crédito</span>
                          </button>

                          <AnimatePresence>
                            {paymentMethod === 'card' && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-3 px-2"
                              >
                                <Input 
                                  placeholder="Número do Cartão" 
                                  value={cardData.number}
                                  onChange={(e) => setCardData({...cardData, number: e.target.value})}
                                  className="h-12 rounded-xl"
                                />
                                <Input 
                                  placeholder="Nome no Cartão" 
                                  value={cardData.name}
                                  onChange={(e) => setCardData({...cardData, name: e.target.value})}
                                  className="h-12 rounded-xl"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <Input 
                                    placeholder="Validade (MM/AA)" 
                                    value={cardData.expiry}
                                    onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                                    className="h-12 rounded-xl"
                                  />
                                  <Input 
                                    placeholder="CVC" 
                                    value={cardData.cvc}
                                    onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                                    className="h-12 rounded-xl"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button 
                            onClick={() => setPaymentMethod('pix')}
                            className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}
                          >
                            <QrCode className="w-6 h-6" />
                            <span className="font-bold">PIX</span>
                          </button>

                          <AnimatePresence>
                            {paymentMethod === 'pix' && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-4 px-2 py-2"
                              >
                                {!showPixDetails ? (
                                  <div className="space-y-4 bg-white p-4 rounded-2xl border-2 border-primary/10">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-muted-foreground uppercase ml-2">Confirme seu CPF para o PIX</label>
                                      <Input 
                                        placeholder="000.000.000-00" 
                                        value={pixCpf}
                                        onChange={(e) => setPixCpf(e.target.value)}
                                        className="h-12 rounded-xl"
                                      />
                                    </div>
                                    <Button 
                                      onClick={() => setShowPixDetails(true)}
                                      disabled={!pixCpf}
                                      className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 font-bold"
                                    >
                                      GERAR QR CODE
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="bg-white p-4 rounded-2xl border-2 border-primary/20 flex flex-col items-center gap-4">
                                    <div className="w-40 h-40 bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
                                      {/* Simulated QR Code */}
                                      <div className="absolute inset-0 p-2">
                                        <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=belle-mimo-pix')] bg-contain bg-no-repeat bg-center" />
                                      </div>
                                    </div>
                                    <div className="w-full space-y-2">
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase text-center">Código PIX (Copia e Cola)</p>
                                      <div className="flex gap-2">
                                        <div className="flex-grow bg-muted p-3 rounded-xl text-[10px] font-mono break-all line-clamp-2">
                                          {pixCode}
                                        </div>
                                        <Button 
                                          size="icon" 
                                          variant="outline" 
                                          className="rounded-xl shrink-0"
                                          onClick={handleCopyPix}
                                        >
                                          {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="w-full text-[10px] font-bold text-muted-foreground hover:text-primary"
                                        onClick={() => setShowPixDetails(false)}
                                      >
                                        ALTERAR CPF
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button 
                            onClick={() => setPaymentMethod('boleto')}
                            className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'boleto' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}
                          >
                            <FileText className="w-6 h-6" />
                            <span className="font-bold">Boleto Bancário</span>
                          </button>
                        </div>

                        <Button 
                          onClick={handleNextStep}
                          className="w-full h-16 rounded-full bg-primary hover:bg-primary/90 text-xl font-bold shadow-lg shadow-primary/30 mt-4"
                        >
                          REVISAR PEDIDO
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ContactModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [isSent, setIsSent] = React.useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 border-4 border-white"
          >
            {isSent ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Mensagem Enviada!</h2>
                <p className="text-muted-foreground">Responderemos em breve no seu e-mail. ✨</p>
              </div>
            ) : (
              <>
                <h2 className="font-heading text-3xl font-bold mb-6">Fale Conosco</h2>
                <form className="space-y-4" onSubmit={handleSend}>
                  <Input placeholder="Seu Nome" required className="h-14 rounded-2xl px-6" />
                  <Input placeholder="Seu E-mail" type="email" required className="h-14 rounded-2xl px-6" />
                  <textarea 
                    placeholder="Como podemos te ajudar?" 
                    required
                    className="w-full min-h-[150px] rounded-2xl border-2 border-muted p-6 focus:outline-none focus:border-primary transition-colors"
                  />
                  <Button className="w-full h-14 rounded-full bg-primary font-bold text-lg">
                    ENVIAR MENSAGEM
                  </Button>
                </form>
              </>
            )}
            <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-destructive">
              <ArrowRight className="w-6 h-6 rotate-180" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[90] w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary/90 transition-colors border-4 border-white"
        >
          <ArrowRight className="w-6 h-6 -rotate-90" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

const LoginRequiredModal = ({ isOpen, onClose, onGoToLogin }: { isOpen: boolean; onClose: () => void; onGoToLogin: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 border-4 border-white text-center"
          >
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-white rotate-6">
              <Sparkles className="w-10 h-10 text-accent-foreground" />
            </div>
            <h2 className="font-heading text-3xl font-bold mb-4">Quase lá! ✨</h2>
            <p className="text-muted-foreground font-medium mb-8">
              Para garantir a segurança do seu mimo e salvar seus dados de entrega, você precisa estar logado. 💖
            </p>
            <div className="space-y-3">
              <Button 
                onClick={onGoToLogin}
                className="w-full h-14 rounded-full bg-primary font-bold text-lg shadow-lg shadow-primary/20"
              >
                FAZER LOGIN / CADASTRAR
              </Button>
              <Button 
                variant="ghost"
                onClick={onClose}
                className="w-full h-12 rounded-full font-bold text-muted-foreground"
              >
                CONTINUAR OLHANDO
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorMsg?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error?.message || error?.toString() };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold">Ops! Algo deu errado. 💖</h1>
            <p className="text-muted-foreground">
              Tivemos um pequeno problema técnico. Tente recarregar a página ou limpar seu carrinho.
            </p>
            {this.state.errorMsg && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-mono overflow-auto max-h-40">
                {this.state.errorMsg}
              </div>
            )}
            <Button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="rounded-full px-8"
            >
              LIMPAR TUDO E RECOMEÇAR
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [user, setUser] = React.useState<UserData | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = React.useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [currentCategory, setCurrentCategory] = React.useState('TODOS');
  const [activeView, setActiveView] = React.useState<'home' | 'studio' | 'admin'>('home');
  const [siteImages, setSiteImages] = React.useState<SiteImage[]>([]);
  const [siteTexts, setSiteTexts] = React.useState<SiteText[]>([]);
  const [testimonials, setTestimonials] = React.useState<Testimonial[]>([]);
  const [isVisualEditMode, setIsVisualEditMode] = React.useState(false);
  const [adminTab, setAdminTab] = React.useState<'products'|'images'|'reviews'>('products');

  React.useEffect(() => {
    api.getProducts().then(setProducts).catch(console.error);
    api.getSiteImages().then(setSiteImages).catch(console.error);
    api.getSiteTexts().then(setSiteTexts).catch(console.error);
    api.getTestimonials().then(setTestimonials).catch(console.error);
    
    // Auth Session Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.name || 'Administrador',
          email: session.user.email!,
          cpf: '000.000.000-00',
          birthDate: '',
          cep: '',
          address: '',
          isAdmin: true
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.name || 'Administrador',
          email: session.user.email!,
          cpf: '000.000.000-00',
          birthDate: '',
          cep: '',
          address: '',
          isAdmin: true
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  const [approvedArts, setApprovedArts] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('belle-mimo-arts');
    return saved ? JSON.parse(saved) : [];
  });
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    const saved = localStorage.getItem('belle-mimo-cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [checkoutShipping, setCheckoutShipping] = React.useState<{ days: number; price: number } | null>(null);

  React.useEffect(() => {
    try {
      localStorage.setItem('belle-mimo-cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
      // If quota exceeded, we don't crash the app, just log it
    }
  }, [cart]);

  React.useEffect(() => {
    try {
      localStorage.setItem('belle-mimo-arts', JSON.stringify(approvedArts));
    } catch (e) {
      console.error('Failed to save arts to localStorage:', e);
    }
  }, [approvedArts]);

  const scrollTo = (id: string) => {
    if (activeView !== 'home') {
      setActiveView('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (category: string) => {
    setActiveView('home');
    setCurrentCategory(category);
    scrollTo('products');
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const handleApproveArt = (art: string) => {
    setApprovedArts(prev => [art, ...prev].slice(0, 6)); // Keep last 6
    setActiveView('home');
    scrollTo('products');
  };

  const handleAddToCart = (product: Product, quantity: number, print?: PrintOption, caricature?: string) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.id === product.id && 
        item.selectedPrint?.id === print?.id && 
        item.caricaturePhoto === caricature
      );
      
      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex] = { 
          ...newCart[existingIndex], 
          quantity: newCart[existingIndex].quantity + quantity 
        };
        return newCart;
      }
      
      return [...prev, { ...product, quantity, selectedPrint: print, caricaturePhoto: caricature }];
    });
    setIsDetailsOpen(false);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: number, delta: number, printId?: string, caricature?: string) => {
    setCart(prev => prev.map(item => 
      (item.id === id && item.selectedPrint?.id === printId && item.caricaturePhoto === caricature)
        ? { ...item, quantity: Math.max(1, item.quantity + delta) } 
        : item
    ));
  };

  const handleRemoveItem = (id: number, printId?: string, caricature?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.id === id && item.selectedPrint?.id === printId && item.caricaturePhoto === caricature)
    ));
  };

  const handleBuyNow = (product: Product, quantity: number, shipping: { days: number; price: number } | null, print?: PrintOption, caricature?: string) => {
    if (!user) {
      setIsLoginRequiredOpen(true);
      return;
    }
    setCart([{ ...product, quantity, selectedPrint: print, caricaturePhoto: caricature }]);
    setCheckoutShipping(shipping);
    setIsDetailsOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleCartCheckout = () => {
    if (!user) {
      setIsCartOpen(false);
      setIsLoginRequiredOpen(true);
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleLogout = async () => {
    if (user?.isAdmin) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsCheckoutOpen(false);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
      <Navbar 
        onUserClick={() => setIsAuthModalOpen(true)} 
        onCartClick={() => setIsCartOpen(true)}
        onCategoryClick={handleCategoryClick}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        activeView={activeView}
        onViewChange={setActiveView}
        user={user}
        onLogout={handleLogout}
        siteImages={siteImages}
        isVisualEditMode={isVisualEditMode}
        setIsVisualEditMode={setIsVisualEditMode}
        onAdminTabChange={setAdminTab}
      />
      <main className="flex-grow">
        {activeView === 'home' ? (
          <>
            <Hero 
              onExploreClick={() => scrollTo('products')} 
              siteImages={siteImages}
              siteTexts={siteTexts}
              isEditMode={isVisualEditMode}
            />
            <StudioHighlight 
              onGoToStudio={() => setActiveView('studio')} 
              siteImages={siteImages}
              siteTexts={siteTexts}
              isEditMode={isVisualEditMode}
              isAdmin={user?.isAdmin}
            />
            <AboutUs 
              siteImages={siteImages}
              siteTexts={siteTexts}
              isEditMode={isVisualEditMode}
            />
            <CollectionHighlights 
              products={products}
              onProductClick={handleProductClick} 
              currentCategory={currentCategory}
              onCategoryChange={handleCategoryClick}
              siteTexts={siteTexts}
              isEditMode={isVisualEditMode}
              isAdmin={user?.isAdmin}
            />
            <Testimonials 
              testimonials={testimonials} 
              siteTexts={siteTexts}
              isEditMode={isVisualEditMode}
              isAdmin={user?.isAdmin}
            />
          </>
        ) : activeView === 'admin' && user?.isAdmin ? (
          <AdminDashboard 
            activeTab={adminTab}
            onTabChange={setAdminTab}
            products={products}
            onProductsUpdate={setProducts}
            siteImages={siteImages}
            onSiteImagesUpdate={setSiteImages}
            testimonials={testimonials}
            onTestimonialsUpdate={setTestimonials}
          />
        ) : (
          <ArtStudio 
            onApprove={handleApproveArt}
            onClose={() => setActiveView('home')}
            siteTexts={siteTexts}
            isEditMode={isVisualEditMode}
          />
        )}
      </main>
      <Footer 
        onCategoryClick={handleCategoryClick}
        onContactClick={() => setIsContactModalOpen(true)}
        siteImages={siteImages}
        siteTexts={siteTexts}
        isEditMode={isVisualEditMode}
      />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={(userData) => setUser(userData)}
      />
      <LoginRequiredModal 
        isOpen={isLoginRequiredOpen}
        onClose={() => setIsLoginRequiredOpen(false)}
        onGoToLogin={() => {
          setIsLoginRequiredOpen(false);
          setIsAuthModalOpen(true);
        }}
      />
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <ProductDetailsModal 
        product={selectedProduct} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        onBuy={handleBuyNow}
        onAddToCart={handleAddToCart}
        approvedArts={approvedArts}
        onGoToStudio={() => {
          setIsDetailsOpen(false);
          setActiveView('studio');
        }}
        user={user}
      />
      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCartCheckout}
        user={user}
      />
      <CheckoutModal 
        cart={cart}
        shipping={checkoutShipping}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        user={user}
      />
      <ScrollToTop />
    </div>
    </ErrorBoundary>
  );
}
