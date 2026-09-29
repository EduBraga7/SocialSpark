# SocialSpark ✨

O **SocialSpark** é uma aplicação SaaS (Software as a Service) alimentada por Inteligência Artificial projetada para transformar qualquer perfil do Instagram em ativos de marketing de alta conversão. Com apenas o link de um perfil, a plataforma analisa o conteúdo, extrai a identidade visual e gera automaticamente anúncios, carrosséis educativos e prompts complexos para Landing Pages.

## 🚀 Funcionalidades

- **Extração de Identidade Visual (Scraping):** Utiliza Apify para varrer o perfil do Instagram, extraindo biografia, nicho, URL da logo e calculando a paleta de cores dominante usando `color-thief-node`.
- **Geração Dinâmica de Imagens (Satori):** Converte HTML/CSS puro em imagens de alta qualidade instantaneamente no servidor usando Vercel Satori. Dispensa o uso de canvas lentos no frontend.
- **Integração com IA Generativa (Gemini):** Analisa a biografia do perfil com o modelo `gemini-1.5-flash` para elaborar copies persuasivas (títulos, subtítulos e CTA) focadas em conversão.
- **Exportação em Massa (JSZip):** Permite o download de múltiplos assets gerados (como os 3 slides de um carrossel educativo) empacotados em um único arquivo ZIP direto no lado do cliente.
- **Sistema de Autenticação (Clerk):** Autenticação moderna e segura utilizando a nova versão (Core 3) do Clerk, incluindo integração nativa com o Google OAuth.
- **Banco de Dados Serverless (Neon + Prisma):** Persistência de dados ultra-rápida na nuvem usando PostgreSQL Serverless da Neon via Prisma ORM, preparado para salvar históricos de gerações de usuários.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Next.js 14/15 (App Router), React, Tailwind CSS, Lucide Icons.
- **Backend/APIs:** Next.js Route Handlers (`/api`), Vercel Satori (Renderização de Imagem SVG/PNG).
- **Inteligência Artificial:** Google Gemini API (`gemini-1.5-flash`).
- **Web Scraping:** Apify API (Instagram Profile Scraper).
- **Banco de Dados & ORM:** PostgreSQL (Neon Tech Serverless) com Prisma ORM.
- **Autenticação:** Clerk (Core 3).
- **Utilitários:** `wsrv.nl` (Bypass de CORS para Imagens CDN), `color-thief-node` (Extração de Cores), `jszip` e `file-saver` (Gerenciamento de Arquivos no Frontend).

## 💡 Desafios Técnicos Resolvidos

1. **Bypass de Proteção CDN do Instagram (CORS):** O Instagram bloqueia hotlinking e requisições diretas de imagens através de referrers estritos. A aplicação resolve isso utilizando um proxy dinâmico de redimensionamento (`wsrv.nl`) para mascarar a requisição e permitir a exibição e o download das fotos de perfil na UI sem estourar erros de CORS.
2. **Concorrência Satori & Layouts Dinâmicos:** Devido à limitação do Satori com nós de texto adjacentes (que quebram com `display: flex`), a estrutura de renderização das imagens na rota `/api/generate-ad` precisou de um trabalho de engenharia de HTML preciso para garantir a alinhamento impecável da UI gerada, incluindo indicadores circulares para Carrosséis (ex: "1/3").
3. **Resiliência da API de Inteligência Artificial:** Foi implementado um mecanismo de tentativas (Retry Pattern) nas chamadas ao Gemini, capturando e lidando de forma transparente com erros transitórios (`503 Service Unavailable` em momentos de pico de demanda) para não frustrar o usuário final.

## ⚙️ Como Executar Localmente

### Pré-requisitos
- Node.js (v18+)
- Conta no [Clerk](https://clerk.com) (Autenticação)
- Conta no [Neon](https://neon.tech) (Banco de Dados PostgreSQL)
- Chaves de API do [Google Gemini](https://aistudio.google.com/) e [Apify](https://apify.com/).

### Passos

1. Clone o repositório:
   ```bash
   git clone https://github.com/EduBraga7/SocialSpark.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env.local` na raiz e preencha com suas variáveis:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   APIFY_API_TOKEN=sua_chave_aqui
   DATABASE_URL=sua_url_neon_aqui
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=sua_chave_clerk_aqui
   CLERK_SECRET_KEY=sua_chave_clerk_aqui
   ```
4. Suba as tabelas do banco de dados:
   ```bash
   npx prisma db push
   ```
5. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:3000`.

---
*Desenvolvido com foco em alta performance, código limpo e experiência do usuário incrível.*
