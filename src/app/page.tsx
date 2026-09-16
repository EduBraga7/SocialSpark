"use client";

import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Link from 'next/link';
import { Show } from '@clerk/nextjs';
import {
  Images,
  LayoutGrid,
  Globe,
  ArrowUp,
  Download,
  Copy,
  Sparkles,
  Search,
  MessageCircle,
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Target,
  Compass,
  FileText,
  Flame,
  Check,
  Award,
  Layers,
  Zap,
  Package,
} from 'lucide-react';

interface ActionPlanStep {
  period: string;
  title: string;
  description: string;
}

interface BioSuggestion {
  style: string;
  text: string;
}

interface CuratedImage {
  role?: string;
  title?: string;
  description?: string;
  url: string;
}

interface SlideItem {
  title: string;
  text: string;
  cta?: string;
}

interface ProfileData {
  username?: string;
  fullName?: string;
  biography?: string;
  businessCategoryName?: string;
  profilePicUrl?: string;
  isVerified?: boolean;
  isBusinessAccount?: boolean;
}

interface MetricsData {
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  avgLikes?: number;
  avgComments?: number;
  engagementRate?: number;
  formatsBreakdown?: {
    images?: string;
    reels?: string;
    carousels?: string;
  };
}

interface AnalysisResult {
  adType: string;
  brandColor?: string;
  logoUrl?: string;
  caption?: string;
  title?: string;
  subtitle?: string;
  cta?: string;
  landingPagePrompt?: string;
  outputStack?: string;
  whatsapp?: string;
  curatedImages?: CuratedImage[];
  carousel?: SlideItem[];
  score?: number;
  scoreLabel?: string;
  scoreBreakdown?: {
    bioClarity?: number;
    engagementHealth?: number;
    commercialReadiness?: number;
    contentVisual?: number;
  };
  niche?: {
    main?: string;
    sub?: string;
    positioning?: string;
  };
  targetAudience?: {
    persona?: string;
    painPoints?: string[];
    desires?: string[];
  };
  brandVoice?: string;
  bioAudit?: {
    currentStatus?: string;
    strengths?: string[];
    flaws?: string[];
    suggestedBios?: BioSuggestion[];
  };
  strengths?: string[];
  opportunities?: string[];
  actionPlan?: ActionPlanStep[];
  profile?: ProfileData;
  metrics?: MetricsData;
}

// ─── Quick-action cards ───────────────────────────────────────────────────────
const quickActions = [
  {
    icon: BarChart3,
    label: 'Raio-X do Perfil',
    labelShort: 'Raio-X',
    description: 'Extraia métricas, seguidores, nicho e receba um diagnóstico completo com IA.',
    type: 'profile_summary',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Images,
    label: 'Anúncios',
    labelShort: 'Anúncios',
    description: 'Gere imagens prontas para impulsionar no Instagram ou Facebook.',
    type: 'ads',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: LayoutGrid,
    label: 'Carrossel',
    labelShort: 'Carrossel',
    description: 'Crie slides para engajar seu público com conteúdo de valor.',
    type: 'carousel',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Globe,
    label: 'Landing Page',
    labelShort: 'Landing',
    description: 'Gere um super prompt para criar o site da sua marca no ChatGPT.',
    type: 'landing_prompt',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [adType, setAdType] = useState('profile_summary');
  const [outputStack, setOutputStack] = useState<'nextjs' | 'html'>('nextjs');
  const [customWhatsapp, setCustomWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [adData, setAdData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [copiedBioIndex, setCopiedBioIndex] = useState<number | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const generateAds = async () => {
    if (!url) {
      setError('Por favor, insira uma URL.');
      return;
    }
    setLoading(true);
    setError('');
    setAdData(null);
    try {
      const response = await fetch('/api/analyze-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, adType, outputStack, customWhatsapp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar conteúdo');
      setAdData(data.data as AnalysisResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const downloadCarouselZip = async () => {
    if (!adData || !adData.carousel) return;
    setLoading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('carrossel');
      const carouselItems = adData.carousel;
      const promises = carouselItems.map(async (slide: SlideItem, index: number) => {
        const slideUrl = `/api/generate-ad?template=carrossel&step=${index + 1}&totalSteps=${carouselItems.length}&title=${encodeURIComponent(slide.title)}&subtitle=${encodeURIComponent(slide.text)}&cta=${encodeURIComponent(slide.cta || adData.cta || '')}&brandColor=${encodeURIComponent(adData.brandColor || '#3b82f6')}&logoUrl=${encodeURIComponent(adData.logoUrl || '')}`;
        const res = await fetch(slideUrl);
        const blob = await res.blob();
        folder?.file(`slide_${index + 1}.png`, blob);
      });
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'carrossel_socialspark.zip');
    } catch {
      alert('Erro ao gerar o arquivo ZIP.');
    }
    setLoading(false);
  };

  const downloadAssetsZip = async () => {
    if (!adData) return;
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const assetsFolder = zip.folder('assets') || zip;

      // 1. Logo oficial da marca
      if (adData.logoUrl) {
        try {
          const proxiedLogo = adData.logoUrl.startsWith('https://wsrv.nl')
            ? adData.logoUrl
            : `https://wsrv.nl/?url=${encodeURIComponent(adData.logoUrl)}&output=png`;
          const logoRes = await fetch(proxiedLogo);
          const logoBlob = await logoRes.blob();
          assetsFolder.file('logo.png', logoBlob);
        } catch (e) {
          console.error('Erro ao baixar logo para o pack:', e);
        }
      }

      // 2. Curated Images (Hero e Produtos)
      if (Array.isArray(adData.curatedImages)) {
        let prodIdx = 1;
        for (const img of adData.curatedImages) {
          if (!img.url) continue;
          try {
            const safeImgUrl = img.url.startsWith('https://wsrv.nl')
              ? img.url
              : `https://wsrv.nl/?url=${encodeURIComponent(img.url)}&output=jpg&w=1200&q=85`;
            const imgRes = await fetch(safeImgUrl);
            const imgBlob = await imgRes.blob();
            const filename = img.role === 'hero' ? 'hero.jpg' : `produto_${prodIdx++}.jpg`;
            assetsFolder.file(filename, imgBlob);
          } catch (e) {
            console.error('Erro ao baixar imagem para o pack:', img.url, e);
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'pack_imagens_landing.zip');
    } catch (err) {
      console.error('Erro ao gerar ZIP de assets:', err);
      alert('Erro ao gerar o pacote de imagens ZIP.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const copyFullReport = () => {
    if (!adData || adData.adType !== 'profile_summary') return;
    const p = adData.profile || {};
    const m = adData.metrics || {};
    const n = adData.niche || {};
    const a = adData.targetAudience || {};

    const reportText = `📊 RELATÓRIO DE DIAGNÓSTICO ESTRATÉGICO (SocialSpark)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Perfil: ${p.fullName || 'Marca'} (@${p.username || ''})
⭐ SocialSpark Score: ${adData.score ?? 80}/100 — ${adData.scoreLabel || 'Avaliação Concluída'}

📈 MÉTRICAS PRINCIPAIS:
• Seguidores: ${m.followersCount?.toLocaleString('pt-BR') || '0'}
• Seguindo: ${m.followsCount?.toLocaleString('pt-BR') || '0'}
• Publicações: ${m.postsCount || '0'}
• Taxa Média de Engajamento: ${m.engagementRate || 0}%
• Média por Post: ${m.avgLikes || 0} curtidas | ${m.avgComments || 0} comentários

🎯 NICHO & POSICIONAMENTO:
• Nicho Principal: ${n.main || ''}
• Subnicho: ${n.sub || ''}
• Posicionamento: ${n.positioning || ''}
• Tom de Voz: ${adData.brandVoice || ''}

👥 PERSONA & PÚBLICO-ALVO:
• ${a.persona || ''}

💡 PONTOS FORTES:
${adData.strengths?.map((s: string) => `✅ ${s}`).join('\n') || ''}

⚠️ OPORTUNIDADES / GARGALOS:
${adData.opportunities?.map((o: string) => `⚡ ${o}`).join('\n') || ''}

🚀 PLANO DE AÇÃO (PRÓXIMOS 7 DIAS):
${adData.actionPlan?.map((step: ActionPlanStep) => `• [${step.period}] ${step.title}: ${step.description}`).join('\n') || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gerado por SocialSpark ✨`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const transitionToMode = (newMode: string) => {
    setAdType(newMode);
    setAdData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('main-input')?.focus();
    }, 100);
  };

  const handleQuickAction = (type: string) => {
    setAdType(type);
    document.getElementById('main-input')?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateAds();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-full">
      {/* ── Área principal ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-14">

        {/* Heading */}
        <div className="text-center mb-6 max-w-2xl px-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3">
            <Sparkles size={13} className="text-amber-600" />
            <span>Novo: Raio-X & Diagnóstico Estratégico com IA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            O que criamos hoje? ✨
          </h1>
          <p className="text-gray-500 text-sm sm:text-base md:text-lg">
            Cole o link do Instagram e extraia métricas, crie anúncios, carrosséis ou landing pages.
          </p>
        </div>

        {/* ── Input principal (estilo chat) ───────────────────────────────── */}
        <div className="w-full max-w-2xl">
          <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            {/* Textarea */}
            <textarea
              id="main-input"
              rows={2}
              placeholder="https://www.instagram.com/suamarca/"
              className="w-full resize-none bg-transparent outline-none px-5 pt-4 pb-2 text-gray-800 placeholder-gray-400 text-base rounded-t-2xl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            {/* Opções exclusivas para Landing Page */}
            {adType === 'landing_prompt' && (
              <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
                {/* Seletor de Stack */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium shrink-0">Saída:</span>
                  <div className="flex bg-gray-200/70 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setOutputStack('nextjs')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        outputStack === 'nextjs'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      ⚡ Next.js (React)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputStack('html')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        outputStack === 'html'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      🌐 HTML Puro
                    </button>
                  </div>
                </div>

                {/* WhatsApp Input */}
                <div className="flex items-center gap-1.5 flex-1 sm:max-w-xs">
                  <MessageCircle size={14} className="text-emerald-600 shrink-0" />
                  <input
                    type="text"
                    placeholder="WhatsApp da marca (opcional)"
                    value={customWhatsapp}
                    onChange={(e) => setCustomWhatsapp(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Barra inferior do input */}
            <div className="flex flex-col gap-2 px-4 py-3 border-t border-gray-100">
              {/* Seletor de tipo — responsivo */}
              <div className="flex gap-1.5 flex-wrap">
                {quickActions.map((qa) => (
                  <button
                    key={qa.type}
                    onClick={() => setAdType(qa.type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      adType === qa.type
                        ? `${qa.bg} ${qa.color} shadow-xs ring-1 ring-inset ring-current/20`
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                  >
                    <qa.icon size={13} />
                    <span className="hidden sm:inline">{qa.label}</span>
                    <span className="sm:hidden">{qa.labelShort}</span>
                  </button>
                ))}
              </div>

              {/* Botão enviar — linha separada em mobile */}
              <div className="flex justify-end">
                <Show when="signed-in">
                  <button
                    onClick={generateAds}
                    disabled={loading || !url}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 transition-all shadow-sm"
                    aria-label="Gerar"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowUp size={14} />
                    )}
                    <span>{loading ? 'Analisando...' : 'Analisar & Gerar'}</span>
                  </button>
                </Show>
                <Show when="signed-out">
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Entrar para gerar
                  </Link>
                </Show>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-500 mt-3 text-sm font-medium px-1">{error}</p>
          )}
        </div>

        {/* ── Quick-action cards ──────────────────────────────────────────── */}
        {!adData && (
          <div className="mt-8 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((qa) => (
              <button
                key={qa.type}
                onClick={() => handleQuickAction(qa.type)}
                className={`group text-left bg-white border rounded-xl p-4 transition-all ${
                  adType === qa.type
                    ? 'border-blue-400 ring-2 ring-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                <div className={`inline-flex p-2 ${qa.bg} rounded-lg mb-3`}>
                  <qa.icon size={18} className={qa.color} />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{qa.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{qa.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Resultados ─────────────────────────────────────────────────────── */}
      {adData && (
        <div className="w-full px-4 pb-16 sm:px-6 lg:px-8 flex flex-col items-center">

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── DIAGNÓSTICO & RAIO-X DO PERFIL ─────────────────────────────── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {adData.adType === 'profile_summary' && (
            <div className="w-full max-w-4xl flex flex-col gap-6">

              {/* Header do Perfil */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {adData.profile?.profilePicUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={adData.profile.profilePicUrl.startsWith('https://wsrv.nl')
                        ? adData.profile.profilePicUrl
                        : `https://wsrv.nl/?url=${encodeURIComponent(adData.profile.profilePicUrl)}&output=png`}
                      alt={adData.profile.fullName || 'Foto de perfil'}
                      className="w-18 h-18 rounded-full object-cover border-3 border-amber-400 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-18 h-18 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xl shrink-0">
                      {(adData.profile?.fullName || 'I')[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-gray-900">
                        {adData.profile?.fullName || 'Perfil Analisado'}
                      </h2>
                      {adData.profile?.isVerified && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-blue-600" /> Verificado
                        </span>
                      )}
                      {adData.profile?.isBusinessAccount && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-700 rounded-full">
                          Conta Comercial
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">
                      @{adData.profile?.username || 'instagram'}
                      {adData.profile?.businessCategoryName && (
                        <span className="text-gray-400 font-sans ml-2">
                          • {adData.profile.businessCategoryName}
                        </span>
                      )}
                    </p>
                    {adData.profile?.biography && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2 max-w-xl italic">
                        &ldquo;{adData.profile.biography}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Botões de Ação do Header */}
                <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
                  <button
                    onClick={copyFullReport}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    {copiedReport ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedReport ? 'Copiado!' : 'Copiar Relatório'}</span>
                  </button>
                  <button
                    onClick={() => { setAdData(null); setUrl(''); }}
                    className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Nova Consulta
                  </button>
                </div>
              </div>

              {/* Score do Perfil & Métricas Chave */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* SocialSpark Score Card */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white border border-amber-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                        <Award size={16} className="text-amber-600" /> SocialSpark Score
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300/60">
                        {adData.scoreLabel || 'Bom Potencial'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-black text-gray-900 tracking-tight">
                        {adData.score ?? 80}
                      </span>
                      <span className="text-gray-400 font-semibold text-sm">/ 100</span>
                    </div>
                  </div>

                  {/* Barras do Score Breakdown */}
                  {adData.scoreBreakdown && (
                    <div className="space-y-2 text-xs pt-3 border-t border-amber-200/60">
                      <div>
                        <div className="flex justify-between text-gray-600 font-medium mb-1">
                          <span>Clareza da Bio</span>
                          <span className="font-bold text-gray-900">{adData.scoreBreakdown.bioClarity}%</span>
                        </div>
                        <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${adData.scoreBreakdown.bioClarity}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-gray-600 font-medium mb-1">
                          <span>Saúde do Engajamento</span>
                          <span className="font-bold text-gray-900">{adData.scoreBreakdown.engagementHealth}%</span>
                        </div>
                        <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${adData.scoreBreakdown.engagementHealth}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-gray-600 font-medium mb-1">
                          <span>Prontidão de Vendas</span>
                          <span className="font-bold text-gray-900">{adData.scoreBreakdown.commercialReadiness}%</span>
                        </div>
                        <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${adData.scoreBreakdown.commercialReadiness}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Métricas Principais (4 KPIs) */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  {/* Seguidores */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="text-xs font-semibold text-gray-500">Seguidores</span>
                      <Users size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">
                        {adData.metrics?.followersCount?.toLocaleString('pt-BR') || '0'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Seguindo: {adData.metrics?.followsCount?.toLocaleString('pt-BR') || '0'}
                      </p>
                    </div>
                  </div>

                  {/* Taxa de Engajamento */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="text-xs font-semibold text-gray-500">Engajamento Estimado</span>
                      <Flame size={16} className="text-rose-500" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-2xl font-black text-gray-900">
                          {adData.metrics?.engagementRate || '0'}%
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          Number(adData.metrics?.engagementRate || 0) >= 2.0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {Number(adData.metrics?.engagementRate || 0) >= 2.0 ? 'Acima da média' : 'Regular'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Benchmark de mercado: 1.5% - 3.5%
                      </p>
                    </div>
                  </div>

                  {/* Média por Post */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="text-xs font-semibold text-gray-500">Média por Publicação</span>
                      <TrendingUp size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {adData.metrics?.avgLikes?.toLocaleString('pt-BR') || '0'} curtidas
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {adData.metrics?.avgComments || '0'} comentários médios
                      </p>
                    </div>
                  </div>

                  {/* Total de Publicações & Formatos */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="text-xs font-semibold text-gray-500">Total de Posts</span>
                      <Layers size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">
                        {adData.metrics?.postsCount || '0'}
                      </p>
                      {adData.metrics?.formatsBreakdown && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {adData.metrics.formatsBreakdown.reels} Reels • {adData.metrics.formatsBreakdown.images} Fotos
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nicho, Posicionamento & Público-Alvo (Persona) */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Target size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      Nicho, Posicionamento & Persona
                    </h3>
                    <p className="text-xs text-gray-400">
                      Diagnóstico de mercado e definição do cliente ideal para esta marca
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nicho & Tom de Voz */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Nicho & Especialidade
                      </span>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="px-2.5 py-1 bg-white border border-gray-200 text-gray-800 text-xs font-bold rounded-lg shadow-xs">
                          {adData.niche?.main || 'Geral'}
                        </span>
                        {adData.niche?.sub && (
                          <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg">
                            {adData.niche.sub}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <strong className="text-gray-800">Posicionamento:</strong> &ldquo;{adData.niche?.positioning}&rdquo;
                      </p>
                    </div>

                    {adData.brandVoice && (
                      <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100">
                        <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-1">
                          Tom de Voz Recomendado
                        </span>
                        <p className="text-xs text-purple-900 font-medium leading-relaxed">
                          {adData.brandVoice}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Persona & Desejos */}
                  {adData.targetAudience && (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                          Persona Ideal
                        </span>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {adData.targetAudience.persona}
                        </p>
                      </div>

                      {adData.targetAudience.painPoints && (
                        <div>
                          <span className="text-[11px] font-bold text-red-600 block mb-1">
                            Dores que o cliente quer resolver:
                          </span>
                          <ul className="space-y-1">
                            {adData.targetAudience.painPoints.map((pain: string, i: number) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="text-red-500 font-bold">•</span>
                                <span>{pain}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {adData.targetAudience.desires && (
                        <div>
                          <span className="text-[11px] font-bold text-emerald-700 block mb-1">
                            Desejos que motivam a compra:
                          </span>
                          <ul className="space-y-1">
                            {adData.targetAudience.desires.map((desire: string, i: number) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{desire}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Auditoria da Bio & 3 Sugestões Otimizadas */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <FileText size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      Auditoria da Bio & Sugestões Prontas
                    </h3>
                    <p className="text-xs text-gray-400">
                      Ajuste a biografia para reter visitantes e converter em mensagens e vendas
                    </p>
                  </div>
                </div>

                {/* Status atual */}
                {adData.bioAudit?.currentStatus && (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 mb-5">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-900">
                          Diagnóstico da Bio Atual:
                        </p>
                        <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                          {adData.bioAudit.currentStatus}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cards de Bios Sugeridas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {adData.bioAudit?.suggestedBios?.map((bioItem: BioSuggestion, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-300 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-white border border-gray-200 rounded-md text-gray-700 shadow-xs">
                            {bioItem.style || `Opção ${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed font-sans mt-2">
                          {bioItem.text}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(bioItem.text);
                          setCopiedBioIndex(idx);
                          setTimeout(() => setCopiedBioIndex(null), 2000);
                        }}
                        className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 transition-all shadow-xs"
                      >
                        {copiedBioIndex === idx ? (
                          <>
                            <Check size={13} className="text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copiar Bio</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pontos Fortes vs Oportunidades (SWOT) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pontos Fortes */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm md:text-base">
                      Pontos Fortes da Conta
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {adData.strengths?.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Oportunidades / Gargalos */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber-50 rounded-xl">
                      <Zap size={18} className="text-amber-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm md:text-base">
                      Oportunidades & Gargalos
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {adData.opportunities?.map((opp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          !
                        </span>
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Plano de Ação Recomendado (7 Dias) */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Compass size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      Plano de Ação para os Próximos 7 Dias
                    </h3>
                    <p className="text-xs text-gray-400">
                      Passos práticos e sequenciais para aumentar engajamento e pedidos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {adData.actionPlan?.map((step: ActionPlanStep, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-amber-500" />
                      <div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mb-2">
                          {step.period}
                        </span>
                        <h4 className="font-bold text-xs text-gray-900 mb-1">
                          {step.title}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Próximos Passos: Pontes para Geração de Conteúdo */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-5">
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Transforme este diagnóstico em ativos reais ✨
                  </h3>
                  <p className="text-xs text-white/80 mt-1 max-w-lg">
                    Use os dados extraídos desta marca para gerar anúncios promocionais, carrosséis educativos ou a landing page agora mesmo.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => transitionToMode('ads')}
                    className="px-3.5 py-2 bg-white text-blue-700 hover:bg-white/90 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Gerar Anúncios
                  </button>
                  <button
                    onClick={() => transitionToMode('carousel')}
                    className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
                  >
                    Gerar Carrossel
                  </button>
                  <button
                    onClick={() => transitionToMode('landing_prompt')}
                    className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
                  >
                    Landing Page
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── MODOS EXISTENTES: ADS / CAROUSEL / LANDING ──────────────────── */}
          {/* ═════════════════════════════════════════════════════════════════ */}

          {/* Cabeçalho do resultado para Ads, Carousel e Landing */}
          {adData.adType !== 'profile_summary' && (
            <div className="w-full max-w-4xl mb-6 flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="p-2 bg-green-50 rounded-xl shrink-0">
                <Sparkles size={18} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">Conteúdo gerado! ✨</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 flex-wrap">
                  Cor da marca:
                  <span
                    className="inline-block w-3 h-3 rounded-full align-middle"
                    style={{ backgroundColor: adData.brandColor }}
                  />
                  <code className="text-gray-600">{adData.brandColor}</code>
                </p>
              </div>
              <button
                onClick={() => { setAdData(null); setUrl(''); }}
                className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors shrink-0"
              >
                Novo
              </button>
            </div>
          )}

          {/* ── Anúncios ─────────────────────────────────────────────────── */}
          {adData.adType === 'ads' && (
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { template: 'elegante', label: 'Template 1 — Elegante' },
                { template: 'promocional', label: 'Template 2 — Promocional' },
              ].map(({ template, label }) => (
                <div key={template} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-700">{label}</p>
                  </div>
                  <div className="p-6 flex justify-center bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/generate-ad?template=${template}&title=${encodeURIComponent(adData.title || '')}&subtitle=${encodeURIComponent(adData.subtitle || '')}&cta=${encodeURIComponent(adData.cta || '')}&brandColor=${encodeURIComponent(adData.brandColor || '')}&logoUrl=${encodeURIComponent(adData.logoUrl || '')}`}
                      alt={label}
                      className="w-full max-w-xs rounded-xl shadow border border-gray-200 aspect-square object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Carrossel ────────────────────────────────────────────────── */}
          {adData.adType === 'carousel' && adData.carousel && adData.carousel.length > 0 && (
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x w-full">
                {adData.carousel.map((slide: SlideItem, index: number) => (
                  <div key={index} className="flex-none snap-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/generate-ad?template=carrossel&step=${index + 1}&totalSteps=${adData.carousel?.length}&title=${encodeURIComponent(slide.title)}&subtitle=${encodeURIComponent(slide.text)}&cta=${encodeURIComponent(slide.cta || adData.cta || '')}&brandColor=${encodeURIComponent(adData.brandColor || '')}&logoUrl=${encodeURIComponent(adData.logoUrl || '')}`}
                      alt={`Slide ${index + 1}`}
                      className="w-[280px] h-[280px] md:w-[360px] md:h-[360px] rounded-2xl shadow-md border border-gray-200"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={downloadCarouselZip}
                disabled={loading}
                className="mt-6 flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 shadow"
              >
                <Download size={18} />
                {loading ? 'Preparando ZIP...' : 'Baixar Carrossel (ZIP)'}
              </button>
            </div>
          )}

          {/* ── Landing Page Prompt ───────────────────────────────────────── */}
          {adData.adType === 'landing_prompt' && adData.landingPagePrompt && (
            <div className="w-full max-w-4xl flex flex-col items-center gap-6">
              {/* Assets extraídos */}
              <div className="w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-5">
                <div className="flex-shrink-0">
                  {adData.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={adData.logoUrl.startsWith('https://wsrv.nl') ? adData.logoUrl : `https://wsrv.nl/?url=${encodeURIComponent(adData.logoUrl)}&output=png`}
                      alt="Logo"
                      className="w-20 h-20 rounded-2xl border-2 shadow-sm object-contain"
                      style={{ borderColor: adData.brandColor }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-800">Assets da Marca & Imagens Locais</h3>
                    <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full border border-green-200">
                      Pasta assets/ mapeada
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    As fotos reais e a logo foram mapeadas para a pasta local <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">assets/</code> no código. Baixe o pacote ZIP para ter todos os arquivos prontos!
                  </p>
                  <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                    <button
                      onClick={downloadAssetsZip}
                      disabled={downloadingZip}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg transition-colors shadow-xs"
                    >
                      <Package size={14} />
                      <span>{downloadingZip ? 'Compactando...' : 'Baixar Pack de Imagens (ZIP)'}</span>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const proxied = adData.logoUrl?.startsWith('https://wsrv.nl') ? adData.logoUrl : `https://wsrv.nl/?url=${encodeURIComponent(adData.logoUrl || '')}&output=png`;
                          const res = await fetch(proxied);
                          const blob = await res.blob();
                          saveAs(blob, 'logo_marca.png');
                        } catch { alert('Erro ao baixar a logo.'); }
                      }}
                      className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                    >
                      <Download size={13} /> Baixar Apenas Logo
                    </button>
                    <button
                      onClick={() => {
                        const safeUrl = adData.logoUrl?.startsWith('https://wsrv.nl') ? adData.logoUrl : `https://wsrv.nl/?url=${encodeURIComponent(adData.logoUrl || '')}&output=png`;
                        navigator.clipboard.writeText(safeUrl);
                        alert('URL pública da logo copiada!');
                      }}
                      className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 px-3 rounded-lg transition-colors border border-blue-100"
                    >
                      <Copy size={13} /> Copiar Link da Logo
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(adData.brandColor || '#000'); alert('Cor copiada!'); }}
                      className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-2 px-3 rounded-lg transition-colors border border-gray-200"
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: adData.brandColor }} />
                      Copiar Cor ({adData.brandColor})
                    </button>
                  </div>
                </div>
              </div>

              {/* Fotos Reais do Catálogo (Filtro Anti-Offtopic) */}
              {adData.curatedImages && adData.curatedImages.length > 0 && (
                <div className="w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 text-sm md:text-base">
                          Fotos do Catálogo (Pasta assets/)
                        </h3>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                          {adData.curatedImages.length} fotos aprovadas
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Estas fotos serão baixadas com nomes padronizados no pack ZIP e já estão vinculadas ao código gerado:
                      </p>
                    </div>
                    <button
                      onClick={downloadAssetsZip}
                      disabled={downloadingZip}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors self-start sm:self-auto"
                    >
                      <Package size={13} />
                      <span>{downloadingZip ? 'Baixando...' : 'Baixar Todas (ZIP)'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {adData.curatedImages.map((img: CuratedImage, idx: number) => {
                      const localFilename = img.role === 'hero' ? 'assets/hero.jpg' : `assets/produto_${idx}.jpg`;
                      return (
                        <div
                          key={idx}
                          className="group relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:border-gray-300 transition-colors"
                        >
                          <div className="aspect-square relative overflow-hidden bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.title || `Produto ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/75 text-white backdrop-blur-sm">
                              {img.role === 'hero' ? '⭐ Destaque Hero' : `Produto ${idx}`}
                            </span>
                          </div>
                          <div className="p-2.5 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="font-semibold text-xs text-gray-800 line-clamp-1" title={img.title}>
                                {img.title || 'Produto'}
                              </p>
                              {img.description && (
                                <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5" title={img.description}>
                                  {img.description}
                                </p>
                              )}
                              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1.5 inline-block">
                                {localFilename}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(img.url);
                                alert('Link da foto copiado!');
                              }}
                              className="mt-2 text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 self-start"
                            >
                              <Copy size={11} /> Copiar link
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Informação do Pack de Imagens & Arquivos Modulares */}
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-emerald-900">
                      Projeto Modular & Sem Links Quebrados 📦
                    </p>
                    <p className="text-emerald-800 mt-0.5 leading-relaxed">
                      {adData.outputStack === 'html'
                        ? 'O Super Prompt foi configurado para gerar 3 ARQUIVOS SEPARADOS (index.html, style.css e script.js). Todas as imagens já estão vinculadas à pasta local assets/. Baixe o ZIP e extraia na mesma pasta do seu index.html!'
                        : 'O Super Prompt foi configurado para Next.js usando os caminhos da pasta assets/. Baixe o ZIP e coloque as fotos na sua pasta public/assets/!'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadAssetsZip}
                  disabled={downloadingZip}
                  className="shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs text-xs self-stretch sm:self-auto justify-center"
                >
                  <Package size={14} />
                  <span>{downloadingZip ? 'Compactando...' : 'Baixar Imagens (ZIP)'}</span>
                </button>
              </div>

              {/* Caixa do prompt */}
              <div className="w-full bg-gray-950 rounded-2xl overflow-hidden shadow-xl border border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 bg-gray-900 border-b border-gray-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-1.5 mr-2">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs font-mono text-gray-300 font-semibold bg-gray-800 px-2 py-0.5 rounded">
                      {adData.outputStack === 'html' ? '🌐 HTML Modular (index.html • style.css • script.js)' : '⚡ Next.js (page.tsx)'}
                    </span>
                    {adData.whatsapp && (
                      <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                        <MessageCircle size={10} /> WhatsApp Ativo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={downloadAssetsZip}
                      disabled={downloadingZip}
                      className="flex items-center gap-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
                    >
                      <Package size={12} /> {downloadingZip ? 'Baixando...' : 'Baixar Imagens (ZIP)'}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(adData.landingPagePrompt || '');
                        alert(`Super Prompt ${adData.outputStack === 'html' ? 'HTML Modular' : 'Next.js'} copiado! Cole no Claude, ChatGPT ou v0.`);
                      }}
                      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
                    >
                      <Copy size={12} /> Copiar Prompt
                    </button>
                  </div>
                </div>
                <div className="p-5 overflow-x-auto">
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {adData.landingPagePrompt}
                  </pre>
                </div>
              </div>
              <p className="text-gray-400 text-sm text-center max-w-lg">
                {adData.outputStack === 'html'
                  ? 'Cole o prompt acima no Claude ou ChatGPT. Ele entregará os 3 arquivos completos (index.html, style.css e script.js) prontos para rodar com o pack de imagens.'
                  : 'Cole o prompt acima no Claude, ChatGPT ou v0 para gerar o componente Next.js (page.tsx) pronto com Tailwind e Lucide.'}
              </p>
            </div>
          )}

          {/* ── Legenda do Post ───────────────────────────────────────────── */}
          {(adData.adType === 'ads' || adData.adType === 'carousel') && adData.caption && (
            <div className="mt-8 w-full max-w-4xl">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700">Legenda do Post</h2>
              </div>
              <div className="w-full bg-white border border-gray-200 rounded-2xl p-5 relative group shadow-sm">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{adData.caption}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(adData.caption || ''); alert('Legenda copiada!'); }}
                  className="absolute top-4 right-4 flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm transition-all"
                >
                  <Copy size={12} /> Copiar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
