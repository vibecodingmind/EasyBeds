'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen, ArrowRight, Clock, User, Tag, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PublicLayout from '@/components/layout/public-layout'
import { cn } from '@/lib/utils'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const blogPosts = [
  {
    title: '5 Revenue Management Strategies Every African Hotel Should Know',
    excerpt: 'Discover proven techniques to maximize your hotel\'s revenue through dynamic pricing, demand forecasting, and channel optimization tailored for the African market.',
    author: 'David Okafor',
    date: 'January 15, 2025',
    readTime: '8 min read',
    category: 'Revenue Management',
    featured: true,
  },
  {
    title: 'How OTA Sync Prevents Double Bookings: A Complete Guide',
    excerpt: 'Double bookings can cost you guests and reputation. Learn how two-way iCal synchronization with platforms like Booking.com and Airbnb keeps your calendar accurate.',
    author: 'Fatima El-Amin',
    date: 'January 8, 2025',
    readTime: '6 min read',
    category: 'Channel Management',
    featured: true,
  },
  {
    title: 'The Rise of AI in African Hospitality: What Hoteliers Need to Know',
    excerpt: 'AI is transforming how hotels operate. From chatbots to dynamic pricing, here\'s how African hotels can leverage AI to stay competitive.',
    author: 'Kwame Asante',
    date: 'December 28, 2024',
    readTime: '10 min read',
    category: 'Technology',
    featured: false,
  },
  {
    title: 'Housekeeping Best Practices: How to Turn Rooms 30% Faster',
    excerpt: 'Efficient housekeeping is key to guest satisfaction. Learn the Kanban-based approach that top hotels use to manage room cleaning and maintenance.',
    author: 'Aisha Patel',
    date: 'December 20, 2024',
    readTime: '5 min read',
    category: 'Operations',
    featured: false,
  },
  {
    title: 'Building Guest Loyalty in the Digital Age',
    excerpt: 'A loyalty program can increase repeat bookings by 25%. Learn how to design and implement a program that keeps guests coming back.',
    author: 'David Okafor',
    date: 'December 12, 2024',
    readTime: '7 min read',
    category: 'Guest Experience',
    featured: false,
  },
  {
    title: 'Understanding RevPAR, ADR, and Other Key Hotel Metrics',
    excerpt: 'Confused by hotel jargon? This beginner-friendly guide breaks down the most important metrics every hotel manager should track.',
    author: 'Fatima El-Amin',
    date: 'December 5, 2024',
    readTime: '9 min read',
    category: 'Analytics',
    featured: false,
  },
]

const categories = ['All', 'Revenue Management', 'Channel Management', 'Technology', 'Operations', 'Guest Experience', 'Analytics']

export default function BlogPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[60px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-teal-400/8 blur-[50px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              Blog
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Insights for{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                hoteliers
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              Tips, strategies, and industry insights to help you run your hotel more efficiently and grow your revenue.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative overflow-hidden pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category, i) => (
              <Badge
                key={category}
                variant={i === 0 ? 'default' : 'outline'}
                className={cn(
                  i === 0
                    ? 'bg-emerald-600 text-white border-0 hover:bg-emerald-500 cursor-pointer'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer'
                )}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="relative overflow-hidden pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {blogPosts.filter(p => p.featured).map((post, i) => (
              <motion.div
                key={post.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/10"
              >
                <div className="h-48 bg-gradient-to-br from-emerald-900/50 to-teal-900/50 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-emerald-400/40" />
                </div>
                <div className="p-6">
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-0 text-xs mb-3">
                    {post.category}
                  </Badge>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {post.date}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section className="relative overflow-hidden pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8">Latest Articles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.filter(p => !p.featured).map((post, i) => (
              <motion.div
                key={post.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/10"
              >
                <div className="h-40 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 flex items-center justify-center">
                  <Tag className="h-8 w-8 text-emerald-400/30" />
                </div>
                <div className="p-5">
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-0 text-xs mb-2">
                    {post.category}
                  </Badge>
                  <h3 className="text-base font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>{post.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-emerald-500/20 blur-[50px] animate-pulse" style={{ animationDuration: '8s' }} />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Stay up to date
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Get the latest hotel management tips, industry insights, and EasyBeds updates delivered to your inbox.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 whitespace-nowrap">
              Subscribe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <p className="mt-3 text-xs text-white/40">
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </section>
    </PublicLayout>
  )
}
