import React from 'react';
import { Calendar, User, Sparkles, ExternalLink, MessageCircle } from 'lucide-react';
import { ClinicProfile } from '../types/index.ts';
import { getWhatsAppGeneralChatUrl } from '../lib/whatsapp.ts';

interface NavbarProps {
  profile: ClinicProfile;
  activeView: 'client' | 'admin';
  setActiveView: (view: 'client' | 'admin') => void;
  onOpenAdminLogin: () => void;
  isLoggedIn: boolean;
  onOpenBooking: () => void;
  isSupabaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeView,
  setActiveView,
  onOpenAdminLogin,
  isLoggedIn,
  onOpenBooking,
  isSupabaseConnected,
}) => {
  const whatsappUrl = getWhatsAppGeneralChatUrl(profile.whatsappNumber, profile.name);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('client')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors">
              {profile.name.split('·')[0].trim() || 'Lumière'}
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs uppercase tracking-widest text-stone-500 font-sans font-light">
              Estética Avançada
            </span>
          </button>
        </div>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
          <button
            onClick={() => {
              setActiveView('client');
              const el = document.getElementById('servicos');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-stone-900 transition-colors cursor-pointer"
          >
            Procedimentos
          </button>
          <button
            onClick={() => {
              setActiveView('client');
              const el = document.getElementById('sobre');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-stone-900 transition-colors cursor-pointer"
          >
            A Clínica
          </button>
          <button
            onClick={() => {
              setActiveView('client');
              const el = document.getElementById('contato');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-stone-900 transition-colors cursor-pointer"
          >
            Localização
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar no WhatsApp</span>
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {activeView === 'admin' ? (
            <button
              onClick={() => setActiveView('client')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              title="Ver página de agendamento online das clientes"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Agendamento Cliente</span>
              <span className="sm:hidden">Cliente</span>
            </button>
          ) : (
            <>
              {isLoggedIn ? (
                <button
                  onClick={() => setActiveView('admin')}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-stone-800 bg-[#EFE9DF] hover:bg-[#E5DDCF] rounded-lg transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Painel de Gestão</span>
                  <span className="sm:hidden">Painel</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAdminLogin}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg transition-colors cursor-pointer"
                  title="Acesso da Esteticista"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Acesso Profissional</span>
                  <span className="sm:hidden">Login</span>
                </button>
              )}

              <button
                onClick={onOpenBooking}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-all hover:shadow cursor-pointer active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agendar Horário</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
