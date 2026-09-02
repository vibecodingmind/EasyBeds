import React, { useState } from 'react';
import { Reservation, Room } from '../types';
import {
  Key,
  Smartphone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Radio,
  Lock,
  Unlock,
  ShieldCheck,
  X,
  RefreshCw,
  QrCode,
  Copy,
  Zap,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DigitalKeycardModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  reservation?: Reservation | null;
}> = ({ isOpen, onClose, reservation }) => {
  const { currentProperty, addToast } = useApp();

  const [keyType, setKeyType] = useState<'rfid_card' | 'mobile_bluetooth'>('rfid_card');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(
    reservation?.roomId ? reservation.roomId.replace('room-', '').toUpperCase() : '101'
  );
  const [guestName, setGuestName] = useState(reservation?.guest.name || 'Jane Doe');
  const [validUntil, setValidUntil] = useState(reservation?.checkOutDate || '2026-09-05');
  const [validFrom, setValidFrom] = useState(reservation?.checkInDate || '2026-09-01');

  // Zones permissions
  const [allowPool, setAllowPool] = useState(true);
  const [allowGym, setAllowGym] = useState(true);
  const [allowExecutiveLounge, setAllowExecutiveLounge] = useState(true);
  const [allowParking, setAllowParking] = useState(true);

  // Status
  const [isEncoding, setIsEncoding] = useState(false);
  const [isEncoded, setIsEncoded] = useState(false);
  const [encodedPayload, setEncodedPayload] = useState<{
    cardUid: string;
    jwtToken: string;
    qrData: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleEncodeKey = async () => {
    setIsEncoding(true);
    setIsEncoded(false);

    // Simulate encoder hardware communication
    await new Promise((r) => setTimeout(r, 1200));

    const cardUid = `RFID-MIFARE-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
    const jwtToken = `vng_key_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const qrData = `https://vanguardpms.io/mobile-key?token=${jwtToken}&room=${selectedRoomNumber}`;

    setEncodedPayload({ cardUid, jwtToken, qrData });
    setIsEncoding(false);
    setIsEncoded(true);
    addToast('success', `Smart Key successfully issued for Room ${selectedRoomNumber} (${guestName})`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Digital Keycard & Lock Encoder</h2>
              <p className="text-[11px] text-slate-400">Assa Abloy / Salto / Dormakaba Smart Lock Interface</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Key Medium Selector */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => { setKeyType('rfid_card'); setIsEncoded(false); }}
              className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                keyType === 'rfid_card'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${keyType === 'rfid_card' ? 'text-indigo-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-xs font-bold leading-none">RFID Keycard</div>
                <div className="text-[10px] text-slate-400 mt-1">Mifare / NFC Physical Card</div>
              </div>
            </button>

            <button
              onClick={() => { setKeyType('mobile_bluetooth'); setIsEncoded(false); }}
              className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                keyType === 'mobile_bluetooth'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Smartphone className={`w-5 h-5 ${keyType === 'mobile_bluetooth' ? 'text-indigo-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-xs font-bold leading-none">Mobile Key Link</div>
                <div className="text-[10px] text-slate-400 mt-1">BLE / Apple Wallet / Web</div>
              </div>
            </button>
          </div>

          {/* Form Fields */}
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Target Room #</label>
                <input
                  type="text"
                  value={selectedRoomNumber}
                  onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Guest Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Check-In Time</label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Check-Out (Expiry)</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Access Permissions Checks */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Common Amenity Access Zones</label>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPool}
                    onChange={(e) => setAllowPool(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Pool & Sun Deck</span>
                </label>

                <label className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowGym}
                    onChange={(e) => setAllowGym(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Fitness Center</span>
                </label>

                <label className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowExecutiveLounge}
                    onChange={(e) => setAllowExecutiveLounge(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Executive Lounge</span>
                </label>

                <label className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowParking}
                    onChange={(e) => setAllowParking(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Underground Parking</span>
                </label>
              </div>
            </div>
          </div>

          {/* Key Encoding Visualizer */}
          {isEncoded && encodedPayload && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Encoded Successfully</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded">
                  {keyType === 'rfid_card' ? 'NFC Track Written' : 'Bluetooth Token Active'}
                </span>
              </div>

              {keyType === 'rfid_card' ? (
                <div className="bg-slate-900/90 rounded-lg p-3 text-xs space-y-1 font-mono text-slate-300 border border-slate-800">
                  <div>UID: <span className="text-white font-bold">{encodedPayload.cardUid}</span></div>
                  <div>Sector 04: <span className="text-indigo-400">ROOM_{selectedRoomNumber}_VALID_UNTIL_{validUntil}</span></div>
                  <div>Auth: <span className="text-emerald-400">AES-128 PASSKEY VERIFIED</span></div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 bg-slate-900/90 rounded-lg p-3 border border-slate-800">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                    <QrCode className="w-14 h-14 text-slate-950" />
                  </div>
                  <div className="min-w-0 flex-1 text-xs space-y-1">
                    <div className="font-bold text-white truncate">Guest Mobile Key Pass</div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">{encodedPayload.jwtToken}</div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(encodedPayload.qrData);
                        addToast('info', 'Mobile Key link copied to clipboard');
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy Guest SMS Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Trigger */}
          <div className="pt-2">
            <button
              onClick={handleEncodeKey}
              disabled={isEncoding}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isEncoding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Communicating with Door Lock Hardware...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>{keyType === 'rfid_card' ? 'Place Card & Write RFID Token' : 'Generate Mobile Key Access'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
