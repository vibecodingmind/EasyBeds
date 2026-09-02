import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { ReservationsView } from './components/ReservationsView';
import { FrontDeskView } from './components/FrontDeskView';
import { ChannelManagerView } from './components/ChannelManagerView';
import { RatesAvailabilityView } from './components/RatesAvailabilityView';
import { RoomsView } from './components/RoomsView';
import { HousekeepingView } from './components/HousekeepingView';
import { MaintenanceView } from './components/MaintenanceView';
import { FinanceView } from './components/FinanceView';
import { GuestsView } from './components/GuestsView';
import { MessagesView } from './components/MessagesView';
import { ReviewsView } from './components/ReviewsView';
import { TasksView } from './components/TasksView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PlatformAdminView } from './components/PlatformAdminView';
import { ModuleManagerView } from './components/ModuleManagerView';
import { RestaurantView } from './components/RestaurantView';
import { KDSView } from './components/KDSView';
import { PoolView } from './components/PoolView';
import { InventoryView } from './components/InventoryView';
import { AuditLogsView } from './components/AuditLogsView';
import { GroupBlocksView } from './components/GroupBlocksView';
import { ReservationModal } from './components/ReservationModal';
import { FolioModal } from './components/FolioModal';
import { Reservation } from './types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeView, toasts, removeToast, refreshData } = useApp();
  
  // Modal states
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [newBookingRoomId, setNewBookingRoomId] = useState<string | undefined>();
  const [newBookingDate, setNewBookingDate] = useState<string | undefined>();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const handleOpenNewBooking = () => {
    setNewBookingRoomId(undefined);
    setNewBookingDate(undefined);
    setIsNewBookingOpen(true);
  };

  const handleOpenNewBookingWithParams = (roomId: string, date: string) => {
    setNewBookingRoomId(roomId);
    setNewBookingDate(date);
    setIsNewBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header 
        onOpenNewReservation={handleOpenNewBooking} 
        onSelectReservation={setSelectedReservation}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar onOpenNewBooking={handleOpenNewBooking} />

        {/* Dynamic Viewport Container */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeView === 'dashboard' && (
            <DashboardView
              onOpenNewBooking={handleOpenNewBooking}
              onSelectReservation={setSelectedReservation}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              onSelectReservation={setSelectedReservation}
              onOpenNewBookingWithParams={handleOpenNewBookingWithParams}
            />
          )}

          {activeView === 'reservations' && (
            <ReservationsView
              onOpenNewBooking={handleOpenNewBooking}
              onSelectReservation={setSelectedReservation}
            />
          )}

          {activeView === 'frontdesk' && (
            <FrontDeskView
              onOpenNewBooking={handleOpenNewBooking}
              onSelectReservation={setSelectedReservation}
            />
          )}

          {activeView === 'group-blocks' && <GroupBlocksView />}
          {activeView === 'channel-manager' && <ChannelManagerView />}
          {activeView === 'rates-availability' && <RatesAvailabilityView />}
          {activeView === 'rooms' && <RoomsView />}
          {activeView === 'housekeeping' && <HousekeepingView />}
          {activeView === 'maintenance' && <MaintenanceView />}
          {activeView === 'finance' && <FinanceView />}
          {activeView === 'guests' && <GuestsView />}
          {activeView === 'messages' && <MessagesView />}
          {activeView === 'reviews' && <ReviewsView />}
          {activeView === 'tasks' && <TasksView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === 'settings' && <SettingsView />}
          {(activeView === 'platform-admin' || activeView.startsWith('platform-')) && (
            <PlatformAdminView defaultTab={activeView} />
          )}
          {activeView === 'module-manager' && <ModuleManagerView />}
          {activeView === 'restaurant' && <RestaurantView />}
          {activeView === 'kds' && <KDSView />}
          {activeView === 'pool' && <PoolView />}
          {activeView === 'inventory' && <InventoryView />}
          {activeView === 'audit-logs' && <AuditLogsView />}
        </main>
      </div>

      {/* Create Reservation Modal */}
      <ReservationModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        initialRoomId={newBookingRoomId}
        initialDate={newBookingDate}
        onCreated={refreshData}
      />

      {/* Inspect Folio / Reservation Details Modal */}
      <FolioModal
        isOpen={!!selectedReservation}
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onUpdated={refreshData}
      />

      {/* Floating Notifications Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border text-xs font-medium flex items-center justify-between gap-3 transition-all animate-in slide-in-from-bottom-3 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 text-white cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
