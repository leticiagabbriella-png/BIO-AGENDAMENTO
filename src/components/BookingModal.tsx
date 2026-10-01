import React, { useState, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Clock, CheckCircle2, MessageCircle, ChevronRight, ChevronLeft, Sparkles, User, Phone, Mail, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClinicService, ScheduleConfig, Appointment, ClinicProfile } from '../types/index.ts';
import { formatBRL, formatDatePtBR, getWhatsAppAppointmentConfirmUrl } from '../lib/whatsapp.ts';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ClinicService[];
  initialServiceId?: string | null;
  scheduleConfig: ScheduleConfig;
  existingAppointments: Appointment[];
  clinicProfile: ClinicProfile;
  onSaveAppointment: (apt: Appointment) => Promise<void>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  services,
  initialServiceId,
  scheduleConfig,
  existingAppointments,
  clinicProfile,
  onSaveAppointment,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialServiceId ? 2 : 1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || (services[0]?.id ?? ''));
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // Sync initialServiceId when modal opens
  React.useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
      setStep(2);
    } else {
      setSelectedServiceId(services[0]?.id ?? '');
      setStep(1);
    }
  }, [initialServiceId, services, isOpen]);

  const activeServices = useMemo(() => services.filter((s) => s.active), [services]);
  const currentService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || services[0],
    [services, selectedServiceId]
  );

  // Generate next 14 available days based on scheduleConfig
  const availableDates = useMemo(() => {
    const dates: { dateStr: string; dayName: string; dayNum: number; monthName: string; isAvailable: boolean }[] = [];
    const today = new Date();

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < 21; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

      const isOpenDay = scheduleConfig.daysOfWeek.includes(dayOfWeek);
      const isBlocked = scheduleConfig.blockedDates.includes(dateStr);

      dates.push({
        dateStr,
        dayName: dayNames[dayOfWeek],
        dayNum: d.getDate(),
        monthName: monthNames[d.getMonth()],
        isAvailable: isOpenDay && !isBlocked,
      });
    }

    return dates;
  }, [scheduleConfig]);

  // Set default selected date once available
  React.useEffect(() => {
    if (!selectedDate) {
      const firstAvailable = availableDates.find((d) => d.isAvailable);
      if (firstAvailable) {
        setSelectedDate(firstAvailable.dateStr);
      }
    }
  }, [availableDates, selectedDate]);

  // Generate available time slots for the selected date
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];

    const slots: string[] = [];
    const [startH] = scheduleConfig.startHour.split(':').map(Number);
    const [endH] = scheduleConfig.endHour.split(':').map(Number);
    const interval = scheduleConfig.intervalMinutes || 60;

    let currentMinutes = startH * 60;
    const endMinutes = endH * 60;

    const [lunchStartH, lunchStartM] = (scheduleConfig.lunchBreakStart || '12:00').split(':').map(Number);
    const [lunchEndH, lunchEndM] = (scheduleConfig.lunchBreakEnd || '13:00').split(':').map(Number);
    const lunchStartTotal = lunchStartH * 60 + lunchStartM;
    const lunchEndTotal = lunchEndH * 60 + lunchEndM;

    while (currentMinutes + interval <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Check if overlaps with lunch
      const isLunch = currentMinutes >= lunchStartTotal && currentMinutes < lunchEndTotal;

      // Check if slot already booked on this date
      const isBooked = existingAppointments.some(
        (apt) => apt.date === selectedDate && apt.time === timeStr && apt.status !== 'cancelled'
      );

      if (!isLunch && !isBooked) {
        slots.push(timeStr);
      }

      currentMinutes += interval;
    }

    return slots;
  }, [selectedDate, scheduleConfig, existingAppointments]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !selectedDate || !selectedTime || !currentService) {
      return;
    }

    setIsSubmitting(true);
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim() || undefined,
      serviceId: currentService.id,
      serviceName: currentService.name,
      servicePrice: currentService.price,
      serviceDuration: currentService.durationMinutes,
      date: selectedDate,
      time: selectedTime,
      status: 'pending',
      notes: clientNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await onSaveAppointment(newAppointment);
      setCreatedAppointment(newAppointment);
      setStep(4);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback
      }
    } catch (err) {
      console.error('Error saving appointment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-medium tracking-wider text-amber-900/80">
                Agendamento Online
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs text-stone-500">Etapa {step} de 4</span>
            </div>
            <h2 className="font-serif text-2xl font-medium text-stone-900 mt-0.5">
              {step === 1 && 'Escolha o Procedimento'}
              {step === 2 && 'Escolha a Data e Horário'}
              {step === 3 && 'Seus Dados para Contato'}
              {step === 4 && 'Agendamento Realizado!'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">
                Selecione o procedimento estético desejado para verificar os horários livres:
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                {activeServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      setStep(2);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      selectedServiceId === service.id
                        ? 'border-amber-800/60 bg-amber-50/40 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-stone-900 group-hover:text-amber-900 transition-colors">
                          {service.name}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {service.durationMinutes} min
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-stone-800 font-mono">
                          {formatBRL(service.price)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-amber-800 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Date & Time */}
          {step === 2 && currentService && (
            <div className="space-y-6">
              {/* Service Reminder */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-xl border border-stone-200/80">
                <div>
                  <span className="text-xs text-stone-500">Procedimento selecionado</span>
                  <p className="text-sm font-medium text-stone-900">{currentService.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-medium text-stone-900 block">
                    {formatBRL(currentService.price)}
                  </span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-amber-800 hover:underline cursor-pointer"
                  >
                    Trocar
                  </button>
                </div>
              </div>

              {/* Date Selection Carousel */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  1. Selecione o Dia
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {availableDates.map((d) => (
                    <button
                      key={d.dateStr}
                      disabled={!d.isAvailable}
                      onClick={() => {
                        setSelectedDate(d.dateStr);
                        setSelectedTime('');
                      }}
                      className={`flex flex-col items-center justify-center min-w-[70px] py-3 px-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                        selectedDate === d.dateStr
                          ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                          : d.isAvailable
                          ? 'border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
                          : 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-[11px] uppercase font-medium">{d.dayName}</span>
                      <span className="text-lg font-bold my-0.5">{d.dayNum}</span>
                      <span className="text-[10px]">{d.monthName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  2. Horários Disponíveis
                </label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-3 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer text-center ${
                          selectedTime === time
                            ? 'border-amber-800 bg-amber-50 text-amber-900 ring-1 ring-amber-800'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-stone-500 border border-stone-200">
                    Nenhum horário disponível para esta data. Por gentileza, selecione outro dia.
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                  className={`px-5 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedDate && selectedTime
                      ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <span>Continuar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Client Details */}
          {step === 3 && currentService && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-stone-200/80 text-xs text-stone-700 space-y-1">
                <div className="font-semibold text-stone-900">{currentService.name}</div>
                <div className="flex items-center gap-2 text-stone-600">
                  <CalendarIcon className="w-3.5 h-3.5 text-stone-400" />
                  <span>{formatDatePtBR(selectedDate)}</span>
                  <span>às</span>
                  <span className="font-mono font-medium">{selectedTime}</span>
                  <span>·</span>
                  <span className="font-mono font-medium text-stone-800">{formatBRL(currentService.price)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Amanda Silva"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 focus:border-amber-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  WhatsApp com DDD * (para envio da confirmação)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 focus:border-amber-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  E-mail (opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="amanda@exemplo.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 focus:border-amber-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Observações ou Primeira Vez (opcional)
                </label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Ex: Gostaria de avaliação para manchas ou já fiz botox antes..."
                  className="w-full p-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 focus:border-amber-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !clientName || !clientPhone}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-all hover:shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando Agendamento...' : 'Concluir Agendamento'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success & Direct WhatsApp Action */}
          {step === 4 && createdAppointment && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-serif text-2xl font-medium text-stone-900">
                  Agendamento Solicitado com Sucesso!
                </h3>
                <p className="text-sm text-stone-600 mt-1 max-w-md mx-auto">
                  Seu horário foi pré-reservado na clínica. Para confirmar de forma prioritária, envie a mensagem no WhatsApp abaixo:
                </p>
              </div>

              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between border-b border-stone-200/60 pb-2">
                  <span className="text-stone-500">Procedimento:</span>
                  <span className="font-medium text-stone-900">{createdAppointment.serviceName}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-2">
                  <span className="text-stone-500">Data e Horário:</span>
                  <span className="font-medium text-stone-900">
                    {formatDatePtBR(createdAppointment.date)} às {createdAppointment.time}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-2">
                  <span className="text-stone-500">Valor Estimado:</span>
                  <span className="font-mono font-medium text-stone-900">
                    {formatBRL(createdAppointment.servicePrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Paciente:</span>
                  <span className="font-medium text-stone-900">{createdAppointment.clientName}</span>
                </div>
              </div>

              {/* Prominent WhatsApp Confirmation Button */}
              <div className="space-y-3 pt-2 max-w-md mx-auto">
                <a
                  href={getWhatsAppAppointmentConfirmUrl(
                    clinicProfile.whatsappNumber,
                    createdAppointment.clientName,
                    createdAppointment.serviceName,
                    createdAppointment.date,
                    createdAppointment.time,
                    createdAppointment.servicePrice
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all transform active:scale-[0.99]"
                >
                  <MessageCircle className="w-5 h-5 fill-white/20" />
                  <span>Confirmar no WhatsApp da Clínica</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs font-medium text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Fechar janela
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
