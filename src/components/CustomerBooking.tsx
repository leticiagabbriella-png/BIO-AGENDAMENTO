import React, { useState, useMemo } from 'react';
import {
  Clock,
  Sparkles,
  Calendar,
  MessageCircle,
  CheckCircle,
  MapPin,
  ShieldCheck,
  Award,
  Heart,
  ChevronRight,
  Phone,
  Instagram,
  ArrowRight,
} from 'lucide-react';
import { ClinicService, ClinicProfile } from '../types/index.ts';
import { formatBRL, getWhatsAppGeneralChatUrl } from '../lib/whatsapp.ts';
import heroClinicImg from '../assets/images/hero_aesthetic_clinic_1790881725106.jpg';

interface CustomerBookingProps {
  services: ClinicService[];
  clinicProfile: ClinicProfile;
  onSelectServiceToBook: (serviceId: string) => void;
  onOpenGeneralBooking: () => void;
}

export const CustomerBooking: React.FC<CustomerBookingProps> = ({
  services,
  clinicProfile,
  onSelectServiceToBook,
  onOpenGeneralBooking,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  const categories = [
    { id: 'todos', label: 'Todos os Procedimentos' },
    { id: 'injetaveis', label: 'Injetáveis & Harmonização' },
    { id: 'facial', label: 'Estética Facial' },
    { id: 'laser', label: 'Laser & Rejuvenescimento' },
    { id: 'corporal', label: 'Corporal' },
  ];

  const filteredServices = useMemo(() => {
    const active = services.filter((s) => s.active);
    if (selectedCategory === 'todos') return active;
    return active.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const generalWhatsappUrl = getWhatsAppGeneralChatUrl(clinicProfile.whatsappNumber, clinicProfile.name);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-[#ECE6DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-amber-900/80 font-medium">
                <span>{clinicProfile.title}</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-stone-900 font-normal leading-[1.15] text-balance">
                Realce sua beleza natural com ciência, sofisticação e cuidado exclusivo.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl font-light">
                {clinicProfile.bio}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={onOpenGeneralBooking}
                  className="px-7 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Horário Online</span>
                </button>

                <a
                  href={generalWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-emerald-600/10 hover:bg-emerald-600/15 text-emerald-800 font-medium text-sm rounded-xl border border-emerald-600/30 transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Falar no WhatsApp</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-6 border-t border-stone-200/80">
                <div>
                  <span className="block font-serif text-2xl sm:text-3xl text-stone-900 tabular-nums font-medium">
                    +4.800
                  </span>
                  <span className="text-xs text-stone-500 font-light">Atendimentos realizados</span>
                </div>
                <div>
                  <span className="block font-serif text-2xl sm:text-3xl text-stone-900 tabular-nums font-medium">
                    100%
                  </span>
                  <span className="text-xs text-stone-500 font-light">Produtos padrão ouro</span>
                </div>
                <div>
                  <span className="block font-serif text-2xl sm:text-3xl text-stone-900 tabular-nums font-medium">
                    5.0 ★
                  </span>
                  <span className="text-xs text-stone-500 font-light">Avaliação das pacientes</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-4/3 lg:aspect-3/4">
                <img
                  src={heroClinicImg}
                  alt="Espaço da Clínica de Estética"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-amber-300" />
                    <span className="text-xs tracking-wider uppercase font-medium text-stone-200">
                      Ambiente Premium
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-white font-medium">
                    {clinicProfile.name}
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{clinicProfile.address}</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. SERVICES CATALOG SECTION */}
      <section id="servicos" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest text-amber-900/80 font-medium">
            Menu de Procedimentos
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-medium mt-1">
            Protocolos Exclusivos para seu Bem-Estar
          </h2>
          <p className="text-sm sm:text-base text-stone-600 mt-2 font-light">
            Selecione o procedimento para consultar detalhes e agendar diretamente no horário que melhor se adapta à sua rotina.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-[#EFEAE2] text-stone-700 hover:bg-[#E5DFD4]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-[#ECE5DA] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Image Container with Fallback */}
              <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-mono font-medium text-stone-900 shadow-xs">
                  {formatBRL(service.price)}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {service.durationMinutes} minutos
                    </span>
                    <span>·</span>
                    <span className="capitalize">{service.category}</span>
                  </div>

                  <h3 className="font-serif text-xl font-medium text-stone-900 mb-2">
                    {service.name}
                  </h3>

                  <p className="text-xs text-stone-600 leading-relaxed mb-4">
                    {service.description}
                  </p>

                  {/* Benefits */}
                  {service.benefits && service.benefits.length > 0 && (
                    <div className="space-y-1.5 mb-6 pt-3 border-t border-stone-100">
                      {service.benefits.slice(0, 3).map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[12px] text-stone-600">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-400 block">
                      A partir de
                    </span>
                    <span className="text-base font-bold font-mono text-stone-900">
                      {formatBRL(service.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectServiceToBook(service.id)}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>Agendar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CLINIC & PRACTITIONER SHOWCASE */}
      <section id="sobre" className="py-16 bg-[#F3EFE9] border-y border-[#ECE5DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs uppercase tracking-widest text-amber-900/80 font-medium">
                Excelência & Cuidado
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-medium">
                Conheça a {clinicProfile.practitionerName}
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed font-light">
                {clinicProfile.bio}
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-stone-700">
                  <ShieldCheck className="w-5 h-5 text-amber-800 shrink-0" />
                  <span>Protocolos personalizados e produtos regulamentados pela ANVISA.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-700">
                  <Award className="w-5 h-5 text-amber-800 shrink-0" />
                  <span>Tecnologia de última geração para tratamentos sem dor e recuperação rápida.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-700">
                  <Heart className="w-5 h-5 text-amber-800 shrink-0" />
                  <span>Acompanhamento pós-procedimento contínuo e acolhedor via WhatsApp.</span>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={onOpenGeneralBooking}
                  className="px-6 py-3 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Reservar Consulta de Avaliação</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                <h3 className="font-serif text-xl font-medium text-stone-900 pb-3 border-b border-stone-100">
                  Informações de Atendimento
                </h3>

                <div className="space-y-4 text-xs text-stone-600">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-stone-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-stone-800 mb-0.5">Endereço</strong>
                      <span>{clinicProfile.address}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-stone-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-stone-800 mb-0.5">Horários de Atendimento</strong>
                      <span>Segunda a Sexta: 09h às 19h · Sábados: 09h às 15h</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-stone-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-stone-800 mb-0.5">Telefone & WhatsApp</strong>
                      <span>{clinicProfile.phone}</span>
                    </div>
                  </div>

                  {clinicProfile.bookingNotice && (
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/50 text-amber-900">
                      <strong>Aviso aos pacientes:</strong> {clinicProfile.bookingNotice}
                    </div>
                  )}
                </div>

                <a
                  href={generalWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Tirar Dúvidas Direto no WhatsApp</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer id="contato" className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <span className="font-serif text-2xl text-white font-medium block">
                {clinicProfile.name}
              </span>
              <span className="text-xs text-stone-400">
                {clinicProfile.title} · {clinicProfile.address}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <a
                href={generalWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-stone-300 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>WhatsApp: {clinicProfile.phone}</span>
              </a>
              <span className="text-stone-700">·</span>
              <span className="text-stone-400">{clinicProfile.instagram}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-800 text-center text-xs text-stone-400">
            © {new Date().getFullYear()} {clinicProfile.name}. Todos os direitos reservados. Sistema de agendamento online com WhatsApp e Supabase.
          </div>
        </div>
      </footer>

      {/* 5. FLOATING WHATSAPP BUTTON FOR PATIENTS */}
      <aside aria-label="Atendimento rápido" className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <div className="hidden sm:block bg-stone-900 text-white text-xs py-1.5 px-3.5 rounded-full shadow-lg border border-stone-700 font-medium">
          Dúvidas? Fale no WhatsApp
        </div>
        <a
          href={generalWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all transform hover:scale-108 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
          aria-label="Falar no WhatsApp"
        >
          <MessageCircle className="w-7 h-7 fill-white/20 group-hover:scale-110 transition-transform" />
        </a>
      </aside>

    </div>
  );
};
