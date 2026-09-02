import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Send, User, CheckCheck, Clock, Share2, Sparkles, Zap, Smartphone, Mail, Bell, CheckCircle2 } from 'lucide-react';

interface ChatThread {
  id: string;
  guestName: string;
  roomNumber: string;
  channel: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  messages: { sender: 'guest' | 'hotel'; text: string; time: string }[];
}

export const MessagesView: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'inbox' | 'automations'>('inbox');

  const [workflows, setWorkflows] = useState([
    {
      id: 'wf-1',
      title: 'Pre-Arrival Check-In Link (T-2 Days)',
      trigger: '48 hours before check-in date at 10:00 AM',
      channel: 'WhatsApp & SMS',
      status: 'active',
      template: 'Hi {{guest_name}}! We look forward to welcoming you to {{hotel_name}}. Complete your express mobile check-in here: {{checkin_link}}',
      deliveries: 142,
    },
    {
      id: 'wf-2',
      title: 'Room Is Ready & Digital Key Issued',
      trigger: 'Immediate when Housekeeping marks room "Inspected"',
      channel: 'WhatsApp & Email',
      status: 'active',
      template: 'Good news {{guest_name}}! Room {{room_number}} is clean, inspected, and ready. Unlock your room with your mobile key: {{key_link}}',
      deliveries: 98,
    },
    {
      id: 'wf-3',
      title: 'Mid-Stay Experience Check (Day 2)',
      trigger: 'Day 2 at 11:30 AM',
      channel: 'WhatsApp',
      status: 'active',
      template: 'Hello {{guest_name}}, how is your stay in Room {{room_number}}? Reply directly to this chat if you need anything from the concierge.',
      deliveries: 84,
    },
    {
      id: 'wf-4',
      title: 'Post-Departure Folio & TripAdvisor Review Request',
      trigger: '2 hours after check-out settlement',
      channel: 'Email',
      status: 'active',
      template: 'Dear {{guest_name}}, thank you for staying with us. Here is your final folio receipt: {{folio_pdf}}. We would appreciate your feedback: {{review_link}}',
      deliveries: 215,
    }
  ]);

  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 'th-1',
      guestName: 'Eleanor Vance',
      roomNumber: '101',
      channel: 'booking_com',
      lastMessage: 'Hi! Could we arrange a late checkout around 1:00 PM tomorrow?',
      timestamp: '10:42 AM',
      unread: true,
      messages: [
        { sender: 'guest', text: 'Hello, we are really enjoying our stay in the Ocean Suite!', time: '10:30 AM' },
        { sender: 'hotel', text: 'Thank you Eleanor, let us know if you need anything!', time: '10:35 AM' },
        { sender: 'guest', text: 'Hi! Could we arrange a late checkout around 1:00 PM tomorrow?', time: '10:42 AM' },
      ],
    },
    {
      id: 'th-2',
      guestName: 'Marcus Thorne',
      roomNumber: '201',
      channel: 'airbnb',
      lastMessage: 'We have arrived and checked in smoothly. The room is wonderful.',
      timestamp: 'Yesterday',
      unread: false,
      messages: [
        { sender: 'hotel', text: 'Welcome to Azure Bay Marcus! Your digital keycard is ready.', time: 'Aug 30, 3:00 PM' },
        { sender: 'guest', text: 'We have arrived and checked in smoothly. The room is wonderful.', time: 'Aug 30, 4:15 PM' },
      ],
    },
    {
      id: 'th-3',
      guestName: 'Sophia Lin',
      roomNumber: '301',
      channel: 'direct',
      lastMessage: 'Can we reserve a table at the rooftop bistro for 7:30 PM?',
      timestamp: 'Aug 29',
      unread: false,
      messages: [
        { sender: 'guest', text: 'Can we reserve a table at the rooftop bistro for 7:30 PM?', time: 'Aug 29, 2:10 PM' },
        { sender: 'hotel', text: 'Confirmed! Table for 2 reserved under your room 301.', time: 'Aug 29, 2:15 PM' },
      ],
    },
  ]);

  const [selectedThreadId, setSelectedThreadId] = useState<string>('th-1');
  const [inputText, setInputText] = useState('');

  const activeThread = threads.find(t => t.id === selectedThreadId) || threads[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      sender: 'hotel' as const,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setThreads(prev => prev.map(th => {
      if (th.id === activeThread.id) {
        return {
          ...th,
          lastMessage: newMsg.text,
          timestamp: newMsg.time,
          unread: false,
          messages: [...th.messages, newMsg],
        };
      }
      return th;
    }));

    setInputText('');
    addToast('success', `Message transmitted to ${activeThread.guestName} via ${activeThread.channel.toUpperCase()}`);
  };

  const handleToggleWorkflow = (wfId: string) => {
    setWorkflows(prev => prev.map(w => w.id === wfId ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w));
    addToast('info', 'Automated workflow status updated');
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inbox' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Unified Live Inbox (OTAs & Direct)</span>
          </button>
          <button
            onClick={() => setActiveTab('automations')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'automations' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>WhatsApp & Email Triggered Workflows</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Twilio WhatsApp & SendGrid Connected
        </span>
      </div>

      {activeTab === 'inbox' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs h-[calc(100vh-12rem)] flex overflow-hidden">
          {/* Left Sidebar: Threads List */}
          <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Unified Inbox
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  Direct & OTAs
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {threads.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`p-3.5 cursor-pointer transition flex items-start space-x-3 ${
                    t.id === activeThread.id ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                    {t.guestName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs truncate">{t.guestName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{t.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-indigo-700">Room {t.roomNumber}</span>
                      <span>•</span>
                      <span className="capitalize">{t.channel.replace('_', '.')}</span>
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-1">{t.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Active Chat Conversation */}
          <div className="flex-1 flex flex-col justify-between bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {activeThread.guestName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{activeThread.guestName}</h2>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Room {activeThread.roomNumber}</span>
                    <span>•</span>
                    <span className="font-mono text-purple-700 uppercase font-semibold">
                      Via {activeThread.channel.replace('_', '.')} Messaging API
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Bubble History */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/40">
              {activeThread.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'hotel' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      msg.sender === 'hotel'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Canned Quick Replies & Input */}
            <div className="p-4 border-t border-slate-200 bg-white space-y-3">
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  onClick={() => setInputText('Certainly! We have granted complimentary late checkout until 1:00 PM for Room 101.')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  + Approve Late Checkout
                </button>
                <button
                  onClick={() => setInputText('Your request for fresh towels has been sent to our housekeeping team.')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  + Extra Towels
                </button>
                <button
                  onClick={() => setInputText('Wi-Fi Network: AzureBay-Guest | Password: OceanView2026')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  + Wi-Fi Pass
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type message to guest (synchronized to OTA inbox)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map(wf => (
            <div key={wf.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">{wf.title}</h3>
                    <span className="text-[11px] text-indigo-700 font-mono font-medium">{wf.channel}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleWorkflow(wf.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition cursor-pointer ${
                    wf.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {wf.status}
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
                <div className="text-[11px] text-slate-500">
                  Trigger Event: <strong className="text-slate-800">{wf.trigger}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 leading-relaxed">
                  "{wf.template}"
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Total Delivered: <strong className="font-mono text-slate-800">{wf.deliveries} guests</strong></span>
                <button
                  onClick={() => addToast('success', `Simulated test message sent for "${wf.title}"`)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Test Trigger Now →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

