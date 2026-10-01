export interface ClinicService {
  id: string;
  name: string;
  category: 'injetaveis' | 'facial' | 'laser' | 'corporal' | 'outros';
  durationMinutes: number;
  price: number;
  description: string;
  imageUrl: string;
  active: boolean;
  benefits?: string[];
}

export interface ScheduleConfig {
  daysOfWeek: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startHour: string; // "09:00"
  endHour: string; // "19:00"
  intervalMinutes: number; // 30, 45, 60
  lunchBreakStart?: string; // "12:00"
  lunchBreakEnd?: string; // "13:00"
  blockedDates: string[]; // YYYY-MM-DD
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface ClinicProfile {
  name: string;
  practitionerName: string;
  title: string;
  phone: string;
  whatsappNumber: string; // Digits only with country code, e.g. "5511999998888"
  instagram: string;
  address: string;
  bio: string;
  bookingNotice?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastTested?: string;
}
