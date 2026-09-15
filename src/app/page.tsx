"use client";

import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';

export default function Home() {
  const [url, setUrl] = useState('');
  const [adType, setAdType] = useState('ads'); // 'ads' ou 'carousel'
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
        body: JSON.stringify({ url, adType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar anúncios');
      }

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
      const folder = zip.folder("carrossel");
      
      const promises = adData.carousel.map(async (slide: any, index: number) => {
        const slideUrl = `/api/generate-ad?template=carrossel&step=${index + 1}&totalSteps=${adData.carousel.length}&title=${encodeURIComponent(slide.title)}&subtitle=${encodeURIComponent(slide.text)}&cta=${encodeURIComponent(slide.cta || adData.cta || '')}&brandColor=${encodeURIComponent(adData.brandColor)}&logoUrl=${encodeURIComponent(adData.logoUrl || '')}`;
        const res = await fetch(slideUrl);
        const blob = await res.blob();
        folder?.file(`slide_${index + 1}.png`, blob);
      });
      
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "carrossel_socialspark.zip");
    } catch (error) {
      console.error("Erro ao baixar zip", error);
      alert("Erro ao gerar o arquivo ZIP.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-8 md:p-24 bg-white text-black flex flex-col items-center">
      {/* Header / Logo */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-16">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <span className="text-xl font-bold">SocialSpark</span>
        </div>
        <Show when="signed-out">
          <Link href="/login" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-full transition-colors">
            Entrar
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>

      <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-center">
        Social<span className="text-blue-600">Spark</span> ✨
      </h1>
      <p className="text-gray-500 mb-8 max-w-2xl text-center text-lg">
        Cole o link da sua loja ou Instagram. Escolha o formato e a nossa IA fará o resto.
      </p>

      <div className="w-full max-w-2xl flex flex-col gap-4">
        {/* Toggle (Radio) para escolha do tipo */}
        <div className="flex gap-4 p-2 bg-gray-100 rounded-full justify-center flex-wrap">
          <button
            onClick={() => setAdType('ads')}
            className={`flex-1 min-w-[140px] py-3 px-6 rounded-full font-bold transition-all ${adType === 'ads' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            Anúncios (Imagens)
          </button>
          <button
            onClick={() => setAdType('carousel')}
            className={`flex-1 min-w-[140px] py-3 px-6 rounded-full font-bold transition-all ${adType === 'carousel' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            Carrossel Educativo
          </button>
          <button
            onClick={() => setAdType('landing_prompt')}
            className={`flex-1 min-w-[140px] py-3 px-6 rounded-full font-bold transition-all ${adType === 'landing_prompt' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            Landing Page
          </button>
        </div>

        <div className="flex w-full items-center border border-gray-300 rounded-full p-2 bg-white shadow-sm hover:shadow-md transition-shadow">
          <span className="pl-4 text-gray-400">🔗</span>
          <input
            type="url"
            placeholder="https://www.instagram.com/suamarca/"
            className="flex-1 bg-transparent border-none outline-none p-3 text-black"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={generateAds}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? 'Analisando...' : 'Gerar'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}

      {adData && (
        <div className="mt-16 w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">Magia Concluída! ✨</h2>
            <p className="text-gray-600">
              A IA analisou seu perfil e capturou a cor <span className="inline-block w-4 h-4 rounded-full align-middle mx-1" style={{ backgroundColor: adData.brandColor }}></span> ({adData.brandColor}). Veja o resultado abaixo:
            </p>
          </div>

          {adData.adType === 'ads' && (
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl justify-center">
              {/* Template Elegante */}
              <div className="flex-1 border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-700">Template 1: Elegante</h3>
                </div>
                <div className="p-8 flex justify-center bg-gray-100/50">
                  <img
                    src={`/api/generate-ad?template=elegante&title=${encodeURIComponent(adData.title)}&subtitle=${encodeURIComponent(adData.subtitle)}&cta=${encodeURIComponent(adData.cta)}&brandColor=${encodeURIComponent(adData.brandColor)}&logoUrl=${encodeURIComponent(adData.logoUrl || '')}`}
                    alt="Anúncio Elegante"
                    className="w-full max-w-sm rounded-xl shadow-lg border border-gray-200 aspect-square object-cover"
                  />
                </div>
              </div>

              {/* Template Promocional */}
              <div className="flex-1 border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-700">Template 2: Promocional</h3>
                </div>
                <div className="p-8 flex justify-center bg-gray-100/50">
                  <img
                    src={`/api/generate-ad?template=promocional&title=${encodeURIComponent(adData.title)}&subtitle=${encodeURIComponent(adData.subtitle)}&cta=${encodeURIComponent(adData.cta)}&brandColor=${encodeURIComponent(adData.brandColor)}&logoUrl=${encodeURIComponent(adData.logoUrl || '')}`}
                    alt="Anúncio Promocional"
                    className="w-full max-w-sm rounded-xl shadow-lg border border-gray-200 aspect-square object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {adData.adType === 'carousel' && adData.carousel && adData.carousel.length > 0 && (
            <div className="w-full max-w-6xl flex flex-col items-center">
              <div className="flex overflow-x-auto gap-8 pb-8 snap-x w-full justify-center">
                {adData.carousel.map((slide: any, index: number) => (
                  <div key={index} className="flex-none snap-center">
                    <img
                      src={`/api/generate-ad?template=carrossel&step=${index + 1}&totalSteps=${adData.carousel.length}&title=${encodeURIComponent(slide.title)}&subtitle=${encodeURIComponent(slide.text)}&cta=${encodeURIComponent(slide.cta || adData.cta || '')}&brandColor=${encodeURIComponent(adData.brandColor)}&logoUrl=${encodeURIComponent(adData.logoUrl || '')}`}
                      alt={`Slide ${index + 1}`}
                      className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-xl shadow-lg border border-gray-200"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={downloadCarouselZip}
                disabled={loading}
                className="mt-8 bg-black hover:bg-gray-800 text-white font-bold py-4 px-12 rounded-full transition-all flex items-center gap-3 text-lg disabled:opacity-50"
              >
                {loading ? 'Preparando ZIP...' : '📦 Baixar Carrossel (ZIP)'}
              </button>
            </div>
          )}

          {/* Prompt de Landing Page */}
          {adData.adType === 'landing_prompt' && adData.landingPagePrompt && (
            <div className="w-full max-w-4xl flex flex-col items-center">
              
              {/* Assets Extraídos */}
              <div className="w-full bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  {adData.logoUrl ? (
                    <img src={`https://wsrv.nl/?url=${encodeURIComponent(adData.logoUrl)}&output=png`} alt="Logo" className="w-24 h-24 rounded-full border-4 shadow-sm" style={{ borderColor: adData.brandColor }} />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center">N/A</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Assets da Marca</h3>
                  <p className="text-gray-600 mb-4">Esses são os arquivos originais extraídos do perfil para você usar na construção do site.</p>
                  <div className="flex gap-4 flex-wrap">
                    <button
                      onClick={async () => {
                        try {
                          const proxiedUrl = `https://wsrv.nl/?url=${encodeURIComponent(adData.logoUrl)}&output=png`;
                          const response = await fetch(proxiedUrl);
                          const blob = await response.blob();
                          saveAs(blob, 'logo_marca.png');
                        } catch (err) {
                          alert('Erro ao baixar a logo.');
                        }
                      }}
                      className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                    >
                      📦 Baixar Logo
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(adData.logoUrl);
                        alert('URL da Logo copiada!');
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg transition-colors border border-blue-200"
                    >
                      Copiar URL da Logo
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(adData.brandColor);
                        alert('Cor copiada!');
                      }}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors border border-gray-200 flex items-center gap-2"
                    >
                      <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: adData.brandColor }}></span>
                      Copiar Cor ({adData.brandColor})
                    </button>
                  </div>
                </div>
              </div>

              {/* Caixa de Código do Prompt */}
              <div className="w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                <div className="flex justify-between items-center px-6 py-4 bg-gray-800 border-b border-gray-700">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(adData.landingPagePrompt);
                      alert('Super Prompt copiado! Agora é só colar no ChatGPT ou Claude.');
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-1.5 px-4 rounded transition-colors"
                  >
                    Copiar Prompt
                  </button>
                </div>
                <div className="p-6 overflow-x-auto">
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {adData.landingPagePrompt}
                  </pre>
                </div>
              </div>
              <p className="mt-6 text-gray-500 text-center max-w-xl">
                Copie o código acima e cole em um chat de Inteligência Artificial para que ele crie a Landing Page perfeita e estruturada usando todos os dados da sua marca.
              </p>
            </div>
          )}

          {/* Legenda do Post (Só aparece para Anúncios ou Carrossel) */}
          {(adData.adType === 'ads' || adData.adType === 'carousel') && adData.caption && (
            <div className="mt-16 w-full max-w-3xl flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-4">📝 Legenda do Post</h2>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-6 relative group">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{adData.caption}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(adData.caption);
                    alert('Legenda copiada para a área de transferência!');
                  }}
                  className="absolute top-4 right-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg shadow-sm transition-all"
                >
                  Copiar
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </main>
  );
}
