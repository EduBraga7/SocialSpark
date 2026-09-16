import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { GoogleGenAI } from '@google/genai';

// Instanciamos os clientes apenas se as chaves existirem
const apifyClient = process.env.APIFY_API_TOKEN ? new ApifyClient({ token: process.env.APIFY_API_TOKEN }) : null;
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

interface InstagramProfile {
  username?: string;
  fullName?: string;
  biography?: string;
  businessCategoryName?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  verified?: boolean;
  isVerified?: boolean;
  isBusinessAccount?: boolean;
  profilePicUrlHD?: string;
  profilePicUrl?: string;
  externalUrls?: string[];
  latestPosts?: InstagramRawPost[];
}

interface InstagramRawPost {
  caption?: string;
  displayUrl?: string;
  type?: string;
  hashtags?: string[];
  likesCount?: number;
  likes?: number;
  commentsCount?: number;
  comments?: number;
  edge_liked_by?: { count?: number };
  edge_media_to_comment?: { count?: number };
}

export async function POST(request: Request) {
  try {
    const { url, adType = 'ads', outputStack = 'nextjs', customWhatsapp = '' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    let scrapedData = "";
    let mainImageUrl = "";
    let candidatePosts: Array<{ index: number; caption: string; hashtags: string[]; url: string; likes?: number; comments?: number }> = [];
    let detectedWhatsapp = "";

    if (customWhatsapp && customWhatsapp.trim()) {
      const clean = customWhatsapp.replace(/\D/g, '');
      detectedWhatsapp = clean.length >= 10 ? (clean.startsWith('55') ? clean : `55${clean}`) : clean;
    }

    let profileData = {
      username: '',
      fullName: '',
      biography: '',
      businessCategoryName: '',
      profilePicUrl: '',
      isVerified: false,
      isBusinessAccount: false,
      externalUrls: [] as string[]
    };

    let metrics = {
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
      avgLikes: 0,
      avgComments: 0,
      engagementRate: 0,
      formatsBreakdown: {
        images: '0%',
        reels: '0%',
        carousels: '0%'
      }
    };

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
            const profile = items[0] as unknown as InstagramProfile;
            const extractedUsername = profile.username || (url.match(/instagram\.com\/([^/?#&]+)/i)?.[1] || '');
            const extractedFullName = profile.fullName || profile.username || 'Perfil';
            const extractedBio = profile.biography || '';
            const extractedCategory = profile.businessCategoryName || '';
            const followers = Number(profile.followersCount || 0);
            const follows = Number(profile.followsCount || 0);
            const posts = Number(profile.postsCount || 0);
            const isVerif = Boolean(profile.verified || profile.isVerified);
            const isBiz = Boolean(profile.isBusinessAccount);
            const pic = profile.profilePicUrlHD || profile.profilePicUrl || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop";

            profileData = {
              username: extractedUsername,
              fullName: extractedFullName,
              biography: extractedBio,
              businessCategoryName: extractedCategory,
              profilePicUrl: pic,
              isVerified: isVerif,
              isBusinessAccount: isBiz,
              externalUrls: Array.isArray(profile.externalUrls) ? profile.externalUrls : []
            };

            scrapedData = `
              Nome da Marca: ${extractedFullName} (@${extractedUsername})
              Nicho/Categoria: ${extractedCategory}
              Biografia (Bio): ${extractedBio}
              Seguidores: ${followers.toLocaleString('pt-BR')}
              Seguindo: ${follows.toLocaleString('pt-BR')}
              Total de Publicações: ${posts}
            `;
            mainImageUrl = pic;

            // Detecção de WhatsApp se não informado manualmente
            if (!detectedWhatsapp) {
              if (Array.isArray(profile.externalUrls)) {
                const wa = profile.externalUrls.find((u: unknown) => typeof u === 'string' && (u.includes('wa.me') || u.includes('whatsapp.com')));
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

            // Extração de posts recentes para curadoria de produtos e métricas
            let rawPosts: InstagramRawPost[] = [];
            if (Array.isArray(profile.latestPosts) && profile.latestPosts.length > 0) {
              rawPosts = profile.latestPosts;
            } else if (items.length > 1) {
              rawPosts = (items as unknown as InstagramRawPost[]).filter((it) => it.displayUrl);
            }

            let totalLikes = 0;
            let totalComments = 0;
            let countedPosts = 0;
            let imgCount = 0;
            let vidCount = 0;
            let sidecarCount = 0;

            for (const post of rawPosts) {
              const likes = Number(post.likesCount || post.likes || post.edge_liked_by?.count || 0);
              const comments = Number(post.commentsCount || post.comments || post.edge_media_to_comment?.count || 0);
              totalLikes += likes;
              totalComments += comments;
              countedPosts++;

              const pType = (post.type || '').toLowerCase();
              if (pType.includes('video') || pType.includes('reel')) vidCount++;
              else if (pType.includes('sidecar') || pType.includes('carousel')) sidecarCount++;
              else imgCount++;
            }

            const avgLikes = countedPosts > 0 ? Math.round(totalLikes / countedPosts) : 0;
            const avgComments = countedPosts > 0 ? Math.round(totalComments / countedPosts) : 0;
            const engagementRate = followers > 0 && countedPosts > 0
              ? Number((((avgLikes + avgComments) / followers) * 100).toFixed(2))
              : 0;

            const totalTracked = countedPosts || 1;
            metrics = {
              followersCount: followers,
              followsCount: follows,
              postsCount: posts,
              avgLikes,
              avgComments,
              engagementRate,
              formatsBreakdown: {
                images: `${Math.round((imgCount / totalTracked) * 100)}%`,
                reels: `${Math.round((vidCount / totalTracked) * 100)}%`,
                carousels: `${Math.round((sidecarCount / totalTracked) * 100)}%`
              }
            };

            candidatePosts = rawPosts
              .filter((p) => p && p.displayUrl && (p.type === 'Image' || p.type === 'Sidecar' || !p.type))
              .slice(0, 12)
              .map((p, idx: number) => {
                const rawCaption = (p.caption || '').replace(/\r?\n/g, ' ').trim();
                const safeUrl = `https://wsrv.nl/?url=${encodeURIComponent(p.displayUrl || '')}&output=jpg&w=800&q=80`;
                return {
                  index: idx + 1,
                  caption: rawCaption.slice(0, 250),
                  hashtags: Array.isArray(p.hashtags) ? p.hashtags.slice(0, 6) : [],
                  url: safeUrl,
                  likes: Number(p.likesCount || p.likes || 0),
                  comments: Number(p.commentsCount || p.comments || 0)
                };
              });

          } else {
            const pageText = (items[0] as unknown as { text?: string }).text || '';
            scrapedData = `Texto da página: ${pageText}`;
            mainImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop"; 
            profileData = {
              username: 'site',
              fullName: 'Website',
              biography: pageText.slice(0, 200),
              businessCategoryName: 'Website',
              profilePicUrl: mainImageUrl,
              isVerified: false,
              isBusinessAccount: false,
              externalUrls: []
            };
          }
        }
      } catch (err: unknown) {
        console.error("Erro no Apify:", err);
        throw new Error("Falha na extração de dados do Apify");
      }
    } else {
      // Mock Fallback para ambiente local/desenvolvimento
      profileData = {
        username: "florar.atelier",
        fullName: "Florar Atelier",
        biography: "Lembrancinhas, bolsas, decoração. O crochê de uma forma diferente, pra você!\nChame no direct, envios para todo Brasil 📦🇧🇷",
        businessCategoryName: "Artesanato / Crochê",
        profilePicUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1080&auto=format&fit=crop",
        isVerified: false,
        isBusinessAccount: true,
        externalUrls: ["https://wa.me/5511999999999"]
      };

      metrics = {
        followersCount: 14820,
        followsCount: 642,
        postsCount: 184,
        avgLikes: 342,
        avgComments: 28,
        engagementRate: 2.50,
        formatsBreakdown: {
          images: "45%",
          reels: "35%",
          carousels: "20%"
        }
      };

      scrapedData = `Nome da Marca: Florar Atelier (@florar.atelier)\nNicho/Categoria: Artesanato / Crochê\nBiografia (Bio): Lembrancinhas, bolsas, decoração. O crochê de uma forma diferente, pra você!\nChame no direct, envios para todo Brasil 📦🇧🇷\nSeguidores: 14.820 | Seguindo: 642 | Posts: 184\nEngajamento Médio: 2.50% (342 curtidas, 28 comentários por post)`;
      mainImageUrl = profileData.profilePicUrl;
      candidatePosts = [
        {
          index: 1,
          caption: "Oiii pessoal !!! Venho aqui hoje pedir ajuda de vocês para comprar a cadeira de rodas para minha mãe...",
          hashtags: ["ajuda", "familia"],
          url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop",
          likes: 210,
          comments: 42
        },
        {
          index: 2,
          caption: "Novo modelo de lembrança disponível 🕊✨️ A mandala espírito santo, perfeita para decorar o seu lar ou presentes para batismo!",
          hashtags: ["lembrancinhaspersonalizadas", "crochet", "feitoamao"],
          url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800&auto=format&fit=crop",
          likes: 480,
          comments: 39
        },
        {
          index: 3,
          caption: "A bolsa Angel é aquela mistura de elegância, estilo e confiança. Peça exclusiva em crochê feita à mão.",
          hashtags: ["bolsadecroche", "crochetbag", "feitoamao"],
          url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop",
          likes: 520,
          comments: 45
        },
        {
          index: 4,
          caption: "Mais uma case de celular que saiu por aqui na Florar, e posso garantir que ficou linda e protege com charme!",
          hashtags: ["casecroche", "acessoriosartesanais"],
          url: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?q=80&w=800&auto=format&fit=crop",
          likes: 290,
          comments: 18
        },
        {
          index: 5,
          caption: "Trazendo vocês comigo para uma tarde de balé, espero que gostem 🩰✨",
          hashtags: ["bale", "lifestyle"],
          url: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=800&auto=format&fit=crop",
          likes: 180,
          comments: 12
        },
        {
          index: 6,
          caption: "Lembrancinha de coração em fio de malha atualizada com todo carinho para seu evento!",
          hashtags: ["lembrancinhas", "crochet"],
          url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800&auto=format&fit=crop",
          likes: 370,
          comments: 26
        }
      ];
    }

    const cleanWhatsappUrl = detectedWhatsapp.startsWith('http')
      ? detectedWhatsapp
      : (detectedWhatsapp ? `https://wa.me/${detectedWhatsapp}` : 'https://wa.me/55SEUNUMERO');

    let aiResult: Record<string, unknown>;

    if (ai) {
      const safeLogoUrl = mainImageUrl.startsWith('https://wsrv.nl')
        ? mainImageUrl
        : `https://wsrv.nl/?url=${encodeURIComponent(mainImageUrl)}&output=png`;

      const postsContext = candidatePosts.length > 0
        ? `POSTS RECENTES EXTRAÍDOS DO INSTAGRAM DA MARCA:\n` +
          candidatePosts.map(p => `[POST #${p.index}]:\n- Legenda: "${p.caption}"\n- Hashtags: [${p.hashtags.join(', ')}]\n- URL da Imagem: ${p.url}`).join('\n\n')
        : 'Nenhum post recente extraído.';

      const stackInstructionForPrompt = outputStack === 'nextjs' ? `
          * STACK TÉCNICA QUE A IA DEVE ENTREGAR: Next.js (App Router) em TypeScript ('use client'), com Tailwind CSS e ícones da biblioteca lucide-react, pronto para colar diretamente em "src/app/page.tsx".
      ` : `
          * STACK TÉCNICA OBRIGATÓRIA (PROJETO MODULAR EM 3 ARQUIVOS):
          A IA deve entregar o projeto separado claramente em 3 ARQUIVOS COMPLETOS e funcionais:
          1. "index.html": Estrutura semântica HTML5 completa, linkando "style.css" no <head> e "script.js" antes de </body>.
          2. "style.css": Estilização moderna, 100% responsiva (Mobile-First), com variáveis CSS (:root) usando a cor da marca recomendada, tipografia do Google Fonts, efeitos hover refinados e botão flutuante de WhatsApp com animação de pulso.
          3. "script.js": Código JavaScript Vanilla moderno contendo menu hambúrguer mobile responsivo (com abrir/fechar suave), accordion de FAQ interativo com transições e rolagem suave para âncoras.
      `;

      const prompt = adType === 'profile_summary' ? `
        Você é um Estrategista Chefe de Marketing Digital e Consultor Especialista em Instagram, Branding e Conversão.
        Analise com rigor os dados reais deste perfil e elabore um DIAGNÓSTICO ESTRATÉGICO COMPLETO (Raio-X do Perfil).

        DADOS DO PERFIL:
        ---
        Nome: ${profileData.fullName} (@${profileData.username})
        Nicho Declarado: ${profileData.businessCategoryName || 'Não especificado'}
        Biografia Atual: "${profileData.biography}"
        Seguidores: ${metrics.followersCount}
        Seguindo: ${metrics.followsCount}
        Total de Publicações: ${metrics.postsCount}
        Média de Curtidas Recentes: ${metrics.avgLikes}
        Média de Comentários Recentes: ${metrics.avgComments}
        Taxa Estimada de Engajamento: ${metrics.engagementRate}%
        WhatsApp/Link Detectado: ${cleanWhatsappUrl}
        ---

        ${postsContext}

        SUA MISSÃO:
        1. "score": Avalie a conta de 0 a 100 de forma honesta e fundamentada.
           Atribua "scoreLabel": "Excelente" (85-100), "Bom Potencial" (70-84), "Regular" (50-69) ou "Precisa de Atenção" (<50).
           Defina "scoreBreakdown" com notas de 0 a 100 para:
           - "bioClarity": Clareza da bio e proposta de valor
           - "engagementHealth": Saúde da taxa de engajamento e interação
           - "commercialReadiness": Facilidade para o seguidor comprar/entrar em contato
           - "contentVisual": Consistência e apelo visual dos posts
        2. "niche":
           - "main": Nicho principal
           - "sub": Subnicho específico
           - "positioning": Proposta única de valor e posicionamento de mercado em 1 a 2 frases impactantes
        3. "targetAudience":
           - "persona": Descrição da persona ideal (idade aproximada, estilo de vida, motivações)
           - "painPoints": Array com 3 dores ou dúvidas frequentes que esse público possui
           - "desires": Array com 2 a 3 desejos ou aspirações que o produto/serviço realiza
        4. "brandVoice": Tom de voz e personalidade ideal da marca (ex: Acolhedor, sofisticado, autoritário, divertido)
        5. "bioAudit":
           - "currentStatus": Diagnóstico honesto da biografia atual (o que funciona e onde perde clientes)
           - "strengths": Array com 2 pontos positivos da bio atual
           - "flaws": Array com 2 gargalos/falhas da bio atual
           - "suggestedBios": Array com 3 opções de bios completas e prontas para uso (com quebras de linha '\\n' e emojis estratégicos):
             * { "style": "Foco em Conversão & Vendas", "text": "..." }
             * { "style": "Foco em Autoridade & Posicionamento", "text": "..." }
             * { "style": "Minimalista & Sofisticada", "text": "..." }
        6. "strengths": Array com 3 a 4 pontos fortes marcantes observados na conta
        7. "opportunities": Array com 3 a 4 oportunidades / erros críticos onde a conta está deixando dinheiro na mesa
        8. "actionPlan": Array com 3 passos práticos para os próximos 7 dias:
           * { "period": "Dias 1 - 2", "title": "Título da ação", "description": "O que fazer na prática" }
           * { "period": "Dias 3 - 4", "title": "Título da ação", "description": "O que fazer na prática" }
           * { "period": "Dias 5 - 7", "title": "Título da ação", "description": "O que fazer na prática" }

        Retorne EXATAMENTE um objeto JSON válido seguindo esta estrutura, sem qualquer formatação ou texto adicional fora do JSON.
      ` : adType === 'landing_prompt' ? `
        Você é um Engenheiro de Prompts Especialista em Marketing e Desenvolvimento Web.
        
        DADOS DA MARCA:
        ---
        ${scrapedData}
        ---

        ${postsContext}

        SUA MISSÃO:
        1. CURADORIA INTELIGENTE ANTI-OFFTOPIC:
           Analise rigorosamente as legendas e o conteúdo de cada post recente listado acima:
           - SELECIONE de 3 a 4 posts que sejam ESTRITAMENTE sobre PRODUTOS, PEÇAS AUTORAIS, SERVIÇOS OU TRABALHOS COMERCIAIS da marca (relacionados ao nicho ${scrapedData}).
           - É TERMINANTEMENTE PROIBIDO selecionar posts de:
             * Pedidos de ajuda, vaquinhas, doações ou assuntos pessoais/familiares.
             * Fotos pessoais, selfies sem produto, fotos de família ou momentos privados.
             * Memes, piadas soltas ou conteúdos de humor que não apresentem produtos reais.
             * Passeios, viagens, vlogs ou hobbies pessoais (ex: passeios, aulas de balé).
             * Avisos operacionais sem foto de produto (ex: feriados, recesso).
           - Se não houver posts suficientes de produtos, complemente com produtos do nicho de alta qualidade.

           Para cada foto aprovada na curadoria, defina:
           - "role": "hero" (a peça mais marcante e bonita para o banner de destaque principal) OU "product_1", "product_2", "product_3"
           - "title": Nome comercial atraente para o produto com base na legenda (ex: "Mandala Espírito Santo", "Bolsa Angel em Crochê", "Case Artesanal para Celular")
           - "description": Breve frase persuasiva destacando o benefício/charme da peça
           - "url": A URL exata da imagem selecionada

        2. GERAR O SUPER PROMPT (COMANDO DE TEXTO PARA COPIAR E COLAR):
           🚨 ATENÇÃO CRÍTICA: Você NÃO DEVE gerar o código aqui! Você é um GERADOR DE PROMPTS!
           O campo "landingPagePrompt" deve ser um TEXTO DE COMANDO rico e ultra estruturado, começando com "Atue como um Engenheiro Frontend Sênior e Copywriter de Alta Conversão...", que o usuário vai copiar do SocialSpark e colar em um chat de IA (como ChatGPT, Claude ou v0) para pedir que ELES gerem o código.

           O Super Prompt que você vai redigir DEVE conter de forma clara e organizada:
           a) O papel/persona da IA desenvolvedora ("Atue como...").
           b) O contexto da marca: Nome, nicho, biografia e link oficial (${url}).
           c) A paleta de cores recomendada (código HEX).
           d) GESTÃO DE IMAGENS E ASSETS (SEM URLs EXTERNAS NO CÓDIGO):
              Ordene expressamente à IA desenvolvedora que o usuário já baixou o pacote oficial de imagens do SocialSpark e os arquivos estarão descompactados na pasta local "assets/".
              Portanto, no código gerado, ela DEVE utilizar EXCLUSIVAMENTE caminhos locais relativos, evitando URLs externas quebradas:
              - Logo da marca: "assets/logo.png" (na Navbar e Rodapé)
              - Foto de destaque do Hero: "assets/hero.jpg"
              - Fotos dos produtos no catálogo: "assets/produto_1.jpg", "assets/produto_2.jpg", "assets/produto_3.jpg", associadas aos respectivos títulos e descrições aprovados na curadoria.
              - PROÍBA terminantemente o uso de URLs externas longas ou placeholders genéricos.
           e) A estratégia completa de WhatsApp:
              - Número/Link oficial do WhatsApp: "${cleanWhatsappUrl}".
              - Botão Flutuante do WhatsApp fixo no canto inferior direito com pulso.
              - Botão de CTA no Hero: "Fazer Pedido no WhatsApp".
              - Botão de CTA em cada card de produto: abrindo o WhatsApp com mensagem personalizada citando o nome da peça (ex: "${cleanWhatsappUrl}?text=Ol%C3%A1!%20Gostei%20do(a)%20[NOME_DO_PRODUTO]%20e%20gostaria%20de%20fazer%20uma%20encomenda.").
           f) A exigência técnica da stack:
              ${stackInstructionForPrompt}
           g) A estrutura esperada da página: Navbar, Hero, Seção de Diferenciais, História da Marca, Catálogo com produtos e fotos locais ("assets/..."), FAQ com accordion, Banner CTA final e Rodapé.
           h) Instrução expressa para que a IA entregue os arquivos completos (sem código omitido ou minificado), claramente demarcados com comentários (<!-- index.html -->, /* style.css */, // script.js).

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
          "landingPagePrompt": "Texto completo do Super Prompt (começando com 'Atue como...' e com todas as instruções detalhadas para o ChatGPT/Claude)"
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

      const candidateModels = [
        'gemini-3.5-flash',
        'gemini-flash-lite-latest',
        'gemini-3.6-flash',
        'gemini-3.8-flash'
      ];

      let response = null;
      let lastErrorMessage = '';

      for (const modelName of candidateModels) {
        try {
          console.log(`Tentando Gemini com o modelo ${modelName}...`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          if (response?.text) {
            console.log(`Sucesso com o modelo ${modelName}!`);
            break;
          }
        } catch (err: unknown) {
          lastErrorMessage = err instanceof Error ? err.message : String(err);
          console.warn(`Modelo ${modelName} falhou:`, lastErrorMessage.slice(0, 100));
          // Se for 429 (quota), 503 (servidor ocupado) ou 404, continua imediatamente para o próximo modelo candidato
          continue;
        }
      }

      if (response?.text) {
        aiResult = JSON.parse(response.text) as Record<string, unknown>;
        aiResult.imageUrl = ""; 
        aiResult.adType = adType;
        aiResult.profile = profileData;
        aiResult.metrics = metrics;
        if (!aiResult.brandColor) {
          aiResult.brandColor = "#d97706";
        }
        if (!aiResult.logoUrl) {
          aiResult.logoUrl = safeLogoUrl;
        }
      } else {
        console.warn("Todos os modelos de IA falharam ou atingiram a cota. Usando fallback inteligente baseado nos dados reais extraídos.");
        aiResult = buildSmartFallback(adType, profileData, metrics, candidatePosts, safeLogoUrl, cleanWhatsappUrl, outputStack, url);
        aiResult.quotaNotice = "Cota gratuita do Gemini temporariamente atingida. Exibindo estimativa inteligente gerada para a sua marca.";
      }
      
    } else {
      console.log("Nenhuma chave do Gemini encontrada. Usando dados simulados.");
      const safeLogo = mainImageUrl.startsWith('https://wsrv.nl')
        ? mainImageUrl
        : `https://wsrv.nl/?url=${encodeURIComponent(mainImageUrl)}&output=png`;

      aiResult = buildSmartFallback(adType, profileData, metrics, candidatePosts, safeLogo, cleanWhatsappUrl, outputStack, url);
    }

    return NextResponse.json({
      success: true,
      data: aiResult
    });

  } catch (error: unknown) {
    let errMsg = error instanceof Error ? error.message : 'Erro interno';
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
      errMsg = "Limite temporário de requisições da IA atingido (Rate Limit 429). Por favor, aguarde cerca de 30 segundos e tente novamente!";
    } else if (errMsg.includes('503')) {
      errMsg = "Os servidores do Google Gemini estão com alta demanda no momento. Aguarde alguns segundos e tente novamente!";
    }
    console.error("Erro na rota de análise:", error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

function buildSmartFallback(
  adType: string,
  profileData: {
    username: string;
    fullName: string;
    biography: string;
    businessCategoryName: string;
    profilePicUrl: string;
    isVerified: boolean;
    isBusinessAccount: boolean;
    externalUrls: string[];
  },
  metrics: {
    followersCount: number;
    followsCount: number;
    postsCount: number;
    avgLikes: number;
    avgComments: number;
    engagementRate: number;
    formatsBreakdown: { images: string; reels: string; carousels: string };
  },
  candidatePosts: Array<{ index: number; caption: string; hashtags: string[]; url: string; likes?: number; comments?: number }>,
  safeLogoUrl: string,
  cleanWhatsappUrl: string,
  outputStack: string,
  url: string
): Record<string, unknown> {
  const brandName = profileData.fullName || profileData.username || 'Sua Marca';
  const category = profileData.businessCategoryName || 'Artesanato & Produtos';
  const isCrochetMock = (profileData.username || '').includes('florar') || !profileData.username;

  const curatedImages = candidatePosts.length > 0 ? candidatePosts.slice(0, 4).map((p, idx) => ({
    role: idx === 0 ? "hero" : `product_${idx}`,
    title: p.caption ? p.caption.slice(0, 40).replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim() || `Produto ${idx + 1}` : `Produto ${idx + 1}`,
    description: p.caption ? p.caption.slice(0, 80) : "Peça autoral com acabamento exclusivo.",
    url: p.url
  })) : [
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

  if (adType === 'profile_summary') {
    return {
      adType: 'profile_summary',
      score: metrics.engagementRate >= 2.0 ? 84 : 74,
      scoreLabel: metrics.engagementRate >= 2.0 ? 'Excelente Potencial' : 'Bom Potencial',
      scoreBreakdown: {
        bioClarity: profileData.biography ? 78 : 55,
        engagementHealth: metrics.engagementRate >= 2.0 ? 88 : 70,
        commercialReadiness: cleanWhatsappUrl.includes('55') ? 80 : 60,
        contentVisual: 86,
      },
      niche: {
        main: category,
        sub: isCrochetMock ? "Crochê Contemporâneo e Lembrancinhas Personalizadas" : `${category} / Criação Autoral`,
        positioning: `Produtos autorais de alto valor percebido que conectam afeto, sofisticação e atendimento direto para ${brandName}.`
      },
      targetAudience: {
        persona: `Clientes e admiradores de ${category.toLowerCase()} que valorizam autenticidade, qualidade e atendimento próximo.`,
        painPoints: [
          "Dificuldade de encontrar produtos autênticos e de qualidade garantida.",
          "Insegurança com prazos e atendimento lento.",
          "Falta de clareza sobre como encomendar modelos e orçamentos personalizados."
        ],
        desires: [
          "Experiência de compra humana, rápida e personalizada.",
          "Produtos com acabamento impecável para o dia a dia ou momentos marcantes."
        ]
      },
      brandVoice: "Acolhedor, profissional, próximo e focado em excelência e transparência.",
      bioAudit: {
        currentStatus: profileData.biography
          ? `A bio atual comunica a essência da marca, mas pode ser otimizada com chamada direta para ação (CTA) e link clicável.`
          : `O perfil necessita de uma biografia mais estruturada com proposta de valor clara e link de contato.`,
        strengths: [
          `Identifica a marca claramente como ${brandName}`,
          profileData.biography ? "Apresenta proposta inicial de produtos" : "Nome e presença comercial ativa"
        ],
        flaws: [
          "Chamada para ação no direct aumenta a fricção (WhatsApp direto converte até 3x mais)",
          "Falta de uma frase de promessa única memorável"
        ],
        suggestedBios: [
          {
            style: "Foco em Conversão & Vendas",
            text: `✨ O melhor em ${category.toLowerCase()} para você e seu momento\n⭐ Peças e produtos selecionados com excelência\n📦 Encomendas com atendimento personalizado 🇧🇷\n👇 Faça seu pedido direto no WhatsApp:`
          },
          {
            style: "Foco em Autoridade & Sofisticação",
            text: `🤍 Qualidade, acabamento impecável e design autoral\n✨ ${brandName} — Transformando ideias em realidade\n🚀 Atendimento exclusivo e envios garantidos\n👇 Toque no link abaixo e fale conosco:`
          },
          {
            style: "Minimalista & Direta",
            text: `🌿 ${category} com proposta autoral e acabamento de alto padrão.\n✈️ Entregas e encomendas para todo o Brasil.\n👇 Clique abaixo para fazer seu pedido:`
          }
        ]
      },
      strengths: [
        `Base sólida de seguidores (${metrics.followersCount.toLocaleString('pt-BR')}) com taxa de engajamento ativa (${metrics.engagementRate}%).`,
        "Presença visual consistente nos posts recentes com bom apelo de produto.",
        "Potencial comercial expressivo para alavancar vendas via WhatsApp e Landing Page."
      ],
      opportunities: [
        "Inserir botão ou link direto para o WhatsApp na bio para não perder orçamentos quentes.",
        "Aumentar a frequência de publicações no formato Reels com vídeos curtos de bastidores.",
        "Fixar destaques de Prova Social com depoimentos e feedbacks reais de clientes."
      ],
      actionPlan: [
        {
          period: "Dias 1 - 2",
          title: "Atualizar Biografia & Link Direto",
          description: "Substitua a bio atual pela opção focada em conversão e posicione o link do WhatsApp com mensagem pré-configurada."
        },
        {
          period: "Dias 3 - 4",
          title: "Estruturar Destaques de Prova Social",
          description: "Crie destaques organizados: 'Quem Somos', 'Depoimentos', 'Catálogo' e 'Como Comprar'."
        },
        {
          period: "Dias 5 - 7",
          title: "Publicar Conteúdo com CTA de Venda",
          description: "Gere um carrossel educativo ou anúncio no SocialSpark e convide a audiência para chamar no WhatsApp."
        }
      ],
      profile: profileData,
      metrics: metrics,
      brandColor: "#d97706",
      logoUrl: safeLogoUrl
    };
  }

  if (adType === 'landing_prompt') {
    return {
      brandColor: "#e11d48",
      logoUrl: safeLogoUrl,
      whatsapp: cleanWhatsappUrl,
      outputStack: outputStack,
      curatedImages: curatedImages,
      landingPagePrompt: outputStack === 'nextjs'
        ? `Atue como um Engenheiro Frontend Sênior especializado em Next.js e crie um componente React completo ('use client', TypeScript, Tailwind CSS, lucide-react) para ser colado em "src/app/page.tsx". Marca: ${brandName} (${url}). WhatsApp: ${cleanWhatsappUrl}. As imagens oficiais já foram baixadas na pasta local "/assets/". Use a logo: <img src="/assets/logo.png" alt="Logo" class="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-white" /> no Header e Rodapé. No Hero, use a foto: <img src="/assets/hero.jpg" alt="Destaque" class="rounded-3xl shadow-xl object-cover" />. Nos cards, use as fotos locais (/assets/produto_1.jpg, /assets/produto_2.jpg, /assets/produto_3.jpg) com CTAs para WhatsApp. Inclua o botão flutuante do WhatsApp fixo no canto inferior direito. Código 100% pronto e completo sem omissões.`
        : `Atue como um Engenheiro Frontend Sênior e Copywriter de Alta Conversão.
Crie uma Landing Page moderna, elegante e modular separada em 3 ARQUIVOS COMPLETOS (index.html, style.css e script.js) para a marca ${brandName} (${url}).
Cor principal da marca: #e11d48. WhatsApp oficial: ${cleanWhatsappUrl}.

ORGANIZAÇÃO DOS ARQUIVOS E ASSETS:
O usuário já baixou o pacote de imagens do SocialSpark e descompactou na pasta local "assets/".
🚨 NÃO utilize links externos longos ou placeholders genéricos. Utilize EXCLUSIVAMENTE estes caminhos locais no código:
- Logo oficial: "assets/logo.png" (na Navbar e Rodapé)
- Imagem de Destaque (Hero): "assets/hero.jpg"
- Produtos: "assets/produto_1.jpg", "assets/produto_2.jpg", "assets/produto_3.jpg"

ESTRUTURA DOS 3 ARQUIVOS QUE VOCÊ DEVE ENTREGAR:

1. \`index.html\`:
- Estrutura semântica HTML5 completa, linkando "style.css" no <head> e "script.js" antes de </body>.
- Navbar com logo "assets/logo.png", links de navegação com âncoras e botão CTA para o WhatsApp.
- Banner Hero com headline de alta conversão, imagem "assets/hero.jpg", benefícios e botão "Fazer Pedido no WhatsApp".
- Seção de Diferenciais competitivos da marca.
- Catálogo com cards contendo as fotos locais ("assets/produto_1.jpg", etc.), títulos e botões de pedido no WhatsApp (${cleanWhatsappUrl}?text=...).
- Seção Sobre a Marca, FAQ com accordion e Rodapé completo.
- Botão flutuante do WhatsApp fixo no canto inferior direito.

2. \`style.css\`:
- Reset CSS moderno e variáveis (:root) com a cor primária (#e11d48) e paleta harmoniosa.
- Layout 100% responsivo (Mobile-First com media queries limpas).
- Tipografia sofisticada do Google Fonts.
- Efeitos hover elegantes nos botões e cards.
- Animação de pulso no botão do WhatsApp.

3. \`script.js\`:
- Menu mobile responsivo com botão hambúrguer (abrir/fechar suave).
- Accordion de FAQ interativo com transição suave.
- Rolagem suave (smooth scroll) para âncoras.

Entregue o código 100% completo dos 3 arquivos demarcados claramente com comentários (<!-- index.html -->, /* style.css */ e // script.js), sem qualquer parte omitida.`,
      adType: 'landing_prompt',
      profile: profileData,
      metrics: metrics
    };
  }

  if (adType === 'carousel') {
    return {
      brandColor: "#059669",
      logoUrl: safeLogoUrl,
      caption: `Descubra como ${brandName} pode transformar o seu dia a dia com soluções únicas e exclusivas! ✨ Acesse o link da bio para conferir.`,
      carousel: [
        { title: `Bem-vindo à ${brandName}`, text: "Qualidade, exclusividade e atenção a cada detalhe feito para você." },
        { title: "Nossos Diferenciais", text: "Atendimento dedicado, materiais selecionados e compromisso total com a sua satisfação." },
        { title: "Faça seu Pedido", text: "Entre em contato conosco pelo WhatsApp ou direct para garantir o seu!", cta: "Falar no WhatsApp" }
      ],
      adType: 'carousel',
      profile: profileData,
      metrics: metrics
    };
  }

  return {
    title: brandName,
    subtitle: profileData.biography || "Qualidade e sofisticação em cada detalhe para você.",
    cta: "Conhecer Agora",
    brandColor: "#2F4F4F",
    logoUrl: safeLogoUrl,
    adType: 'ads',
    profile: profileData,
    metrics: metrics
  };
}
