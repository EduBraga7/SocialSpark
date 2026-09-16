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
} from 'lucide-react';

// ─── Quick-action cards (equivalente aos "sugestões" do AdGenius) ─────────────
const quickActions = [
  {
    icon: Images,
    label: 'Anúncios',
    description: 'Gere imagens prontas para impulsionar no Instagram ou Facebook.',
    type: 'ads',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: LayoutGrid,
    label: 'Carrossel educativo',
    description: 'Crie slides para engajar seu público com conteúdo de valor.',
    type: 'carousel',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Globe,
    label: 'Prompt de Landing Page',
    description: 'Gere um super prompt para criar o site da sua marca no ChatGPT.',
    type: 'landing_prompt',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [adType, setAdType] = useState('ads');
  const [outputStack, setOutputStack] = useState<'nextjs' | 'html'>('nextjs');
  const [customWhatsapp, setCustomWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [adData, setAdData] = useState<any>(null);
  const [error, setError] = useState('');

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
      setAdData(data.data);
    } catch (err: any) {
      setError(err.message);
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
      const promises = adData.carousel.map(async (slide: any, index: number) => {
        const slideUrl = `/api/generate-ad?template=carrossel&step=${index + 1}&totalSteps=${adData.carousel.length}&title=${encodeURIComponent(slide.title)}&subtitle=${encodeURIComponent(slide.text)}&cta=${encodeURIComponent(slide.cta || adData.cta || '')}&brandColor=${encodeURIComponent(adData.brandColor)}&logoUrl=${encodeURIComponent(adData.logoUrl || '')}`;
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

  const handleQuickAction = (type: string) => {
    setAdType(type);
    // Scroll suave até o input
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 lg:px-8 lg:py-16">

        {/* Heading */}
        <div className="text-center mb-8 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            O que criamos hoje? ✨
          </h1>
          <p className="text-gray-500 text-base md:text-lg">
            Cole o link do Instagram ou site da sua marca e escolha o que quer gerar.
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              {/* Seletor de tipo */}
              <div className="flex gap-1">
                {quickActions.map((qa) => (
                  <button
                    key={qa.type}
                    onClick={() => setAdType(qa.type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      adType === qa.type
                        ? `${qa.bg} ${qa.color}`
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                  >
                    <qa.icon size={13} />
                    {qa.label}
                  </button>
                ))}
              </div>

              {/* Botão enviar */}
              <Show when="signed-in">
                <button
                  onClick={generateAds}
                  disabled={loading || !url}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-all shadow-sm"
                  aria-label="Gerar"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowUp size={16} />
                  )}
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

          {error && (
            <p className="text-red-500 mt-3 text-sm font-medium px-1">{error}</p>
          )}
        </div>

        {/* ── Quick-action cards ──────────────────────────────────────────── */}
        {!adData && (
          <div className="mt-8 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map((qa) => (
              <button
                key={qa.type}
                onClick={() => handleQuickAction(qa.type)}
                className="group text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all"
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
        <div className="w-full px-4 pb-16 lg:px-8 flex flex-col items-center">
          {/* Cabeçalho do resultado */}
          <div className="w-full max-w-4xl mb-8 flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="p-2 bg-green-50 rounded-xl">
              <Sparkles size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">Conteúdo gerado com sucesso!</p>
              <p className="text-xs text-gray-400">
                Cor da marca extraída:{' '}
                <span
                  className="inline-block w-3 h-3 rounded-full align-middle mx-1"
                  style={{ backgroundColor: adData.brandColor }}
                />
                <code className="text-gray-600">{adData.brandColor}</code>
              </p>
            </div>
            <button
              onClick={() => { setAdData(null); setUrl(''); }}
              className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
            >
              Novo
            </button>
          </div>

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
                    <img
                      src={`/api/generate-ad?template=${template}&title=${encodeURIComponent(adData.title)}&subtitle=${encodeURIComponent(adData.subtitle)}&cta=${encodeURIComponent(adData.cta)}&brandColor=${encodeURIComponent(adData.brandColor)}&logoUrl=${encodeURIComponent(adData.logoUrl || '')}`}
                      alt={label}
                      className="w-full max-w-xs rounded-xl shadow border border-gray-200 aspect-square object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Carrossel ────────────────────────────────────────────────── */}
          {adData.adType === 'carousel' && adData.carousel?.length > 0 && (
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x w-full">
                {adData.carousel.map((slide: any, index: number) => (
                  <div key={index} className="flex-none snap-center">
                    <img
                      src={`/api/generate-ad?template=carrossel&step=${index + 1}&totalSteps=${adData.carousel.length}&title=${encodeURIComponent(slide.title)}&subtitle=${encodeURIComponent(slide.text)}&cta=${encodeURIComponent(slide.cta || adData.cta || '')}&brandColor=${encodeURIComponent(adData.brandColor)}&logoUrl=${encodeURIComponent(adData.logoUrl || '')}`}
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
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">Assets da Marca</h3>
                    <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full border border-green-200">
                      Auto-embutido no Prompt
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    A URL da logo e fotos reais do nicho já foram inseridas automaticamente dentro do Super Prompt abaixo!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const proxied = adData.logoUrl.startsWith('https://wsrv.nl') ? adData.logoUrl : `https://wsrv.nl/?url=${encodeURIComponent(adData.logoUrl)}&output=png`;
                          const res = await fetch(proxied);
                          const blob = await res.blob();
                          saveAs(blob, 'logo_marca.png');
                        } catch { alert('Erro ao baixar a logo.'); }
                      }}
                      className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                    >
                      <Download size={13} /> Baixar Logo
                    </button>
                    <button
                      onClick={() => {
                        const safeUrl = adData.logoUrl.startsWith('https://wsrv.nl') ? adData.logoUrl : `https://wsrv.nl/?url=${encodeURIComponent(adData.logoUrl)}&output=png`;
                        navigator.clipboard.writeText(safeUrl);
                        alert('URL pública da logo copiada!');
                      }}
                      className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 px-3 rounded-lg transition-colors border border-blue-100"
                    >
                      <Copy size={13} /> Copiar Link da Logo
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(adData.brandColor); alert('Cor copiada!'); }}
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
                          Fotos do Catálogo (Filtro Anti-Offtopic)
                        </h3>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                          {adData.curatedImages.length} fotos aprovadas
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Posts pessoais, pedidos de ajuda e memes foram descartados pela IA. Estas fotos já estão mapeadas no Super Prompt!
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {adData.curatedImages.map((img: any, idx: number) => (
                      <div
                        key={idx}
                        className="group relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:border-gray-300 transition-colors"
                      >
                        <div className="aspect-square relative overflow-hidden bg-gray-100">
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
                    ))}
                  </div>
                </div>
              )}

              {/* Caixa do prompt */}
              <div className="w-full bg-gray-950 rounded-2xl overflow-hidden shadow-xl border border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 bg-gray-900 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-2">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs font-mono text-gray-300 font-semibold bg-gray-800 px-2 py-0.5 rounded">
                      {adData.outputStack === 'html' ? '🌐 HTML Puro' : '⚡ Next.js (page.tsx)'}
                    </span>
                    {adData.whatsapp && (
                      <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                        <MessageCircle size={10} /> WhatsApp Ativo
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(adData.landingPagePrompt);
                      alert(`Super Prompt ${adData.outputStack === 'html' ? 'HTML' : 'Next.js'} copiado! Cole no Claude, ChatGPT ou v0.`);
                    }}
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors self-start sm:self-auto"
                  >
                    <Copy size={12} /> Copiar Prompt {adData.outputStack === 'html' ? 'HTML' : 'Next.js'}
                  </button>
                </div>
                <div className="p-5 overflow-x-auto">
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {adData.landingPagePrompt}
                  </pre>
                </div>
              </div>
              <p className="text-gray-400 text-sm text-center max-w-md">
                {adData.outputStack === 'html'
                  ? 'Cole o prompt acima no Claude ou ChatGPT para gerar o arquivo HTML completo.'
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
                  onClick={() => { navigator.clipboard.writeText(adData.caption); alert('Legenda copiada!'); }}
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
