import { ClinicService, ScheduleConfig, Appointment, ClinicProfile } from '../types/index.ts';
import {
  DEFAULT_SERVICES,
  DEFAULT_SCHEDULE_CONFIG,
  DEFAULT_APPOINTMENTS,
  DEFAULT_CLINIC_PROFILE,
} from './defaultData.ts';
import {
  fetchServicesFromSupabase,
  upsertServiceInSupabase,
  deleteServiceInSupabase,
  fetchAppointmentsFromSupabase,
  createAppointmentInSupabase,
  updateAppointmentStatusInSupabase,
  getSupabase,
  migrateAllDataToSupabase,
} from './supabaseClient.ts';

export { migrateAllDataToSupabase };

const KEYS = {
  SERVICES: 'lumiere_clinic_services',
  SCHEDULE: 'lumiere_schedule_config',
  APPOINTMENTS: 'lumiere_appointments',
  PROFILE: 'lumiere_clinic_profile',
};

// --- SERVICES ---
export async function loadServices(): Promise<ClinicService[]> {
  // Try Supabase first if available
  const remote = await fetchServicesFromSupabase();
  if (remote && remote.length > 0) {
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(remote));
    return remote;
  }

  // If Supabase is connected but table is empty, auto-seed the initial aesthetic services!
  if (remote !== null && remote.length === 0) {
    const toSeed = DEFAULT_SERVICES;
    for (const s of toSeed) {
      upsertServiceInSupabase(s).catch(console.error);
    }
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(toSeed));
    return toSeed;
  }

  // Fallback to local storage
  try {
    const local = localStorage.getItem(KEYS.SERVICES);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.error('Error reading services from localStorage:', e);
  }

  // Fallback to defaults
  localStorage.setItem(KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
  return DEFAULT_SERVICES;
}

export async function saveService(service: ClinicService): Promise<ClinicService[]> {
  const current = await loadServices();
  const index = current.findIndex((s) => s.id === service.id);
  let updated: ClinicService[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = service;
  } else {
    updated = [service, ...current];
  }

  localStorage.setItem(KEYS.SERVICES, JSON.stringify(updated));

  // Sync to Supabase in background
  if (getSupabase()) {
    upsertServiceInSupabase(service).catch((err) =>
      console.warn('Failed background sync of service to Supabase:', err)
    );
  }

  return updated;
}

export async function deleteService(id: string): Promise<ClinicService[]> {
  const current = await loadServices();
  const updated = current.filter((s) => s.id !== id);
  localStorage.setItem(KEYS.SERVICES, JSON.stringify(updated));

  if (getSupabase()) {
    deleteServiceInSupabase(id).catch((err) =>
      console.warn('Failed background delete in Supabase:', err)
    );
  }

  return updated;
}

// --- APPOINTMENTS ---
export async function loadAppointments(): Promise<Appointment[]> {
  const remote = await fetchAppointmentsFromSupabase();
  if (remote) {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(remote));
    return remote;
  }

  try {
    const local = localStorage.getItem(KEYS.APPOINTMENTS);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.error('Error reading appointments from localStorage:', e);
  }

  localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(DEFAULT_APPOINTMENTS));
  return DEFAULT_APPOINTMENTS;
}

export async function addAppointment(apt: Appointment): Promise<Appointment[]> {
  const current = await loadAppointments();
  const updated = [apt, ...current];
  localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(updated));

  if (getSupabase()) {
    createAppointmentInSupabase(apt).catch((err) =>
      console.warn('Failed background appointment create in Supabase:', err)
    );
  }

  return updated;
}

export async function updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment[]> {
  const current = await loadAppointments();
  const updated = current.map((a) => (a.id === id ? { ...a, status } : a));
  localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(updated));

  if (getSupabase()) {
    updateAppointmentStatusInSupabase(id, status).catch((err) =>
      console.warn('Failed background appointment status update in Supabase:', err)
    );
  }

  return updated;
}

// --- SCHEDULE CONFIG ---
export function loadScheduleConfig(): ScheduleConfig {
  try {
    const local = localStorage.getItem(KEYS.SCHEDULE);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.error('Error reading schedule from localStorage:', e);
  }
  return DEFAULT_SCHEDULE_CONFIG;
}

export function saveScheduleConfig(config: ScheduleConfig): void {
  localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(config));
}

// --- CLINIC PROFILE ---
export function loadClinicProfile(): ClinicProfile {
  try {
    const local = localStorage.getItem(KEYS.PROFILE);
    if (local) {
      const parsed = JSON.parse(local);
      let changed = false;
      // Migrate old placeholder numbers to the user's requested number
      if (!parsed.whatsappNumber || parsed.whatsappNumber === '5511987654321') {
        parsed.whatsappNumber = '5511993996068';
        parsed.phone = '(11) 99399-6068';
        changed = true;
      }
      // Migrate practitioner name
      if (!parsed.practitionerName || parsed.practitionerName === 'Dra. Letícia Gabrielly') {
        parsed.practitionerName = 'Dra. Letícia Gabriella';
        changed = true;
      }
      if (changed) {
        localStorage.setItem(KEYS.PROFILE, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading profile from localStorage:', e);
  }
  return DEFAULT_CLINIC_PROFILE;
}

export function saveClinicProfile(profile: ClinicProfile): void {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}
