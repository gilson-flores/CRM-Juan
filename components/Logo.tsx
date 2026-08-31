'use client';

import React from 'react';
import { Phone, Instagram, Zap } from 'lucide-react';
import { OfficialLogoSvg } from '@/lib/logoConstant';

interface LogoProps {
  variant?: 'full' | 'compact' | 'horizontal';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ variant = 'full', className = '', size = 'md' }: LogoProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-[#0e0e11] border border-[#FF7A00]/40 flex items-center justify-center shadow-lg shadow-[#FF7A00]/10 shrink-0 relative overflow-hidden p-0.5">
          <OfficialLogoSvg className="w-full h-full object-contain rounded-lg" />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-sm uppercase tracking-wider text-white leading-none">
            JC ELETRICISTA
          </span>
          <span className="text-[10px] text-[#FF7A00] font-medium tracking-wide leading-tight mt-0.5">
            residencial / comercial
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-4 bg-[#0a0a0a] p-3 rounded-xl border border-zinc-800/80 shadow-md ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-black border border-[#FF7A00]/50 flex items-center justify-center shadow-inner shrink-0 p-1">
          <OfficialLogoSvg className="w-full h-full object-contain rounded-lg" />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-base uppercase tracking-tight text-white leading-none">
            ELETRICISTA
          </span>
          <span className="text-xs text-[#FF7A00] font-medium tracking-normal mt-0.5">
            residencial / comercial
          </span>
          <span className="text-[10px] text-zinc-400 mt-1 flex items-center gap-2">
            <span>(47) 99706-4183</span>
            <span>•</span>
            <span>@jc_eletricistajoinville</span>
          </span>
        </div>
      </div>
    );
  }

  // Full badge version mirroring the official logo image
  return (
    <div className={`relative flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-[#0f0f0f] via-[#090909] to-[#040404] border border-zinc-800/90 shadow-2xl shadow-black select-none text-center overflow-hidden ${className}`}>
      {/* Background subtle brush texture effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,122,0,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,#fff_25%,transparent_25%,transparent_50%,#fff_50%,#fff_75%,transparent_75%,transparent)] bg-[length:8px_8px] pointer-events-none" />

      {/* Main Official Logo Image / SVG */}
      <div className="relative mb-2 flex items-center justify-center w-full max-w-[210px] aspect-square rounded-2xl overflow-hidden border border-[#222228] bg-[#09090c] shadow-lg shadow-black/60 p-2">
        <OfficialLogoSvg className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(255,122,0,0.25)]" />
      </div>

      {/* Contact Info */}
      <div className="flex flex-col items-center gap-1.5 text-xs text-white font-medium mt-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FF7A00]/20 flex items-center justify-center text-[#FF7A00]">
            <Phone size={10} className="fill-current" />
          </div>
          <span className="tracking-wide text-zinc-100 font-bold">47 99706-4183</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FF7A00]/20 flex items-center justify-center text-[#FF7A00]">
            <Instagram size={10} />
          </div>
          <span className="tracking-wide text-zinc-300 text-[11px]">jc_eletricistajoinville</span>
        </div>
      </div>

      {/* Bottom Slogan */}
      <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 w-full">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#FF7A00]">
          QUALIDADE • SEGURANÇA • CONFIANÇA
        </p>
      </div>
    </div>
  );
}

