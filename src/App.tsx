/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { CustomerBooking } from './components/CustomerBooking.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import {
  ClinicService,
  ScheduleConfig,
  Appointment,
  ClinicProfile,
  SupabaseConfig,
  AppointmentStatus,
} from './types/index.ts';
import {
  loadServices,
  saveService,
  deleteService,
  loadAppointments,
  addAppointment,
  updateAppointmentStatus,
  loadScheduleConfig,
  saveScheduleConfig,
  loadClinicProfile,
  saveClinicProfile,
} from './lib/storage.ts';
import { getStoredSupabaseConfig } from './lib/supabaseClient.ts';

export default function App() {
  const [activeView, setActiveView] = useState<'client' | 'admin'>('client');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('lumiere_admin_logged_in') === 'true';
  });

  // Data States
  const [services, setServices] = useState<ClinicService[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(loadScheduleConfig());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile>(loadClinicProfile());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedServiceIdForBooking, setSelectedServiceIdForBooking] = useState<string | null>(null);

  // Initial Data Load
  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      try {
        const [loadedServices, loadedAppointments] = await Promise.all([
          loadServices(),
          loadAppointments(),
        ]);
        setServices(loadedServices);
        setAppointments(loadedAppointments);
      } catch (err) {
        console.error('Error initializing app data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  // Handlers for Services
  const handleSaveService = async (service: ClinicService) => {
    const updated = await saveService(service);
    setServices(updated);
  };

  const handleDeleteService = async (id: string) => {
    const updated = await deleteService(id);
    setServices(updated);
  };

  // Handlers for Appointments
  const handleSaveAppointment = async (apt: Appointment) => {
    const updated = await addAppointment(apt);
    setAppointments(updated);
  };

  const handleUpdateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    const updated = await updateAppointmentStatus(id, status);
    setAppointments(updated);
  };

  // Handlers for Schedule and Profile
  const handleSaveSchedule = (config: ScheduleConfig) => {
    saveScheduleConfig(config);
    setScheduleConfig(config);
  };

  const handleSaveProfile = (profile: ClinicProfile) => {
    saveClinicProfile(profile);
    setClinicProfile(profile);
  };

  // Login & Logout
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    localStorage.setItem('lumiere_admin_logged_in', 'true');
    setActiveView('admin');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('lumiere_admin_logged_in');
    setActiveView('client');
  };

  const handleOpenBookingWithService = (serviceId: string) => {
    setSelectedServiceIdForBooking(serviceId);
    setIsBookingModalOpen(true);
  };

  const handleOpenGeneralBooking = () => {
    setSelectedServiceIdForBooking(null);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        profile={clinicProfile}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAdminLogin={() => setIsLoginModalOpen(true)}
        isLoggedIn={isLoggedIn}
        onOpenBooking={handleOpenGeneralBooking}
        isSupabaseConnected={supabaseConfig.isConnected}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'admin' && isLoggedIn ? (
          <AdminDashboard
            services={services}
            scheduleConfig={scheduleConfig}
            appointments={appointments}
            clinicProfile={clinicProfile}
            supabaseConfig={supabaseConfig}
            onSaveService={handleSaveService}
            onDeleteService={handleDeleteService}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onSaveSchedule={handleSaveSchedule}
            onSaveProfile={handleSaveProfile}
            onUpdateSupabaseConfig={setSupabaseConfig}
            onLogout={handleLogout}
            onViewClientPortal={() => setActiveView('client')}
          />
        ) : (
          <CustomerBooking
            services={services}
            clinicProfile={clinicProfile}
            onSelectServiceToBook={handleOpenBookingWithService}
            onOpenGeneralBooking={handleOpenGeneralBooking}
          />
        )}
      </main>

      {/* Booking Modal for Patients */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        services={services}
        initialServiceId={selectedServiceIdForBooking}
        scheduleConfig={scheduleConfig}
        existingAppointments={appointments}
        clinicProfile={clinicProfile}
        onSaveAppointment={handleSaveAppointment}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
