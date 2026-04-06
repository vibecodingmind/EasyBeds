'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Star, MessageSquare, Send, RefreshCw, Filter, ThumbsUp,
  ThumbsDown, Minus, User, Calendar, ChevronDown, ChevronUp, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface ReviewItem {
  id: string
  overallRating: number
  cleanliness: number | null
  service: number | null
  location: number | null
  value: number | null
  comment: string | null
  response: string | null
  respondedAt: string | null
  source: string
  createdAt: string
  guest: { id: string; firstName: string; lastName: string }
  booking: { id: string; confirmationCode: string; room?: { name: string; roomNumber: string } }
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  avgCleanliness: number | null
  avgService: number | null
  avgLocation: number | null
  avgValue: number | null
  ratingDistribution: Record<number, number>
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`${starSize} ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

function SentimentBadge({ rating }: { rating: number }) {
  if (rating >= 4) return <Badge className="bg-green-100 text-green-700 text-xs gap-1"><ThumbsUp className="h-3 w-3" /> Positive</Badge>
  if (rating >= 3) return <Badge className="bg-yellow-100 text-yellow-700 text-xs gap-1"><Minus className="h-3 w-3" /> Neutral</Badge>
  return <Badge className="bg-red-100 text-red-700 text-xs gap-1"><ThumbsDown className="h-3 w-3" /> Negative</Badge>
}

export function ReviewsView() {
  const { currentHotelId } = useAppStore()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ minRating: '', hasResponse: '', sortBy: 'createdAt' })
  const [respondOpen, setRespondOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responding, setResponding] = useState(false)
  const [requestBookingId, setRequestBookingId] = useState('')
  const [requestSending, setRequestSending] = useState(false)
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())

  const fetchReviews = useCallback(async () => {
    if (!currentHotelId) return
    setLoading(true)
    try {
      const sp = new URLSearchParams({ hotelId: currentHotelId, limit: '50' })
      if (filters.minRating) sp.set('minRating', filters.minRating)
      if (filters.hasResponse) sp.set('hasResponse', filters.hasResponse)
      if (filters.sortBy) sp.set('sortBy', filters.sortBy)
      const res = await fetch(`/api/reviews?${sp}`)
      const json = await res.json()
      if (json.success) {
        setReviews(json.data.reviews)
        setStats(json.data.stats)
      }
    } catch { console.error('Failed to fetch reviews') } finally { setLoading(false) }
  }, [currentHotelId, filters])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const toggleExpanded = (id: string) => {
    setExpandedReviews(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const handleRespond = async () => {
    if (!selectedReview || !responseText.trim()) return
    setResponding(true)
    try {
      const res = await fetch(`/api/reviews/${selectedReview.id}/respond?hotelId=${currentHotelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ response: responseText.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Response submitted')
        setRespondOpen(false)
        setResponseText('')
        fetchReviews()
      } else { toast.error(json.error) }
    } catch { toast.error('Failed to submit response') } finally { setResponding(false) }
  }

  const handleRequestReview = async () => {
    if (!requestBookingId.trim()) return
    setRequestSending(true)
    try {
      const res = await fetch('/api/reviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ bookingId: requestBookingId.trim(), hotelId: currentHotelId }),
      })
      const json = await res.json()
      if (json.success) { toast.success('Review request sent'); setRequestBookingId('') }
      else { toast.error(json.error) }
    } catch { toast.error('Failed to request review') } finally { setRequestSending(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reviews</h2>
          <p className="text-muted-foreground">Monitor guest reviews, respond to feedback, and request new reviews.</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><MessageSquare className="h-4 w-4 mr-2" /> Request Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a Review</DialogTitle>
                <DialogDescription>Send a review request for a completed booking.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Label>Booking ID</Label>
                <Input value={requestBookingId} onChange={e => setRequestBookingId(e.target.value)} placeholder="Enter booking ID" />
              </div>
              <DialogFooter>
                <Button onClick={handleRequestReview} disabled={requestSending || !requestBookingId.trim()}>
                  {requestSending ? 'Sending...' : 'Send Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={fetchReviews}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-amber-500">{stats.averageRating}</p>
                <StarRating rating={Math.round(stats.averageRating)} size="md" />
                <p className="text-sm text-muted-foreground mt-1">{stats.totalReviews} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map(r => {
                  const count = stats.ratingDistribution[r] || 0
                  const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
                  return (
                    <div key={r} className="flex items-center gap-2">
                      <span className="text-xs w-3">{r}</span>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          {[
            { label: 'Cleanliness', value: stats.avgCleanliness },
            { label: 'Service', value: stats.avgService },
            { label: 'Location', value: stats.avgLocation },
          ].map(cat => (
            <Card key={cat.label}>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">{cat.label}</p>
                <p className="text-2xl font-bold mt-1">{cat.value !== null ? cat.value.toFixed(1) : '—'}</p>
                {cat.value !== null && <StarRating rating={Math.round(cat.value)} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filters.minRating} onValueChange={v => setFilters(p => ({ ...p, minRating: v }))}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Min Rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {[5,4,3,2,1].map(r => <SelectItem key={r} value={r.toString()}>{r}+ Stars</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.hasResponse} onValueChange={v => setFilters(p => ({ ...p, hasResponse: v }))}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Response" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Responded</SelectItem>
                <SelectItem value="false">Not Responded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sortBy} onValueChange={v => setFilters(p => ({ ...p, sortBy: v }))}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Sort By" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No reviews found</p>
            <p className="text-sm">Reviews will appear here when guests leave feedback</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id} className={review.response ? 'border-green-200' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {review.guest.firstName[0]}{review.guest.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium">{review.guest.firstName} {review.guest.lastName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{review.booking.confirmationCode}</span>
                        {review.booking.room && <span>· {review.booking.room.name}</span>}
                        <span>· {new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SentimentBadge rating={review.overallRating} />
                    {review.response && <Badge variant="outline" className="text-green-600 border-green-200 text-xs">Responded</Badge>}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-4">
                    <StarRating rating={review.overallRating} size="md" />
                    <span className="text-lg font-bold">{review.overallRating}.0</span>
                  </div>
                </div>

                {/* Category Ratings */}
                {(review.cleanliness || review.service || review.location || review.value) && (
                  <div className="flex flex-wrap gap-4 mt-3 text-xs">
                    {review.cleanliness && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        Cleanliness: <StarRating rating={review.cleanliness} /> {review.cleanliness}
                      </span>
                    )}
                    {review.service && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        Service: <StarRating rating={review.service} /> {review.service}
                      </span>
                    )}
                    {review.location && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        Location: <StarRating rating={review.location} /> {review.location}
                      </span>
                    )}
                    {review.value && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        Value: <StarRating rating={review.value} /> {review.value}
                      </span>
                    )}
                  </div>
                )}

                {review.comment && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleExpanded(review.id)}
                      className="text-sm text-left text-gray-700 hover:text-gray-900"
                    >
                      {expandedReviews.has(review.id) || review.comment.length <= 200
                        ? review.comment
                        : review.comment.slice(0, 200) + '...'}
                      {review.comment.length > 200 && (
                        <span className="text-emerald-600 ml-1">
                          {expandedReviews.has(review.id) ? 'less' : 'more'}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Response */}
                {review.response && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Management Response</p>
                    <p className="text-sm text-emerald-900">{review.response}</p>
                    {review.respondedAt && (
                      <p className="text-xs text-emerald-500 mt-1">
                        {new Date(review.respondedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedReview(review); setResponseText(review.response || ''); setRespondOpen(true) }}
                    className="text-xs"
                  >
                    {review.response ? 'Edit Response' : <><Send className="h-3 w-3 mr-1" /> Respond</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              {selectedReview && `${selectedReview.guest.firstName} ${selectedReview.guest.lastName} — ${selectedReview.overallRating}/5 stars`}
            </DialogDescription>
          </DialogHeader>
          {selectedReview && selectedReview.comment && (
            <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 border">
              &quot;{selectedReview.comment}&quot;
            </div>
          )}
          <div className="space-y-2">
            <Label>Your Response</Label>
            <Textarea
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              placeholder="Write a thoughtful response to this review..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{responseText.length}/2000 characters</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondOpen(false)}>Cancel</Button>
            <Button onClick={handleRespond} disabled={responding || !responseText.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {responding ? 'Submitting...' : 'Submit Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
