import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { GoogleGenAI } from '@google/genai';

// Instanciamos os clientes apenas se as chaves existirem
const apifyClient = process.env.APIFY_API_TOKEN ? new ApifyClient({ token: process.env.APIFY_API_TOKEN }) : null;
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { url, adType = 'ads' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    let scrapedData = "";
    let mainImageUrl = "";

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
      scrapedData = `Nome da Marca: Florar Atelier\nNicho/Categoria: Artesanato / Crochê\nBiografia (Bio): Lembrancinhas e mandalas feitas à mão.`;
      mainImageUrl = "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1080&auto=format&fit=crop";
    }

    let aiResult;

    if (ai) {
      const prompt = adType === 'landing_prompt' ? `
        A partir dos dados do perfil desta marca do Instagram:
        ---
        ${scrapedData}
        ---
        Sua tarefa é criar um SUPER PROMPT (um comando pronto) que o usuário possa copiar e colar em outro chat de Inteligência Artificial (como o próprio Gemini ou ChatGPT) para gerar o código e os textos de uma Landing Page completa.
        
        O Prompt que você vai escrever DEVE conter:
        1. A instrução "Atue como um Desenvolvedor Web e Copywriter genial..."
        2. O contexto da marca (Nicho, Bio limpa sem emojis e o Link Oficial: ${url}). Peça para o desenvolvedor usar esse link nos botões e no rodapé.
        3. A cor principal (escreva o código HEX que você escolher para o desenvolvedor usar no CSS). NÃO insira a URL da logo, apenas escreva para o desenvolvedor usar um espaço reservado tipo src="logo.png".
        4. A estrutura obrigatória que a Landing Page deve ter: Cabeçalho (Hero), Sobre a marca, Benefícios/Motivos para comprar, e FAQ.
        5. O tom de voz sugerido para a marca.
        
        Retorne EXATAMENTE um objeto JSON válido:
        {
          "brandColor": "Um código HEX de cor que combine com o nicho",
          "logoUrl": "${mainImageUrl}",
          "landingPagePrompt": "O super prompt completo (texto grande) para o usuário copiar"
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
      aiResult = {
        title: "Moda Sustentável",
        subtitle: "Vestidos de verão feitos à mão. Leveza e estilo para seus dias quentes.",
        cta: "Ver Coleção",
        brandColor: "#2F4F4F", // Dark Slate Gray (Combina com a descrição sustentável/verde)
        imageUrl: mainImageUrl
      };
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
