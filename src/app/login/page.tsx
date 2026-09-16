'use client';

import { SignIn } from '@clerk/nextjs';
import { Zap, Sparkles, ImageIcon, Globe } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Sparkles,
    title: 'Anúncios prontos em segundos',
    desc: 'A IA lê seu perfil e gera imagens para impulsionar no Instagram.',
  },
  {
    icon: ImageIcon,
    title: 'Carrosséis que engajam',
    desc: 'Slides educativos com a identidade visual da sua marca.',
  },
  {
    icon: Globe,
    title: 'Landing Pages sob medida',
    desc: 'Prompts de engenharia reversa para criar seu site com IA.',
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-white">

      {/* ── Lado esquerdo — visual ──────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden bg-gray-950">

        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-gray-950 to-purple-950" />

        {/* Blobs decorativos */}
        <div className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] bg-blue-600 rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[380px] h-[380px] bg-purple-600 rounded-full blur-[120px] opacity-15" />
        <div className="absolute top-[40%] right-[10%] w-[200px] h-[200px] bg-blue-400 rounded-full blur-[80px] opacity-10" />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">SocialSpark</span>
          </Link>

          {/* Headline */}
          <div className="mt-auto mb-auto pt-16">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-4">
              IA para criadores
            </p>
            <h1 className="text-white text-4xl xl:text-5xl font-black leading-tight tracking-tight mb-5">
              A faísca que faltava<br />
              no seu{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                marketing.
              </span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed max-w-sm">
              Cole o link do Instagram da sua marca e nossa IA cria anúncios, carrosséis e landing pages em segundos.
            </p>

            {/* Feature list */}
            <div className="mt-10 space-y-4">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3.5">
                  <div className="mt-0.5 p-2 bg-white/5 border border-white/10 rounded-xl flex-shrink-0">
                    <f.icon size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{f.title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p className="text-gray-600 text-xs mt-auto">
            © 2026 SocialSpark. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* ── Lado direito — formulário ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">

        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">SocialSpark</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo de volta</h2>
            <p className="text-gray-400 text-sm">Entre para continuar criando conteúdo</p>
          </div>

          <SignIn routing="hash" forceRedirectUrl="/" />
        </div>
      </div>
    </div>
  );
}
