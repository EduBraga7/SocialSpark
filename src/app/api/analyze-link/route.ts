import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { GoogleGenAI } from '@google/genai';

// Instanciamos os clientes apenas se as chaves existirem
const apifyClient = process.env.APIFY_API_TOKEN ? new ApifyClient({ token: process.env.APIFY_API_TOKEN }) : null;
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { url, adType = 'ads', outputStack = 'nextjs', customWhatsapp = '' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    let scrapedData = "";
    let mainImageUrl = "";
    let candidatePosts: Array<{ index: number; caption: string; hashtags: string[]; url: string }> = [];
    let detectedWhatsapp = "";

    if (customWhatsapp && customWhatsapp.trim()) {
      const clean = customWhatsapp.replace(/\D/g, '');
      detectedWhatsapp = clean.length >= 10 ? (clean.startsWith('55') ? clean : `55${clean}`) : clean;
    }

    if (apifyClient) {
      console.log("Iniciando extração real no Apify para:", url);
      try {
        const isInstagram = url.includes('instagram.com');
        let run;
        
        if (isInstagram) {
          run = await apifyClient.actor("apify/instagram-scraper").call({
            directUrls: [url],
            resultsType: "details"
          });
        } else {
          run = await apifyClient.actor("apify/cheerio-scraper").call({
            startUrls: [{ url }],
            maxPagesPerCrawl: 1
          });
        }

        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        
        if (items && items.length > 0) {
          if (isInstagram) {
            const profile = items[0] as any;
            scrapedData = `
              Nome da Marca: ${profile.fullName || profile.username || ''}
              Nicho/Categoria: ${profile.businessCategoryName || ''}
              Biografia (Bio): ${profile.biography || ''}
            `;
            mainImageUrl = profile.profilePicUrlHD || profile.profilePicUrl || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop";

            // Detecção de WhatsApp se não informado manualmente
            if (!detectedWhatsapp) {
              if (Array.isArray(profile.externalUrls)) {
                const wa = profile.externalUrls.find((u: any) => typeof u === 'string' && (u.includes('wa.me') || u.includes('whatsapp.com')));
                if (wa) detectedWhatsapp = wa;
              }
              if (!detectedWhatsapp && profile.biography) {
                const waMatch = profile.biography.match(/wa\.me\/(\d+)/i) || profile.biography.match(/(?:whatsapp|zap|contato|fone)?\s*:?\s*\(?(\d{2})\)?\s*(\d{4,5})[-.\s]?(\d{4})/i);
                if (waMatch) {
                  if (waMatch[1] && waMatch[2] && waMatch[3]) {
                    detectedWhatsapp = `55${waMatch[1]}${waMatch[2]}${waMatch[3]}`;
                  } else if (waMatch[1]) {
                    detectedWhatsapp = waMatch[1];
                  }
                }
              }
            }

            // Extração de posts recentes para curadoria de produtos
            let rawPosts: any[] = [];
            if (Array.isArray(profile.latestPosts) && profile.latestPosts.length > 0) {
              rawPosts = profile.latestPosts;
            } else if (items.length > 1) {
              rawPosts = items.filter((it: any) => it.displayUrl);
            }

            candidatePosts = rawPosts
              .filter((p: any) => p && p.displayUrl && (p.type === 'Image' || p.type === 'Sidecar' || !p.type))
              .slice(0, 12)
              .map((p: any, idx: number) => {
                const rawCaption = (p.caption || '').replace(/\r?\n/g, ' ').trim();
                const safeUrl = `https://wsrv.nl/?url=${encodeURIComponent(p.displayUrl)}&output=jpg&w=800&q=80`;
                return {
                  index: idx + 1,
                  caption: rawCaption.slice(0, 250),
                  hashtags: Array.isArray(p.hashtags) ? p.hashtags.slice(0, 6) : [],
                  url: safeUrl
                };
              });

          } else {
            scrapedData = `Texto da página: ${(items[0] as any).text || ''}`;
            mainImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop"; 
          }
        }
      } catch (err: any) {
        console.error("Erro no Apify:", err);
        throw new Error("Falha na extração de dados do Apify");
      }
    } else {
      scrapedData = `Nome da Marca: Florar Atelier\nNicho/Categoria: Artesanato / Crochê\nBiografia (Bio): Lembrancinhas, bolsas, decoração. O crochê de uma forma diferente, pra você!\nChame no direct, envios para todo Brasil 📦🇧🇷`;
      mainImageUrl = "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1080&auto=format&fit=crop";
      candidatePosts = [
        {
          index: 1,
          caption: "Oiii pessoal !!! Venho aqui hoje pedir ajuda de vocês para comprar a cadeira de rodas para minha mãe...",
          hashtags: ["ajuda", "familia"],
          url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop"
        },
        {
          index: 2,
          caption: "Novo modelo de lembrança disponível 🕊✨️ A mandala espírito santo, perfeita para decorar o seu lar ou presentes para batismo!",
          hashtags: ["lembrancinhaspersonalizadas", "crochet", "feitoamao"],
          url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800&auto=format&fit=crop"
        },
        {
          index: 3,
          caption: "A bolsa Angel é aquela mistura de elegância, estilo e confiança. Peça exclusiva em crochê feita à mão.",
          hashtags: ["bolsadecroche", "crochetbag", "feitoamao"],
          url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop"
        },
        {
          index: 4,
          caption: "Mais uma case de celular que saiu por aqui na Florar, e posso garantir que ficou linda e protege com charme!",
          hashtags: ["casecroche", "acessoriosartesanais"],
          url: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?q=80&w=800&auto=format&fit=crop"
        },
        {
          index: 5,
          caption: "Trazendo vocês comigo para uma tarde de balé, espero que gostem 🩰✨",
          hashtags: ["bale", "lifestyle"],
          url: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=800&auto=format&fit=crop"
        },
        {
          index: 6,
          caption: "Lembrancinha de coração em fio de malha atualizada com todo carinho para seu evento!",
          hashtags: ["lembrancinhas", "crochet"],
          url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop"
        }
      ];
    }

    const cleanWhatsappUrl = detectedWhatsapp.startsWith('http')
      ? detectedWhatsapp
      : (detectedWhatsapp ? `https://wa.me/${detectedWhatsapp}` : 'https://wa.me/55SEUNUMERO');

    let aiResult;

    if (ai) {
      const safeLogoUrl = mainImageUrl.startsWith('https://wsrv.nl')
        ? mainImageUrl
        : `https://wsrv.nl/?url=${encodeURIComponent(mainImageUrl)}&output=png`;

      const postsContext = candidatePosts.length > 0
        ? `POSTS RECENTES EXTRAÍDOS DO INSTAGRAM DA MARCA (PARA CURADORIA RIGOROSA):\n` +
          candidatePosts.map(p => `[POST #${p.index}]:\n- Legenda: "${p.caption}"\n- Hashtags: [${p.hashtags.join(', ')}]\n- URL da Imagem: ${p.url}`).join('\n\n')
        : 'Nenhum post recente extraído.';

      const stackGuidelines = outputStack === 'nextjs' ? `
        STACK TÉCNICA OBRIGATÓRIA: NEXT.JS (APP ROUTER) + TYPESCRIPT + REACT + TAILWIND CSS
        - O código deve ser entregue como um ÚNICO componente React completo pronto para colar diretamente em "src/app/page.tsx" de um projeto Next.js.
        - Comece obrigatoriamente com 'use client'; no topo.
        - Importe e use ícones modernos da biblioteca "lucide-react" (ex: MessageCircle, Sparkles, Check, ChevronDown, ShoppingBag, ArrowRight, ShieldCheck, Heart, Star, Instagram).
        - Use Tailwind CSS para estilização moderna, limpa e responsiva (mobile-first, sm:, md:, lg:).
        - Use useState do React para controlar o FAQ interativo (accordion) e menu mobile caso necessário.
        - Código 100% completo, sem omissões ou reticências ("// adicione o resto"), pronto para salvar e rodar!
      ` : `
        STACK TÉCNICA: ARQUIVO ÚNICO HTML + TAILWIND CSS VIA CDN
        - Entregar um arquivo único HTML completo com <!DOCTYPE html>, Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>), Google Fonts e micro-interações, pronto para abrir direto no navegador.
      `;

      const prompt = adType === 'landing_prompt' ? `
        Você é um Diretor de Criação, Especialista em Marketing Digital de Alta Conversão e Engenheiro Frontend Sênior especializado em Next.js.
        
        DADOS DA MARCA:
        ---
        ${scrapedData}
        ---

        ${postsContext}

        SUA MISSÃO:
        1. CURADORIA INTELIGENTE ANTI-OFFTOPIC (REGRA DE OURO):
           Analise rigorosamente as legendas e o conteúdo de cada post recente listado acima:
           - SELECIONE de 3 a 4 posts que sejam ESTRITAMENTE sobre PRODUTOS, PEÇAS AUTORAIS, SERVIÇOS OU TRABALHOS COMERCIAIS da marca (relacionados ao nicho ${scrapedData}).
           - É TERMINANTEMENTE PROIBIDO selecionar posts de:
             * Pedidos de ajuda, vaquinhas, doações ou assuntos pessoais/familiares.
             * Fotos pessoais, selfies sem produto, fotos de família, crianças ou momentos privados.
             * Memes, piadas soltas ou conteúdos de humor que não apresentem produtos reais.
             * Passeios, viagens, vlogs ou hobbies pessoais (ex: passeios, aulas de dança, balé).
             * Avisos operacionais sem foto de produto (ex: feriados, recesso).
           - Se não houver posts suficientes de produtos, complemente com fotos de produtos reais de artesanato/nicho de alta qualidade do Unsplash.

           Para cada foto aprovada na curadoria, defina:
           - "role": "hero" (a peça mais marcante e bonita para o banner de destaque principal) OU "product_1", "product_2", "product_3"
           - "title": Nome comercial atraente para o produto com base na legenda (ex: "Mandala Espírito Santo", "Bolsa Angel em Crochê", "Case Artesanal para Celular")
           - "description": Breve frase persuasiva destacando o benefício/charme da peça
           - "url": A URL exata da imagem selecionada

        2. DIRETRIZES OBRIGATÓRIAS DE CONVERSÃO - CTA 100% WHATSAPP:
           - Link Base do WhatsApp: "${cleanWhatsappUrl}"
           - BOTÃO FLUTUANTE DO WHATSAPP (OBRIGATÓRIO):
             Deve ter um botão flutuante verde (bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl) fixo no canto inferior direito ("fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-full hover:scale-105 transition-all shadow-lg font-bold text-sm") com ícone do WhatsApp / MessageCircle e texto "Falar no WhatsApp".
             O link deve ser: "${cleanWhatsappUrl}?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20tirar%20uma%20d%C3%BAvida."
           - NAVBAR (CABEÇALHO):
             Botão CTA destacado: "Falar no WhatsApp" apontando para o link do WhatsApp.
           - HERO SECTION (BANNER PRINCIPAL):
             Botão de CTA primário em destaque: "Fazer Pedido no WhatsApp" (com ícone do WhatsApp e efeito hover marcante).
             Botão secundário suave: "Ver Perfil no Instagram" (apontando para ${url}).
           - CARDS DE PRODUTOS / CATÁLOGO:
             O botão de CTA de CADA card de produto deve ter o texto "Encomendar no WhatsApp" ou "Pedir no WhatsApp" e o link do WhatsApp DEVE vir personalizado com o nome exato da peça!
             Exemplo: "${cleanWhatsappUrl}?text=Ol%C3%A1!%20Gostei%20do(a)%20[NOME_DO_PRODUTO]%20e%20gostaria%20de%20fazer%20uma%20encomenda."
           - HERO FINAL / BANNER DE FECHAMENTO:
             Chamada irresistível com botão para atendimento imediato e personalizado via WhatsApp.

        3. STACK E IMPLEMENTAÇÃO DO SUPER PROMPT:
           ${stackGuidelines}
           - Uso OBRIGATÓRIO da Logo Real: <img src="${safeLogoUrl}" alt="Logo da Marca" class="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover shadow-sm ring-2 ring-white" /> no Header e Rodapé.
           - Uso OBRIGATÓRIO de cada uma das fotos reais curadas:
             * Inserir a foto de "hero" em destaque no Hero Banner com cantos arredondados e sombra elegante.
             * Inserir as fotos dos produtos ("product_1", "product_2", "product_3") nos respectivos cards da seção de catálogo/produtos com os nomes e descrições reais definidos na curadoria!
             * PROIBIR expressamente o uso de emojis (como 🌸, 🧴) ou caixas vazias como substitutos de imagens.
           - Estrutura completa: Navbar fixa com backdrop blur, Hero de impacto, Seção de Diferenciais, História da Marca, Catálogo com as fotos reais, FAQ interativo com accordion, Banner Final de CTA e Rodapé com logo real.

        Retorne EXATAMENTE um objeto JSON válido:
        {
          "brandColor": "Código HEX de uma cor harmoniosa e moderna para o nicho",
          "logoUrl": "${safeLogoUrl}",
          "whatsapp": "${cleanWhatsappUrl}",
          "outputStack": "${outputStack}",
          "curatedImages": [
            {
              "role": "hero",
              "title": "Nome da peça de destaque",
              "description": "Breve descrição de venda",
              "url": "URL da foto selecionada"
            },
            {
              "role": "product_1",
              "title": "Nome do produto 1",
              "description": "Breve descrição de venda",
              "url": "URL da foto selecionada"
            }
          ],
          "landingPagePrompt": "O super prompt completo com as URLs reais das fotos e os links personalizados do WhatsApp mapeados no código"
        }
      ` : adType === 'carousel' ? `
        Você é um diretor de arte e redator publicitário genial.
        Crie o conteúdo para um CARROSSEL EDUCATIVO de 3 slides para o Instagram desta marca.
        ---
        ${scrapedData}
        ---
        Retorne EXATAMENTE um objeto JSON válido:
        {
          "brandColor": "Um código HEX de cor que combine com o nicho",
          "logoUrl": "${mainImageUrl}",
          "caption": "Legenda completa e persuasiva para usar na descrição do Instagram, com hashtags estratégicas.",
          "carousel": [
            { "title": "Título impactante do Slide 1", "text": "Problema/Introdução" },
            { "title": "Título do Slide 2", "text": "Solução/Desenvolvimento" },
            { "title": "Título do Slide 3", "text": "Conclusão e Call to Action da marca", "cta": "Call to action curto" }
          ]
        }
      ` : `
        Você é um diretor de arte e redator publicitário genial.
        Crie o conteúdo para anúncios INSTITUCIONAIS focados na MARCA (Brand Awareness).
        ---
        ${scrapedData}
        ---
        Retorne EXATAMENTE um objeto JSON válido:
        {
          "title": "Título curto de apresentação",
          "subtitle": "Um subtítulo persuasivo sobre a marca",
          "cta": "Call to action curto",
          "brandColor": "Um código HEX de cor que combine com o nicho",
          "logoUrl": "${mainImageUrl}",
          "caption": "Legenda completa e persuasiva para usar na descrição do Instagram, com hashtags estratégicas."
        }
      `;

      let response;
      let retries = 3;
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          break; // Sai do loop se der sucesso
        } catch (err: any) {
          retries--;
          if (retries === 0) {
            throw new Error(err.message?.includes('503') 
              ? "A Inteligência Artificial está com muita demanda no momento. Aguarde alguns segundos e tente novamente!" 
              : "Erro na geração pela IA: " + err.message);
          }
          console.log(`Erro no Gemini (tentando novamente... restam ${retries})`, err.message);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2s
        }
      }
      if (!response) {
        throw new Error('Falha ao comunicar com o Gemini após várias tentativas.');
      }
      
      const responseText = response.text;
      if (responseText) {
          aiResult = JSON.parse(responseText);
          aiResult.imageUrl = ""; 
          aiResult.adType = adType;
      } else {
           throw new Error("Empty response from AI");
      }
      
    } else {
      console.log("Nenhuma chave do Gemini encontrada. Usando copy simulado.");
      const safeLogo = mainImageUrl.startsWith('https://wsrv.nl')
        ? mainImageUrl
        : `https://wsrv.nl/?url=${encodeURIComponent(mainImageUrl)}&output=png`;

      if (adType === 'landing_prompt') {
        const fallbackImages = [
          {
            role: "hero",
            title: "Mandala Espírito Santo",
            description: "Peça decorativa e lembrança afetiva feita à mão com primor",
            url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800&auto=format&fit=crop"
          },
          {
            role: "product_1",
            title: "Bolsas em Fio de Malha",
            description: "Bolsa Angel e modelos autorais feitos com elegância",
            url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop"
          },
          {
            role: "product_2",
            title: "Cases Artesanais de Celular",
            description: "Proteção com charme e acabamento artesanal único",
            url: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?q=80&w=800&auto=format&fit=crop"
          },
          {
            role: "product_3",
            title: "Lembrancinhas Afetivas",
            description: "Mimos personalizados para batizados e celebrações",
            url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop"
          }
        ];
        aiResult = {
          brandColor: "#e11d48",
          logoUrl: safeLogo,
          whatsapp: cleanWhatsappUrl,
          outputStack: outputStack,
          curatedImages: fallbackImages,
          landingPagePrompt: outputStack === 'nextjs' 
            ? `Atue como um Engenheiro Frontend Sênior especializado em Next.js e crie um componente React completo ('use client', TypeScript, Tailwind CSS, lucide-react) para ser colado em "src/app/page.tsx". Marca: Florar Atelier (Instagram: ${url}). WhatsApp: ${cleanWhatsappUrl}. Use a logo: <img src="${safeLogo}" alt="Logo" class="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-white" /> no Header e Rodapé. No Hero, use a foto da Mandala: <img src="${fallbackImages[0].url}" alt="Mandala" class="rounded-3xl shadow-xl object-cover" />. Nos cards de produtos, use as fotos reais das peças: Bolsa Angel (${fallbackImages[1].url}), Cases de Celular (${fallbackImages[2].url}) e Lembrancinhas (${fallbackImages[3].url}), com cada botão de card abrindo o WhatsApp com a mensagem personalizada da respectiva peça. Inclua o botão flutuante do WhatsApp fixo no canto inferior direito. Código 100% pronto e completo sem omissões.`
            : `Atue como um Engenheiro Frontend Sênior e Copywriter de Alta Conversão. Crie uma Landing Page completa em HTML único com Tailwind CSS via CDN para a marca Florar Atelier (Link: ${url}). WhatsApp: ${cleanWhatsappUrl}. Use a logo real: <img src="${safeLogo}" alt="Logo" class="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-white" /> no Header e Rodapé. No Hero, use a foto da Mandala: <img src="${fallbackImages[0].url}" alt="Mandala" class="rounded-3xl shadow-xl object-cover" />. Nos cards, use as fotos reais dos produtos (${fallbackImages[1].url}, ${fallbackImages[2].url}, ${fallbackImages[3].url}) com CTAs para WhatsApp. Inclua o botão flutuante do WhatsApp fixo no canto inferior direito. Código 100% pronto.`,
          adType: 'landing_prompt'
        };
      } else if (adType === 'carousel') {
        aiResult = {
          brandColor: "#059669",
          logoUrl: safeLogo,
          caption: "Transforme seus ambientes com peças feitas à mão com afeto! ✨ Conheça nossa nova coleção artesanal.",
          carousel: [
            { title: "Peças Únicas em Crochê", text: "Cada ponto carrega carinho, dedicação e exclusividade para o seu lar." },
            { title: "Artesanato Sustentável", text: "Fios selecionados e acabamento impecável para valorizar a sua decoração." },
            { title: "Garanta a Sua Peça", text: "Chame no direct ou acesse o link na bio para encomendar a sua personalizada.", cta: "Fazer Pedido" }
          ],
          adType: 'carousel'
        };
      } else {
        aiResult = {
          title: "Moda Sustentável",
          subtitle: "Vestidos de verão feitos à mão. Leveza e estilo para seus dias quentes.",
          cta: "Ver Coleção",
          brandColor: "#2F4F4F",
          logoUrl: safeLogo,
          adType: 'ads'
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: aiResult
    });

  } catch (error: any) {
    console.error("Erro na rota de análise:", error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
