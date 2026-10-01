import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClinicService, ScheduleConfig, Appointment, ClinicProfile, SupabaseConfig } from '../types/index.ts';

const STORAGE_KEY_SUPABASE = 'lumiere_supabase_credentials';

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading Supabase config from storage:', e);
  }

  // Fallback to env vars if provided
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: Boolean(envUrl && envKey),
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving Supabase config to storage:', e);
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabase(overrideUrl?: string, overrideKey?: string): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  const url = overrideUrl || config.url;
  const anonKey = overrideKey || config.anonKey;

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL do projeto e Chave Anon são obrigatórios.' };
  }

  try {
    // Use persistSession: false for the test client to prevent multiple GoTrueClient warnings
    const tempClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    // Attempt lightweight ping to table or auth
    const { error } = await tempClient.from('clinic_services').select('count', { count: 'exact', head: true });
    
    if (error) {
      // If table doesn't exist yet, it still validated the project and key
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Conectado com sucesso ao Supabase! (Lembre-se de rodar o Script SQL na aba do Supabase para criar as tabelas).',
        };
      }
      // If unauthorized, wrong key
      if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('apikey')) {
        return { success: false, message: `Erro de autorização: Verifique se a Chave Anon (anon/public) está correta.` };
      }
      return { success: true, message: `Conexão bem sucedida ao Supabase! (${error.message})` };
    }

    return { success: true, message: 'Conexão ativa e verificada com o Supabase!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Falha ao conectar ao Supabase. Verifique a URL e a Chave.' };
  }
}

// SQL Script ready to copy and run in Supabase SQL editor
export const GET_SUPABASE_SCHEMA_SQL = `-- SCRIPT DE CRIAÇÃO DE TABELAS PARA A CLÍNICA DE ESTÉTICA NO SUPABASE
-- Copie todo o código abaixo e cole no SQL Editor do seu projeto Supabase, depois clique em RUN.

-- 1. Tabela de Serviços
CREATE TABLE IF NOT EXISTS public.clinic_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'facial',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price NUMERIC(10,2) NOT NULL,
    description TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    benefits JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    service_id TEXT REFERENCES public.clinic_services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    service_price NUMERIC(10,2) NOT NULL,
    service_duration INTEGER NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Configurações de Agenda
CREATE TABLE IF NOT EXISTS public.schedule_config (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    days_of_week JSONB NOT NULL DEFAULT '[1,2,3,4,5,6]'::jsonb,
    start_hour TEXT NOT NULL DEFAULT '09:00',
    end_hour TEXT NOT NULL DEFAULT '19:00',
    interval_minutes INTEGER NOT NULL DEFAULT 60,
    lunch_break_start TEXT DEFAULT '12:00',
    lunch_break_end TEXT DEFAULT '13:00',
    blocked_dates JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Perfil da Clínica
CREATE TABLE IF NOT EXISTS public.clinic_profile (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    name TEXT NOT NULL,
    practitioner_name TEXT NOT NULL,
    title TEXT,
    phone TEXT,
    whatsapp_number TEXT NOT NULL,
    instagram TEXT,
    address TEXT,
    bio TEXT,
    booking_notice TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Habilitar Row Level Security (RLS) para leitura e escrita pública nas tabelas
ALTER TABLE public.clinic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_profile ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para agendamento online dos clientes (com DROP IF EXISTS para permitir re-execução)
DROP POLICY IF EXISTS "Permitir leitura de serviços para todos" ON public.clinic_services;
CREATE POLICY "Permitir leitura de serviços para todos" ON public.clinic_services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gestão de serviços" ON public.clinic_services;
CREATE POLICY "Permitir gestão de serviços" ON public.clinic_services FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir clientes agendarem" ON public.appointments;
CREATE POLICY "Permitir clientes agendarem" ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir visualização e gestão de agendamentos" ON public.appointments;
CREATE POLICY "Permitir visualização e gestão de agendamentos" ON public.appointments FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura de agenda" ON public.schedule_config;
CREATE POLICY "Permitir leitura de agenda" ON public.schedule_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir atualização de agenda" ON public.schedule_config;
CREATE POLICY "Permitir atualização de agenda" ON public.schedule_config FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura do perfil da clínica" ON public.clinic_profile;
CREATE POLICY "Permitir leitura do perfil da clínica" ON public.clinic_profile FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir atualização do perfil" ON public.clinic_profile;
CREATE POLICY "Permitir atualização do perfil" ON public.clinic_profile FOR ALL USING (true);

-- 7. Dados Iniciais (Seed) da Dra. Letícia Gabriella e Serviços Estéticos
INSERT INTO public.clinic_profile (id, name, practitioner_name, title, phone, whatsapp_number, instagram, address, bio, booking_notice)
VALUES (
    'primary',
    'Lumière · Estética Avançada',
    'Dra. Letícia Gabriella',
    'Biomédica Esteta & Especialista em Rejuvenescimento Facial',
    '(11) 99399-6068',
    '5511993996068',
    '@lumiere.estetica',
    'Av. Brigadeiro Faria Lima, 3477 - 8º andar - Itaim Bibi, São Paulo - SP',
    'Espaço exclusivo dedicado à valorização da sua beleza natural. Procedimentos minimamente invasivos, protocolos personalizados e tecnologia de ponta com segurança e conforto.',
    'Tolerância de 15 minutos. Caso necessite remarcar, por gentileza avise com 24h de antecedência via WhatsApp.'
)
ON CONFLICT (id) DO UPDATE SET
    practitioner_name = EXCLUDED.practitioner_name,
    phone = EXCLUDED.phone,
    whatsapp_number = EXCLUDED.whatsapp_number,
    updated_at = now();

INSERT INTO public.schedule_config (id, days_of_week, start_hour, end_hour, interval_minutes, lunch_break_start, lunch_break_end)
VALUES ('primary', '[1,2,3,4,5,6]'::jsonb, '09:00', '19:00', 60, '12:00', '13:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clinic_services (id, name, category, duration_minutes, price, description, active, benefits)
VALUES
    ('serv-1', 'Toxina Botulínica (Botox) Full Face', 'injetaveis', 45, 1250.00, 'Suavização elegante e natural de linhas de expressão na testa, glabela e pés de galinha com produtos de padrão ouro.', true, '["Aspecto descansado e rejuvenescido", "Sem perda de expressividade", "Resultados em até 15 dias"]'::jsonb),
    ('serv-2', 'Preenchimento Labial & Hidratação', 'injetaveis', 60, 1100.00, 'Definição de contorno, projeção sutil e hidratação profunda dos lábios com ácido hialurônico de alta biocompatibilidade.', true, '["Lábios harmônicos e naturais", "Hidratação e viço imediato", "Procedimento com anestésico local"]'::jsonb),
    ('serv-3', 'Limpeza de Pele Profunda com Fototerapia LED', 'facial', 75, 240.00, 'Higienização profunda com extração indolor, peeling de diamante, máscara calmante e banho de luz LED para regeneração celular.', true, '["Remoção de impurezas e cravos", "Ação anti-inflamatória e bactericida", "Pele luminosa e aveludada"]'::jsonb),
    ('serv-4', 'Laser Lavieen Glow BB Laser', 'laser', 50, 690.00, 'O famoso efeito BB Cream na pele: fechamento de poros, uniformização do tom, estímulo de colágeno e brilho espelhado.', true, '["Clareamento de manchas suaves", "Redução visível de poros dilatados", "Efeito glow imediato e duradouro"]'::jsonb),
    ('serv-5', 'Bioestimulador de Colágeno (Radiesse / Sculptra)', 'injetaveis', 60, 2200.00, 'Estímulo biológico profundo para firmeza da pele, melhora da flacidez e definição do contorno da mandíbula.', true, '["Recupera a firmeza e elasticidade", "Resultados graduais e duradouros", "Aumento da espessura dérmica"]'::jsonb),
    ('serv-6', 'Peeling Químico Renovador & Despigmentante', 'facial', 45, 320.00, 'Ácidos biocompatíveis para renovação celular acelerada, redução de manchas solares, melasma e controle de oleosidade.', true, '["Textura uniforme e suave", "Atenuação de manchas e linhas finas", "Controle eficaz da oleosidade"]'::jsonb),
    ('serv-7', 'Drenagem Linfática Facial & Corporal', 'corporal', 60, 190.00, 'Manobras manuais exclusivas para redução de retenção hídrica, alívio de inchaço pós-operatório ou rotineiro e relaxamento.', true, '["Desinchaço imediato e leveza", "Eliminação de toxinas acumuladas", "Melhora da circulação periférica"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    price = EXCLUDED.price,
    name = EXCLUDED.name,
    duration_minutes = EXCLUDED.duration_minutes,
    active = EXCLUDED.active;
`;

// Helper database functions that use Supabase or return null if not connected
export async function fetchServicesFromSupabase(): Promise<ClinicService[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('clinic_services')
      .select('*')
      .order('name');
    
    if (error || !data) return null;

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      durationMinutes: item.duration_minutes,
      price: Number(item.price),
      description: item.description,
      imageUrl: item.image_url,
      active: item.active,
      benefits: item.benefits || [],
    }));
  } catch (e) {
    console.error('Error fetching services from Supabase:', e);
    return null;
  }
}

export async function upsertServiceInSupabase(service: ClinicService): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('clinic_services').upsert({
      id: service.id,
      name: service.name,
      category: service.category,
      duration_minutes: service.durationMinutes,
      price: service.price,
      description: service.description,
      image_url: service.imageUrl || null,
      active: service.active,
      benefits: service.benefits || [],
    });
    return !error;
  } catch (e) {
    console.error('Error upserting service in Supabase:', e);
    return false;
  }
}

export async function deleteServiceInSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('clinic_services').delete().eq('id', id);
    return !error;
  } catch (e) {
    console.error('Error deleting service in Supabase:', e);
    return false;
  }
}

export async function fetchAppointmentsFromSupabase(): Promise<Appointment[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });
    
    if (error || !data) return null;

    return data.map((item: any) => ({
      id: item.id,
      clientName: item.client_name,
      clientPhone: item.client_phone,
      clientEmail: item.client_email,
      serviceId: item.service_id,
      serviceName: item.service_name,
      servicePrice: Number(item.service_price),
      serviceDuration: item.service_duration,
      date: item.date,
      time: item.time,
      status: item.status,
      notes: item.notes,
      createdAt: item.created_at,
    }));
  } catch (e) {
    console.error('Error fetching appointments from Supabase:', e);
    return null;
  }
}

export async function createAppointmentInSupabase(apt: Appointment): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('appointments').insert({
      id: apt.id,
      client_name: apt.clientName,
      client_phone: apt.clientPhone,
      client_email: apt.clientEmail || null,
      service_id: apt.serviceId,
      service_name: apt.serviceName,
      service_price: apt.servicePrice,
      service_duration: apt.serviceDuration,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      notes: apt.notes || null,
      created_at: apt.createdAt,
    });
    return !error;
  } catch (e) {
    console.error('Error creating appointment in Supabase:', e);
    return false;
  }
}

export async function updateAppointmentStatusInSupabase(id: string, status: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    return !error;
  } catch (e) {
    console.error('Error updating appointment in Supabase:', e);
    return false;
  }
}

export async function upsertProfileInSupabase(profile: ClinicProfile): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('clinic_profile').upsert({
      id: 'primary',
      name: profile.name,
      practitioner_name: profile.practitionerName,
      title: profile.title,
      phone: profile.phone,
      whatsapp_number: profile.whatsappNumber,
      instagram: profile.instagram,
      address: profile.address,
      bio: profile.bio,
      booking_notice: profile.bookingNotice || null,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch (e) {
    console.error('Error upserting profile in Supabase:', e);
    return false;
  }
}

export async function upsertScheduleInSupabase(schedule: ScheduleConfig): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('schedule_config').upsert({
      id: 'primary',
      days_of_week: schedule.daysOfWeek,
      start_hour: schedule.startHour,
      end_hour: schedule.endHour,
      interval_minutes: schedule.intervalMinutes,
      lunch_break_start: schedule.lunchBreakStart || null,
      lunch_break_end: schedule.lunchBreakEnd || null,
      blocked_dates: schedule.blockedDates || [],
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch (e) {
    console.error('Error upserting schedule in Supabase:', e);
    return false;
  }
}

/**
 * Full migration function: pushes all services, appointments, schedule, and profile to Supabase
 */
export async function migrateAllDataToSupabase(
  services: ClinicService[],
  appointments: Appointment[],
  schedule: ScheduleConfig,
  profile: ClinicProfile
): Promise<{ success: boolean; servicesCount: number; appointmentsCount: number; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      servicesCount: 0,
      appointmentsCount: 0,
      message: 'Supabase não está configurado. Insira a URL e a Chave Anon primeiro.',
    };
  }

  try {
    // 1. Migrate profile
    await upsertProfileInSupabase(profile);

    // 2. Migrate schedule
    await upsertScheduleInSupabase(schedule);

    // 3. Migrate services
    let servicesCount = 0;
    for (const srv of services) {
      const ok = await upsertServiceInSupabase(srv);
      if (ok) servicesCount++;
    }

    // 4. Migrate appointments
    let appointmentsCount = 0;
    for (const apt of appointments) {
      const { error } = await supabase.from('appointments').upsert({
        id: apt.id,
        client_name: apt.clientName,
        client_phone: apt.clientPhone,
        client_email: apt.clientEmail || null,
        service_id: apt.serviceId,
        service_name: apt.serviceName,
        service_price: apt.servicePrice,
        service_duration: apt.serviceDuration,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        notes: apt.notes || null,
        created_at: apt.createdAt,
      });
      if (!error) appointmentsCount++;
    }

    return {
      success: true,
      servicesCount,
      appointmentsCount,
      message: `Migração concluída com sucesso! ${servicesCount} serviços e ${appointmentsCount} agendamentos salvos no seu Supabase.`,
    };
  } catch (err: any) {
    return {
      success: false,
      servicesCount: 0,
      appointmentsCount: 0,
      message: `Erro durante a migração: ${err.message || 'Falha desconhecida.'}`,
    };
  }
}
