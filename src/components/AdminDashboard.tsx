import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Send,
  MessageCircle,
  Settings,
  Database,
  Share2,
  User,
  DollarSign,
  TrendingUp,
  ExternalLink,
  LogOut,
  QrCode,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import {
  ClinicService,
  ScheduleConfig,
  Appointment,
  ClinicProfile,
  SupabaseConfig,
  AppointmentStatus,
} from '../types/index.ts';
import { formatBRL, formatDatePtBR, getPractitionerReminderWhatsAppUrl, getPractitionerInviteWhatsAppUrl } from '../lib/whatsapp.ts';
import { testSupabaseConnection, saveSupabaseConfig, GET_SUPABASE_SCHEMA_SQL, getSupabase, migrateAllDataToSupabase } from '../lib/supabaseClient.ts';
import facialImg from '../assets/images/service_facial_treatment_1790881736374.jpg';
import lipImg from '../assets/images/service_lip_enhancement_1790881744107.jpg';
import laserImg from '../assets/images/service_laser_skin_1790881753486.jpg';

interface AdminDashboardProps {
  services: ClinicService[];
  scheduleConfig: ScheduleConfig;
  appointments: Appointment[];
  clinicProfile: ClinicProfile;
  supabaseConfig: SupabaseConfig;
  onSaveService: (service: ClinicService) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  onUpdateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  onSaveSchedule: (config: ScheduleConfig) => void;
  onSaveProfile: (profile: ClinicProfile) => void;
  onUpdateSupabaseConfig: (config: SupabaseConfig) => void;
  onLogout: () => void;
  onViewClientPortal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  services,
  scheduleConfig,
  appointments,
  clinicProfile,
  supabaseConfig,
  onSaveService,
  onDeleteService,
  onUpdateAppointmentStatus,
  onSaveSchedule,
  onSaveProfile,
  onUpdateSupabaseConfig,
  onLogout,
  onViewClientPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'schedule' | 'share' | 'supabase' | 'profile'>('appointments');

  // Search & Filter for Appointments
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');

  // Service Modal state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);

  // Share link state
  const [copiedLink, setCopiedLink] = useState(false);
  const [clientPhoneToSend, setClientPhoneToSend] = useState('');

  // Supabase test state
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseConfig.url || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseConfig.anonKey || '');
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatusMsg, setMigrationStatusMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Profile edit form state
  const [profileForm, setProfileForm] = useState<ClinicProfile>(clinicProfile);
  const [savedProfileSuccess, setSavedProfileSuccess] = useState(false);

  // Schedule edit form state
  const [scheduleForm, setScheduleForm] = useState<ScheduleConfig>(scheduleConfig);
  const [savedScheduleSuccess, setSavedScheduleSuccess] = useState(false);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchSearch =
        apt.clientName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
        apt.serviceName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
        apt.clientPhone.includes(appointmentSearch);
      const matchStatus = statusFilter === 'all' || apt.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [appointments, appointmentSearch, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const revenueExpected = appointments
      .filter((a) => a.status === 'confirmed' || a.status === 'completed')
      .reduce((sum, a) => sum + (a.servicePrice || 0), 0);

    return { total, pending, confirmed, completed, revenueExpected };
  }, [appointments]);

  // Public Booking URL
  const bookingUrl = window.location.origin;

  const handleCopyBookingLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(GET_SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleTestAndSaveSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseStatusMsg(null);
    setMigrationStatusMsg(null);

    const result = await testSupabaseConnection(supabaseUrlInput.trim(), supabaseKeyInput.trim());
    setIsTestingSupabase(false);

    if (result.success) {
      const newConfig: SupabaseConfig = {
        url: supabaseUrlInput.trim(),
        anonKey: supabaseKeyInput.trim(),
        isConnected: true,
        lastTested: new Date().toISOString(),
      };
      saveSupabaseConfig(newConfig);
      onUpdateSupabaseConfig(newConfig);

      setSupabaseStatusMsg({ text: 'Conexão confirmada! Sincronizando dados com o Supabase...', success: true });

      // Automatically migrate local data to Supabase
      setIsMigrating(true);
      try {
        const migResult = await migrateAllDataToSupabase(services, appointments, scheduleConfig, clinicProfile);
        setMigrationStatusMsg({ text: migResult.message, success: migResult.success });
        setSupabaseStatusMsg({ text: 'Conectado e dados sincronizados com o Supabase com sucesso!', success: true });
      } catch (err: any) {
        setMigrationStatusMsg({ text: `Conexão bem sucedida, mas houve erro ao migrar: ${err.message}`, success: false });
      } finally {
        setIsMigrating(false);
      }
    } else {
      setSupabaseStatusMsg({ text: result.message, success: false });
    }
  };

  const handleMigrateData = async () => {
    setIsMigrating(true);
    setMigrationStatusMsg(null);
    try {
      const res = await migrateAllDataToSupabase(services, appointments, scheduleConfig, clinicProfile);
      setMigrationStatusMsg({ text: res.message, success: res.success });
    } catch (err: any) {
      setMigrationStatusMsg({ text: `Falha na migração: ${err.message || 'Erro inesperado'}`, success: false });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profileForm);
    setSavedProfileSuccess(true);
    setTimeout(() => setSavedProfileSuccess(false), 3000);
  };

  const handleSaveScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchedule(scheduleForm);
    setSavedScheduleSuccess(true);
    setTimeout(() => setSavedScheduleSuccess(false), 3000);
  };

  const toggleDayOfWeek = (day: number) => {
    setScheduleForm((prev) => {
      const exists = prev.daysOfWeek.includes(day);
      const updated = exists ? prev.daysOfWeek.filter((d) => d !== day) : [...prev.daysOfWeek, day].sort();
      return { ...prev, daysOfWeek: updated };
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-stone-800">
      
      {/* Top Header of Admin Dashboard */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Practitioner & Clinic Lockup */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-stone-900 text-amber-200 flex items-center justify-center font-serif font-semibold text-sm">
                {clinicProfile.practitionerName.charAt(0) || 'L'}
              </div>
              <div>
                <span className="font-serif text-lg font-medium text-stone-900 block leading-tight">
                  {clinicProfile.practitionerName}
                </span>
                <span className="text-[11px] text-stone-500 block">
                  Painel de Gestão · {clinicProfile.name}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleCopyBookingLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                title="Copiar link de agendamento online das clientes"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? 'Link Copiado!' : 'Copiar Link de Agendamento'}</span>
                <span className="sm:hidden">{copiedLink ? 'Copiado!' : 'Link'}</span>
              </button>

              <button
                onClick={onViewClientPortal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Página das Clientes</span>
                <span className="sm:hidden">Ver Site</span>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                title="Sair do painel"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 overflow-x-auto pt-1 pb-2 scrollbar-none border-t border-stone-100 text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-3.5 py-2 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'appointments'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Agendamentos ({appointments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`px-3.5 py-2 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'services'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Meus Serviços ({services.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-2 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Minha Agenda & Horários</span>
            </button>

            <button
              onClick={() => setActiveTab('share')}
              className={`px-3.5 py-2 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'share'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar Link para Clientes</span>
            </button>

            <button
              onClick={() => setActiveTab('supabase')}
              className={`px-3.5 py-2 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'supabase'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Banco Supabase</span>
              {supabaseConfig.isConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5" title="Conectado" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Dados da Clínica</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Stats Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
            <span className="text-xs text-stone-500 block">Total de Agendamentos</span>
            <span className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
              {stats.total}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
            <span className="text-xs text-amber-900 block font-medium">Pendentes de Confirmação</span>
            <span className="font-serif text-2xl font-bold text-amber-800 tabular-nums">
              {stats.pending}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
            <span className="text-xs text-emerald-800 block font-medium">Confirmados</span>
            <span className="font-serif text-2xl font-bold text-emerald-700 tabular-nums">
              {stats.confirmed}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
            <span className="text-xs text-stone-500 block">Faturamento Previsto</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-stone-900 tabular-nums">
              {formatBRL(stats.revenueExpected)}
            </span>
          </div>
        </div>

        {/* TAB 1: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900">
                  Gestão de Agendamentos
                </h2>
                <p className="text-xs text-stone-500">
                  Acompanhe e confirme os horários agendados pelas clientes e chame no WhatsApp com 1 clique.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar paciente ou procedimento..."
                    value={appointmentSearch}
                    onChange={(e) => setAppointmentSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-amber-800"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="py-1.5 px-2.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendentes</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="completed">Concluídos</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>
            </div>

            {/* Appointments Table / Cards */}
            {filteredAppointments.length > 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Paciente</th>
                        <th className="py-3 px-4">Procedimento</th>
                        <th className="py-3 px-4">Data e Hora</th>
                        <th className="py-3 px-4">Valor</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações no WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredAppointments.map((apt) => {
                        const whatsappReminderUrl = getPractitionerReminderWhatsAppUrl(
                          apt.clientPhone,
                          apt.clientName,
                          apt.serviceName,
                          apt.date,
                          apt.time,
                          clinicProfile.name
                        );

                        return (
                          <tr key={apt.id} className="hover:bg-stone-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-stone-900">{apt.clientName}</div>
                              <div className="text-stone-500 font-mono text-[11px]">{apt.clientPhone}</div>
                              {apt.clientEmail && (
                                <div className="text-stone-400 text-[10px]">{apt.clientEmail}</div>
                              )}
                              {apt.notes && (
                                <div className="text-amber-800 text-[11px] mt-0.5 bg-amber-50/60 p-1 rounded">
                                  Nota: {apt.notes}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-medium text-stone-800">{apt.serviceName}</div>
                              <div className="text-stone-500">{apt.serviceDuration} min</div>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-medium text-stone-900">{formatDatePtBR(apt.date)}</div>
                              <div className="font-mono text-stone-600 font-semibold">{apt.time}</div>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap font-mono font-medium text-stone-900">
                              {formatBRL(apt.servicePrice)}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                  apt.status === 'confirmed'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : apt.status === 'pending'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : apt.status === 'completed'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-stone-100 text-stone-500 border border-stone-200'
                                }`}
                              >
                                {apt.status === 'confirmed' && 'Confirmado'}
                                {apt.status === 'pending' && 'Pendente'}
                                {apt.status === 'completed' && 'Concluído'}
                                {apt.status === 'cancelled' && 'Cancelado'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Direct WhatsApp Reminder Button */}
                                <a
                                  href={whatsappReminderUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                                  title="Enviar mensagem de confirmação/lembrete no WhatsApp da cliente"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>WhatsApp</span>
                                </a>

                                {/* Status Quick Toggles */}
                                {apt.status === 'pending' && (
                                  <button
                                    onClick={() => onUpdateAppointmentStatus(apt.id, 'confirmed')}
                                    className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-stone-100 hover:bg-emerald-50 rounded-md transition-colors"
                                    title="Confirmar Agendamento"
                                  >
                                    Confirmar
                                  </button>
                                )}

                                {apt.status === 'confirmed' && (
                                  <button
                                    onClick={() => onUpdateAppointmentStatus(apt.id, 'completed')}
                                    className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-stone-100 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Marcar como Concluído"
                                  >
                                    Concluir
                                  </button>
                                )}

                                {apt.status !== 'cancelled' && (
                                  <button
                                    onClick={() => onUpdateAppointmentStatus(apt.id, 'cancelled')}
                                    className="px-2 py-1 text-[11px] font-medium text-stone-400 hover:text-red-600 rounded-md transition-colors"
                                    title="Cancelar horário"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-500">
                <CalendarIcon className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                <p className="text-sm font-medium">Nenhum agendamento encontrado.</p>
                <p className="text-xs text-stone-400 mt-1">
                  Envie o link de agendamento para suas clientes começarem a marcar horários!
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SERVICES MANAGEMENT */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900">
                  Meus Serviços & Procedimentos
                </h2>
                <p className="text-xs text-stone-500">
                  Cadastre, altere preços, duração e visibilidade dos procedimentos oferecidos na sua clínica.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingService(null);
                  setIsServiceModalOpen(true);
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Novo Serviço</span>
              </button>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`bg-white rounded-xl border p-5 flex flex-col justify-between shadow-xs transition-all ${
                    service.active ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] uppercase tracking-wider text-amber-900/80 font-medium">
                        {service.category}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                          service.active ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {service.active ? 'Ativo na Agenda' : 'Pausado'}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-medium text-stone-900 mb-1">
                      {service.name}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-2 mb-3">
                      {service.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {service.durationMinutes} min
                      </span>
                      <span>·</span>
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {formatBRL(service.price)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        onSaveService({ ...service, active: !service.active });
                      }}
                      className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      {service.active ? 'Pausar' : 'Ativar'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingService(service);
                          setIsServiceModalOpen(true);
                        }}
                        className="p-1.5 text-stone-500 hover:text-stone-800 rounded-md hover:bg-stone-100 transition-colors"
                        title="Editar Procedimento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir o serviço "${service.name}"?`)) {
                            onDeleteService(service.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Excluir Procedimento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SCHEDULE & HOURS */}
        {activeTab === 'schedule' && (
          <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-xs">
            <h2 className="font-serif text-2xl font-medium text-stone-900 mb-1">
              Configuração da Agenda de Atendimento
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Defina os dias da semana e horários em que suas clientes poderão realizar agendamentos online.
            </p>

            <form onSubmit={handleSaveScheduleSubmit} className="space-y-6">
              {/* Days of Week */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Dias de Atendimento na Semana
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[
                    { id: 0, label: 'Dom' },
                    { id: 1, label: 'Seg' },
                    { id: 2, label: 'Ter' },
                    { id: 3, label: 'Qua' },
                    { id: 4, label: 'Qui' },
                    { id: 5, label: 'Sex' },
                    { id: 6, label: 'Sáb' },
                  ].map((day) => {
                    const isSelected = scheduleForm.daysOfWeek.includes(day.id);
                    return (
                      <button
                        type="button"
                        key={day.id}
                        onClick={() => toggleDayOfWeek(day.id)}
                        className={`py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.startHour}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startHour: e.target.value })}
                    className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Horário de Término
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.endHour}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endHour: e.target.value })}
                    className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Lunch Break */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Início Intervalo Almoço
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.lunchBreakStart || '12:00'}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, lunchBreakStart: e.target.value })}
                    className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Término Intervalo Almoço
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.lunchBreakEnd || '13:00'}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, lunchBreakEnd: e.target.value })}
                    className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Slot interval */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Intervalo entre Horários de Agendamento
                </label>
                <select
                  value={scheduleForm.intervalMinutes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, intervalMinutes: Number(e.target.value) })}
                  className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg"
                >
                  <option value={30}>A cada 30 minutos</option>
                  <option value={45}>A cada 45 minutos</option>
                  <option value={60}>A cada 60 minutos (1 hora - recomendado)</option>
                  <option value={90}>A cada 90 minutos (1 hora e meia)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-between">
                {savedScheduleSuccess ? (
                  <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                    <Check className="w-4 h-4" /> Agenda salva com sucesso!
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
                >
                  Salvar Agenda
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: SHARE LINK WITH CLIENTS */}
        {activeTab === 'share' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-xs space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900 mb-1">
                  Enviar Link de Agendamento para as Clientes
                </h2>
                <p className="text-xs text-stone-500">
                  Compartilhe este link no seu WhatsApp, Instagram ou mensagens diretas para as clientes agendarem sozinhas com praticidade.
                </p>
              </div>

              {/* Direct Link Box */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Link Direto da Sua Clínica
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={bookingUrl}
                    className="w-full p-2.5 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg text-stone-800 selection:bg-amber-100"
                  />
                  <button
                    onClick={handleCopyBookingLink}
                    className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Quick WhatsApp Send to Specific Client */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/60 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Disparo Rápido para Cliente no WhatsApp</span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Digite o WhatsApp da cliente abaixo para abrir a conversa já com o link e mensagem carinhosa pronta:
                </p>

                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="DDD + Telefone (ex: 11 98765-4321)"
                    value={clientPhoneToSend}
                    onChange={(e) => setClientPhoneToSend(e.target.value)}
                    className="w-full p-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none"
                  />
                  <a
                    href={getPractitionerInviteWhatsAppUrl(
                      clientPhoneToSend,
                      bookingUrl,
                      clinicProfile.name,
                      clinicProfile.practitionerName
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar no WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Ready Instagram Bio text */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Texto Sugerido para Bio do Instagram
                </label>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1 font-sans">
                  <p>✨ {clinicProfile.practitionerName} · {clinicProfile.title}</p>
                  <p>💆‍♀️ Procedimentos exclusivos & Rejuvenescimento</p>
                  <p>🗓️ Agende seu horário online no link abaixo:</p>
                  <p className="font-mono text-amber-900 font-medium">{bookingUrl}</p>
                </div>
              </div>
            </div>

            {/* QR Code Presentation */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-xs flex flex-col items-center text-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-900 font-semibold block mb-1">
                  Balcão & Recepção
                </span>
                <h3 className="font-serif text-xl font-medium text-stone-900 mb-2">
                  QR Code para Impressão
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mb-6">
                  Imprima e deixe na recepção da sua clínica para as clientes apontarem a câmera e agendarem o retorno.
                </p>

                {/* Visual QR Code Generator representation */}
                <div className="p-5 bg-white border-2 border-dashed border-stone-300 rounded-2xl inline-block shadow-sm mb-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(bookingUrl)}`}
                    alt="QR Code Agendamento"
                    className="w-44 h-44 object-contain"
                  />
                </div>
              </div>

              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(bookingUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                <span>Baixar Imagem em Alta Resolução</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 5: SUPABASE INTEGRATION */}
        {activeTab === 'supabase' && (
          <div className="space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-xs">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" />
                    <h2 className="font-serif text-2xl font-medium text-stone-900">
                      Integração Banco de Dados Supabase
                    </h2>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Conecte seu projeto Supabase para salvar e sincronizar serviços, horários e agendamentos em nuvem.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      supabaseConfig.isConnected
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        supabaseConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                      }`}
                    />
                    {supabaseConfig.isConnected ? 'Supabase Conectado' : 'Modo Local Ativo'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Project URL do Supabase *
                  </label>
                  <input
                    type="url"
                    placeholder="https://seu-projeto.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    Encontrado no painel do Supabase: Project Settings &gt; API &gt; Project URL.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Anon / Public API Key *
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    Chave pública: Project Settings &gt; API &gt; Project API Keys (anon public).
                  </span>
                </div>
              </div>

              {/* Status feedback message */}
              {supabaseStatusMsg && (
                <div
                  className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                    supabaseStatusMsg.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {supabaseStatusMsg.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{supabaseStatusMsg.text}</span>
                </div>
              )}

              {/* Migration feedback message */}
              {migrationStatusMsg && (
                <div
                  className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
                    migrationStatusMsg.success
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {migrationStatusMsg.success ? (
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{migrationStatusMsg.text}</span>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
                <span className="text-xs text-stone-500">
                  {supabaseConfig.lastTested
                    ? `Último teste: ${new Date(supabaseConfig.lastTested).toLocaleString('pt-BR')}`
                    : 'Insira as credenciais para ativar a sincronização.'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isMigrating || !supabaseConfig.isConnected}
                    onClick={handleMigrateData}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Enviar todos os serviços e agendamentos cadastrados para as tabelas do Supabase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
                    <span>{isMigrating ? 'Migrando...' : 'Migrar Dados para o Supabase'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isTestingSupabase || !supabaseUrlInput || !supabaseKeyInput}
                    onClick={handleTestAndSaveSupabase}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    <span>{isTestingSupabase ? 'Testando...' : 'Salvar & Conectar'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SQL Script for Supabase Table Setup */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-medium text-stone-900">
                    Script SQL para Criação das Tabelas no Supabase
                  </h3>
                  <p className="text-xs text-stone-500">
                    Copie o código SQL abaixo e cole na aba <strong>SQL Editor</strong> do seu painel do Supabase para criar as tabelas com 1 clique:
                  </p>
                </div>

                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-stone-900 text-stone-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 border border-stone-800">
                  {GET_SUPABASE_SCHEMA_SQL}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CLINIC PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-xs">
            <h2 className="font-serif text-2xl font-medium text-stone-900 mb-1">
              Perfil da Clínica & Profissional
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Estas informações aparecem no topo do site e nas mensagens automáticas de confirmação no WhatsApp.
            </p>

            <form onSubmit={handleSaveProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Nome da Clínica
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Nome da Biomédica / Esteticista
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.practitionerName}
                    onChange={(e) => setProfileForm({ ...profileForm, practitionerName: e.target.value })}
                    className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Título Profissional
                  </label>
                  <input
                    type="text"
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    WhatsApp para Receber Agendamentos (com DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={profileForm.whatsappNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, whatsappNumber: e.target.value })}
                    placeholder="Ex: 5511999998888"
                    className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Use apenas números com DDI e DDD (ex: 5511987654321).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Instagram da Clínica
                  </label>
                  <input
                    type="text"
                    value={profileForm.instagram}
                    onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                    placeholder="@suaclinica"
                    className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Endereço da Clínica
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Apresentação / Bio da Clínica
                </label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Aviso de Tolerância ou Reagendamento (aparece no site)
                </label>
                <input
                  type="text"
                  value={profileForm.bookingNotice || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, bookingNotice: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-stone-100">
                {savedProfileSuccess ? (
                  <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                    <Check className="w-4 h-4" /> Informações salvas com sucesso!
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
                >
                  Salvar Informações
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* SERVICE CREATE / EDIT MODAL */}
      {isServiceModalOpen && (
        <ServiceEditModal
          service={editingService}
          onClose={() => {
            setIsServiceModalOpen(false);
            setEditingService(null);
          }}
          onSave={async (srv) => {
            await onSaveService(srv);
            setIsServiceModalOpen(false);
            setEditingService(null);
          }}
        />
      )}

    </div>
  );
};

// SUBCOMPONENT: SERVICE EDIT MODAL
interface ServiceEditModalProps {
  service: ClinicService | null;
  onClose: () => void;
  onSave: (service: ClinicService) => Promise<void>;
}

const ServiceEditModal: React.FC<ServiceEditModalProps> = ({ service, onClose, onSave }) => {
  const [name, setName] = useState(service?.name || '');
  const [category, setCategory] = useState<ClinicService['category']>(service?.category || 'facial');
  const [durationMinutes, setDurationMinutes] = useState(service?.durationMinutes || 60);
  const [price, setPrice] = useState(service?.price || 250);
  const [description, setDescription] = useState(service?.description || '');
  const [benefitsText, setBenefitsText] = useState((service?.benefits || []).join('\n'));
  const [active, setActive] = useState(service ? service.active : true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0) return;

    setIsSaving(true);
    const benefits = benefitsText
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    // Pick appropriate image based on category or preserve current
    let defaultImg = facialImg;
    if (category === 'injetaveis') defaultImg = lipImg;
    if (category === 'laser') defaultImg = laserImg;

    const updatedService: ClinicService = {
      id: service?.id || `serv-${Date.now()}`,
      name: name.trim(),
      category,
      durationMinutes: Number(durationMinutes),
      price: Number(price),
      description: description.trim(),
      imageUrl: service?.imageUrl || defaultImg,
      active,
      benefits,
    };

    try {
      await onSave(updatedService);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
          <h3 className="font-serif text-xl font-medium text-stone-900">
            {service ? 'Editar Procedimento' : 'Novo Procedimento Estético'}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Nome do Procedimento *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Toxina Botulínica (Botox) Full Face"
              className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg"
              >
                <option value="injetaveis">Injetáveis & Harmonização</option>
                <option value="facial">Estética Facial</option>
                <option value="laser">Laser & BB Glow</option>
                <option value="corporal">Corporal</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Duração (minutos)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1 hora)</option>
                <option value={75}>75 minutos</option>
                <option value={90}>90 minutos (1h 30m)</option>
                <option value={120}>120 minutos (2h)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Valor (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="250"
              className="w-full p-2.5 text-xs font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Descrição do Procedimento
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que o procedimento faz e para quem é indicado..."
              className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Benefícios (um por linha)
            </label>
            <textarea
              rows={3}
              value={benefitsText}
              onChange={(e) => setBenefitsText(e.target.value)}
              placeholder="Sem dor e anestésico local&#10;Efeito imediato e duradouro&#10;Regeneração celular"
              className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg resize-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeCheckbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-stone-900 focus:ring-amber-800"
            />
            <label htmlFor="activeCheckbox" className="text-xs text-stone-700 cursor-pointer">
              Ativo na agenda pública de agendamentos
            </label>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {isSaving ? 'Salvando...' : 'Salvar Procedimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
