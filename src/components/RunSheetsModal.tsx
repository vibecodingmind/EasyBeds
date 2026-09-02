import React, { useState, useEffect } from 'react';
import { Reservation, Room, HousekeepingTask } from '../types';
import {
  Printer,
  Download,
  Calendar,
  Users,
  Sparkles,
  BedDouble,
  Receipt,
  CheckCircle2,
  Clock,
  X,
  FileText,
  Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';

export const RunSheetsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { currentProperty, apiFetch, addToast } = useApp();

  const [sheetType, setSheetType] = useState<'arrivals' | 'departures' | 'inhouse' | 'housekeeping' | 'nightaudit'>('arrivals');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-09-01');

  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      apiFetch('/api/reservations').catch(() => []),
      apiFetch('/api/rooms').catch(() => []),
      apiFetch('/api/housekeeping/tasks').catch(() => []),
    ]).then(([resv, rms, tsk]) => {
      setReservations(resv || []);
      setRooms(rms || []);
      setTasks(tsk || []);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter datasets
  const arrivalsList = reservations.filter(r => r.checkInDate === selectedDate && r.status !== 'cancelled');
  const departuresList = reservations.filter(r => r.checkOutDate === selectedDate && r.status !== 'cancelled');
  const inHouseList = reservations.filter(r => r.status === 'checked_in');

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let rows: string[][] = [];
    let filename = `runsheet-${sheetType}-${selectedDate}.csv`;

    if (sheetType === 'arrivals') {
      rows.push(['Confirmation', 'Guest Name', 'Room #', 'Nights', 'Guests', 'Balance Due', 'Source', 'Special Requests']);
      arrivalsList.forEach(r => {
        rows.push([
          r.confirmationCode,
          `"${r.guest.name}"`,
          r.roomId ? r.roomId.replace('room-', '').toUpperCase() : 'UNASSIGNED',
          String(r.nights),
          String(r.adults + r.children),
          `$${r.balanceDue}`,
          r.source,
          `"${r.specialRequests || 'None'}"`,
        ]);
      });
    } else if (sheetType === 'departures') {
      rows.push(['Confirmation', 'Guest Name', 'Room #', 'Stay Total', 'Balance Due', 'Payment Status']);
      departuresList.forEach(r => {
        rows.push([
          r.confirmationCode,
          `"${r.guest.name}"`,
          r.roomId ? r.roomId.replace('room-', '').toUpperCase() : 'N/A',
          `$${r.totalAmount}`,
          `$${r.balanceDue}`,
          r.balanceDue === 0 ? 'SETTLED' : 'DUE',
        ]);
      });
    } else if (sheetType === 'inhouse') {
      rows.push(['Room #', 'Guest Name', 'Arrival', 'Departure', 'Adults', 'Children', 'Folio Balance']);
      inHouseList.forEach(r => {
        rows.push([
          r.roomId ? r.roomId.replace('room-', '').toUpperCase() : 'N/A',
          `"${r.guest.name}"`,
          r.checkInDate,
          r.checkOutDate,
          String(r.adults),
          String(r.children),
          `$${r.balanceDue}`,
        ]);
      });
    } else {
      rows.push(['Room #', 'Status', 'Priority', 'Attendant', 'Notes']);
      rooms.forEach(rm => {
        rows.push([
          rm.number,
          rm.status.toUpperCase(),
          rm.status === 'dirty' ? 'HIGH' : 'NORMAL',
          'Housekeeping Team',
          rm.notes || 'Routine cleaning',
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', `Exported ${filename} successfully`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Daily Operational Run Sheets</h2>
              <p className="text-xs text-slate-500">Official Front Desk & Housekeeping Audit Printouts</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setSheetType('arrivals')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                sheetType === 'arrivals' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Arrivals ({arrivalsList.length})
            </button>
            <button
              onClick={() => setSheetType('departures')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                sheetType === 'departures' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Departures ({departuresList.length})
            </button>
            <button
              onClick={() => setSheetType('inhouse')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                sheetType === 'inhouse' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              In-House Manifest ({inHouseList.length})
            </button>
            <button
              onClick={() => setSheetType('housekeeping')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                sheetType === 'housekeeping' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Housekeeping Roster ({rooms.length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-500">Operational Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Printable Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-white font-sans text-xs">
          {/* Printable Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-start justify-between">
            <div>
              <div className="text-xl font-black uppercase tracking-tight text-slate-900">
                {currentProperty?.name || 'VANGUARD GRAND HOTEL'}
              </div>
              <div className="text-xs text-slate-500">
                Daily Operational Manifest • Run Sheet: <span className="font-bold text-slate-800 uppercase">{sheetType}</span>
              </div>
            </div>
            <div className="text-right text-slate-600">
              <div className="font-mono font-bold text-sm text-slate-900">{selectedDate}</div>
              <div className="text-[10px]">Generated: {format(new Date(), 'HH:mm:ss')} • Front Desk Copy</div>
            </div>
          </div>

          {/* Tables by Sheet Type */}
          {sheetType === 'arrivals' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Code</th>
                    <th className="py-2 px-2">Guest Name</th>
                    <th className="py-2 px-2">Room</th>
                    <th className="py-2 px-2">Nights</th>
                    <th className="py-2 px-2">Pax</th>
                    <th className="py-2 px-2">Channel</th>
                    <th className="py-2 px-2 text-right">Balance Due</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Special Requests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {arrivalsList.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono font-bold text-indigo-700">{r.confirmationCode}</td>
                      <td className="py-2 px-2 font-semibold text-slate-900">{r.guest.name}</td>
                      <td className="py-2 px-2 font-bold">{r.roomId ? r.roomId.replace('room-', '').toUpperCase() : '—'}</td>
                      <td className="py-2 px-2">{r.nights}n</td>
                      <td className="py-2 px-2">{r.adults + r.children}</td>
                      <td className="py-2 px-2 capitalize">{r.source.replace('_', '.')}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold">${r.balanceDue}</td>
                      <td className="py-2 px-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-500 italic max-w-xs truncate">{r.specialRequests || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sheetType === 'departures' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Code</th>
                    <th className="py-2 px-2">Guest Name</th>
                    <th className="py-2 px-2">Room</th>
                    <th className="py-2 px-2">Stay Value</th>
                    <th className="py-2 px-2 text-right">Balance Due</th>
                    <th className="py-2 px-2 text-center">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departuresList.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono font-bold text-indigo-700">{r.confirmationCode}</td>
                      <td className="py-2 px-2 font-semibold text-slate-900">{r.guest.name}</td>
                      <td className="py-2 px-2 font-bold">{r.roomId ? r.roomId.replace('room-', '').toUpperCase() : '—'}</td>
                      <td className="py-2 px-2 font-mono">${r.totalAmount}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold">${r.balanceDue}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.balanceDue === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {r.balanceDue === 0 ? 'PAID IN FULL' : 'PAYMENT DUE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sheetType === 'inhouse' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Room</th>
                    <th className="py-2 px-2">Guest Name</th>
                    <th className="py-2 px-2">Arrival</th>
                    <th className="py-2 px-2">Departure</th>
                    <th className="py-2 px-2">Pax</th>
                    <th className="py-2 px-2">Channel</th>
                    <th className="py-2 px-2 text-right">Folio Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inHouseList.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono font-bold text-indigo-700">{r.roomId ? r.roomId.replace('room-', '').toUpperCase() : '—'}</td>
                      <td className="py-2 px-2 font-semibold text-slate-900">{r.guest.name}</td>
                      <td className="py-2 px-2 font-mono">{r.checkInDate}</td>
                      <td className="py-2 px-2 font-mono">{r.checkOutDate}</td>
                      <td className="py-2 px-2">{r.adults + r.children}</td>
                      <td className="py-2 px-2 capitalize">{r.source.replace('_', '.')}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold">${r.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sheetType === 'housekeeping' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Room #</th>
                    <th className="py-2 px-2">Floor</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2">Cleaning Status</th>
                    <th className="py-2 px-2">Priority</th>
                    <th className="py-2 px-2">Sign-Off Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rooms.map(rm => (
                    <tr key={rm.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono font-bold text-slate-900">{rm.number}</td>
                      <td className="py-2 px-2">Floor {rm.floor}</td>
                      <td className="py-2 px-2 font-medium">{rm.roomTypeId.replace('rt-', '').toUpperCase()}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rm.status === 'clean' ? 'bg-emerald-100 text-emerald-800' :
                          rm.status === 'dirty' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {rm.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-semibold text-slate-700">
                        {rm.status === 'dirty' ? 'High (Departure)' : 'Standard'}
                      </td>
                      <td className="py-2 px-2 text-slate-400 font-mono">[  ] Cleaned & Inspected</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
