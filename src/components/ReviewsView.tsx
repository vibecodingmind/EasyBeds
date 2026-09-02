import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Star, MessageSquare, Sparkles, Send, CheckCircle2, ThumbsUp } from 'lucide-react';

interface Review {
  id: string;
  guestName: string;
  channel: string;
  rating: number; // out of 10 or 5
  maxRating: number;
  date: string;
  roomType: string;
  comment: string;
  response?: string;
}

export const ReviewsView: React.FC = () => {
  const { addToast } = useApp();

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 'rev-1',
      guestName: 'Eleanor Vance',
      channel: 'booking_com',
      rating: 9.6,
      maxRating: 10,
      date: '2026-08-28',
      roomType: 'Deluxe Ocean Suite',
      comment: 'Breathtaking ocean views and impeccable housekeeping! The staff remembered our anniversary and left complimentary wine. Will definitely return.',
      response: 'Dear Eleanor, thank you so much for the glowing review! We are delighted you enjoyed your anniversary stay with us.',
    },
    {
      id: 'rev-2',
      guestName: 'Liam O’Connor',
      channel: 'airbnb',
      rating: 5.0,
      maxRating: 5,
      date: '2026-08-25',
      roomType: 'Executive King Room',
      comment: 'Super fast check-in with the digital keycard. The bed was plush and the espresso machine in the room was a great perk.',
    },
    {
      id: 'rev-3',
      guestName: 'Hannah Meyer',
      channel: 'expedia',
      rating: 8.8,
      maxRating: 10,
      date: '2026-08-20',
      roomType: 'Garden Villa',
      comment: 'Peaceful setting, lovely pool. The breakfast buffet was fresh and varied.',
    },
  ]);

  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const handlePostReply = (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text) return;

    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, response: text } : r));
    setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    addToast('success', 'Public management response broadcasted to OTA');
  };

  const handleGenerateDraft = (review: Review) => {
    const draft = `Dear ${review.guestName}, thank you for sharing your feedback following your stay in our ${review.roomType}. We are thrilled you enjoyed your experience and look forward to welcoming you back to our property soon!`;
    setReplyText(prev => ({ ...prev, [review.id]: draft }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Guest Reviews & Reputation Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated guest ratings from Booking.com, Airbnb, Expedia, and direct feedback.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-amber-50 px-3.5 py-1.5 rounded-lg border border-amber-200 text-xs">
          <span className="font-bold text-amber-900">Overall Rating: 9.4 / 10</span>
          <span className="text-amber-700">★ ★ ★ ★ ★ (148 reviews)</span>
        </div>
      </div>

      {/* Reviews Stream */}
      <div className="space-y-4">
        {reviews.map(rev => (
          <div key={rev.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm">{rev.guestName}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize border border-slate-200">
                    {rev.channel.replace('_', '.')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{rev.date}</span>
                </div>
                <div className="text-xs text-indigo-600 font-medium mt-0.5">{rev.roomType}</div>
              </div>

              <div className="flex items-center space-x-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-900 font-bold font-mono text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{rev.rating} / {rev.maxRating}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100 italic">
              "{rev.comment}"
            </p>

            {/* Published Response */}
            {rev.response ? (
              <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 text-xs space-y-1">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Management Response:
                </div>
                <p className="text-indigo-950">{rev.response}</p>
              </div>
            ) : (
              /* Draft & Post Response */
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">Draft Public Response:</span>
                  <button
                    onClick={() => handleGenerateDraft(rev)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Draft Friendly Template
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Write a response to post on OTA..."
                    value={replyText[rev.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  />
                  <button
                    onClick={() => handlePostReply(rev.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Post
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
