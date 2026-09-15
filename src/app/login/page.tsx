'use client';

import React from 'react';
import { Sparkles, Wand2, Image as ImageIcon, Rocket } from 'lucide-react';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Lado Esquerdo - Decorativo (Escondido em telas pequenas) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gray-900 text-white p-12 relative overflow-hidden">
        {/* Efeitos de Fundo Blur */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 -right-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-40 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-16 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">S</div>
            <span className="text-2xl font-bold tracking-tight">SocialSpark</span>
          </Link>
          
          <h1 className="text-5xl font-black tracking-tight leading-tight mb-6">
            A Faísca que Faltava <br/>
            no seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Marketing.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-md leading-relaxed">
            Transforme qualquer perfil do Instagram em uma máquina de vendas com a nossa Inteligência Artificial.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4 bg-gray-800/50 p-4 rounded-2xl backdrop-blur-sm border border-gray-700/50">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Wand2 size={24} /></div>
            <div>
              <h3 className="font-bold">Copys Persuasivas</h3>
              <p className="text-sm text-gray-400">Legendas prontas com foco em conversão.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-gray-800/50 p-4 rounded-2xl backdrop-blur-sm border border-gray-700/50">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><ImageIcon size={24} /></div>
            <div>
              <h3 className="font-bold">Design Automático</h3>
              <p className="text-sm text-gray-400">Anúncios e Carrosséis desenhados para você.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-gray-800/50 p-4 rounded-2xl backdrop-blur-sm border border-gray-700/50">
            <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400"><Rocket size={24} /></div>
            <div>
              <h3 className="font-bold">Landing Pages</h3>
              <p className="text-sm text-gray-400">Prompts de engenharia reversa para sites.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login Clerk */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 bg-gray-50">
        <div className="text-center mb-8 lg:hidden">
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">S</div>
              <span className="text-2xl font-bold tracking-tight text-gray-900">SocialSpark</span>
            </div>
        </div>
        <SignIn routing="hash" forceRedirectUrl="/" />
      </div>
    </div>
  );
}
