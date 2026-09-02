import React, { useState } from 'react';
import { Reservation } from '../types';
import {
  Smartphone,
  CheckCircle2,
  Upload,
  Camera,
  Clock,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Key,
  X,
  ArrowRight,
  Check,
  Building2,
  Calendar,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MobileCheckInModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  reservation?: Reservation | null;
}> = ({ isOpen, onClose, reservation }) => {
  const { currentProperty, addToast, refreshData, apiFetch } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [eta, setEta] = useState('15:00');
  const [idUploaded, setIdUploaded] = useState(false);
  const [signatureSigned, setSignatureSigned] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>('ocean_view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !reservation) return null;

  const handleCompleteCheckIn = async () => {
    setIsSubmitting(true);
    try {
      // Update reservation status to checked_in or confirmed with arrival time
      await apiFetch(`/api/reservations/${reservation.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'checked_in',
          notes: `Express Mobile Web Check-In completed. ETA: ${eta}. ID verified.`,
        }),
      });

      setStep(4);
      addToast('success', `Express Mobile Check-In complete for ${reservation.guest.name}!`);
      refreshData();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to complete mobile check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Smartphone Mock Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">Guest Mobile Check-In Portal</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Smartphone Screen Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className={step >= 1 ? 'text-indigo-400' : ''}>1. Arrival & ID</span>
            <span className={step >= 2 ? 'text-indigo-400' : ''}>2. Upgrades</span>
            <span className={step >= 3 ? 'text-indigo-400' : ''}>3. Signature</span>
            <span className={step === 4 ? 'text-emerald-400' : ''}>4. Room Key</span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          {/* STEP 1: Identification & ETA */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <div className="text-xs text-slate-400">Welcome to</div>
                <div className="text-base font-black text-white">{currentProperty?.name || 'Vanguard Resort'}</div>
                <div className="text-xs text-indigo-300 font-medium">
                  {reservation.guest.name} • Conf: {reservation.confirmationCode}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">Estimated Arrival Time (ETA)</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['13:00', '15:00', '18:00', '20:00', '22:00', 'Late Night'].map(t => (
                    <button
                      key={t}
                      onClick={() => setEta(t)}
                      className={`py-2 px-1 rounded-xl border text-center font-semibold transition cursor-pointer ${
                        eta === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-300">Passport / Government ID Verification</label>
                <div 
                  onClick={() => setIdUploaded(true)}
                  className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition ${
                    idUploaded 
                      ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300' 
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {idUploaded ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
                      <span className="text-xs font-bold text-emerald-300">ID Document Uploaded & Verified</span>
                      <span className="text-[10px] text-emerald-400/80">Passport OCR Matched</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-indigo-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-200">Tap to Scan or Upload Photo ID</span>
                      <span className="text-[10px] text-slate-500">Government ID / Driver's License</span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-2 mt-4"
              >
                <span>Continue to Stay Preferences</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Tailored Upgrades */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-xs font-bold text-slate-200">Personalize Your Stay (Instant Confirmation)</div>

              <div className="space-y-2.5">
                {[
                  { id: 'ocean_view', title: 'High-Floor Ocean View Guarantee', price: '+$35/night', desc: 'Floors 8-12 with panoramic balcony vistas' },
                  { id: 'early_checkin', title: 'Guaranteed 12:00 Early Check-In', price: '+$25 flat', desc: 'Priority housekeeping priority ready by noon' },
                  { id: 'champagne', title: 'Chilled Champagne & Artisan Truffles', price: '+$55 package', desc: 'Placed in room prior to your arrival' },
                ].map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedUpgrade(selectedUpgrade === opt.id ? null : opt.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                      selectedUpgrade === opt.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold">{opt.title}</div>
                      <div className="text-[11px] text-slate-400">{opt.desc}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-300">{opt.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="w-2/3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Terms & Signature</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Terms & Digital Signature */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-200 text-xs">Hotel Terms & Smoke-Free Policy</div>
                <p>By checking in, I acknowledge 100% smoke-free room policy and agree to incidental hold on file.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">Digital Guest Signature</label>
                <div 
                  onClick={() => setSignatureSigned(true)}
                  className={`h-24 rounded-2xl border-2 flex items-center justify-center cursor-pointer transition ${
                    signatureSigned
                      ? 'border-indigo-500 bg-slate-950 text-indigo-300'
                      : 'border-dashed border-slate-700 bg-slate-800/40 text-slate-400'
                  }`}
                >
                  {signatureSigned ? (
                    <div className="font-serif italic text-2xl tracking-widest text-indigo-400">
                      {reservation.guest.name}
                    </div>
                  ) : (
                    <span className="text-xs">Tap to Sign Digitally</span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleCompleteCheckIn}
                  disabled={isSubmitting}
                  className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Confirming...' : 'Complete Check-In'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Mobile Room Key Active */}
          {step === 4 && (
            <div className="space-y-5 text-center py-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">You're Checked In!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Room <strong className="text-white">{reservation.roomId ? reservation.roomId.replace('room-', '').toUpperCase() : '102'}</strong> is assigned and ready for entry.
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/40 rounded-2xl p-4 text-left space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold">
                    <Key className="w-4 h-4 text-indigo-400" />
                    <span>Active Mobile Key</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    BLUETOOTH READY
                  </span>
                </div>

                <div className="text-xs text-slate-200">
                  Hold your smartphone near your room door lock when you arrive.
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Simulator
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
