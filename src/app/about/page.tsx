'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Hotel, Users, Target, Heart, Globe, Award, Zap, ArrowRight,
  Sparkles, Shield, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import PublicLayout from '@/components/layout/public-layout'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const values = [
  {
    icon: Heart,
    title: 'Hospitality First',
    description: 'We build tools that put the guest experience at the center of every decision.',
  },
  {
    icon: Zap,
    title: 'Speed & Simplicity',
    description: 'Complex problems solved with elegant, fast, and intuitive interfaces.',
  },
  {
    icon: Shield,
    title: 'Reliability',
    description: '99.9% uptime guaranteed. Your hotel operations never skip a beat.',
  },
  {
    icon: Globe,
    title: 'Built for Africa',
    description: 'Designed for the unique needs, currencies, and connectivity realities of African markets.',
  },
]

const team = [
  {
    name: 'Kwame Asante',
    role: 'CEO & Co-Founder',
    bio: 'Former hotel manager turned tech entrepreneur. 15 years in hospitality across West Africa.',
  },
  {
    name: 'Fatima El-Amin',
    role: 'CTO & Co-Founder',
    bio: 'Ex-Google engineer with a passion for building software that solves real-world problems.',
  },
  {
    name: 'David Okafor',
    role: 'Head of Product',
    bio: 'Product leader who has shipped software used by millions across emerging markets.',
  },
  {
    name: 'Aisha Patel',
    role: 'VP of Customer Success',
    bio: 'Dedicated to ensuring every hotel gets the most out of EasyBeds.',
  },
]

const milestones = [
  { year: '2019', event: 'EasyBeds founded in Nairobi, Kenya' },
  { year: '2020', event: 'Launched first version with 50 beta hotels' },
  { year: '2021', event: 'Expanded to 10 African countries, 500+ hotels' },
  { year: '2022', event: 'Raised Series A, launched OTA sync and dynamic pricing' },
  { year: '2023', event: 'Introduced AI Concierge, crossed 1,500 hotels' },
  { year: '2024', event: '2,400+ hotels, 48K rooms, 120K monthly bookings' },
]

export default function AboutPage() {
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
              <Hotel className="h-3.5 w-3.5 text-emerald-400" />
              Our Story
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Empowering hotels to{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                thrive
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              EasyBeds was born from a simple observation: hotels across Africa deserve world-class
              technology that&apos;s affordable, reliable, and built for their unique needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="relative overflow-hidden bg-gray-900/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                <Target className="h-3.5 w-3.5" />
                Our Mission
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Making hotel management effortless
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/60">
                We believe every hotelier deserves access to the same powerful tools that major chains use.
                Our mission is to democratize hotel technology across Africa and emerging markets, one property
                at a time.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-white/60">
                By combining intuitive design with powerful automation, we help hotels increase revenue,
                reduce manual work, and deliver exceptional guest experiences.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="text-3xl font-bold text-emerald-400">2,400+</div>
                <div className="mt-1 text-sm text-white/60">Hotels Managed</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="text-3xl font-bold text-emerald-400">48K+</div>
                <div className="mt-1 text-sm text-white/60">Rooms Connected</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="text-3xl font-bold text-emerald-400">15+</div>
                <div className="mt-1 text-sm text-white/60">African Countries</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="text-3xl font-bold text-emerald-400">99.9%</div>
                <div className="mt-1 text-sm text-white/60">Uptime SLA</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
              <Heart className="h-3.5 w-3.5 text-emerald-400" />
              Our Values
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              What drives us
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-white/10"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 transition-colors group-hover:bg-emerald-500/30">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{value.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="relative overflow-hidden bg-gray-900/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              Our Team
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              The people behind EasyBeds
            </h2>
            <p className="mt-4 text-lg text-white/60">
              A diverse team of hospitality experts, engineers, and designers passionate about transforming African hospitality.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-bold text-emerald-400 backdrop-blur-sm">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-emerald-400">{member.role}</p>
                <p className="mt-3 text-sm text-white/60">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Our Journey
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Milestones along the way
            </h2>
          </motion.div>

          <div className="mt-16 mx-auto max-w-2xl space-y-6">
            {milestones.map((milestone, i) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/20 border border-emerald-500/30 text-xs font-bold text-emerald-400">
                    {milestone.year.slice(2)}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="mt-1 h-full w-px border-l border-dashed border-white/10" />
                  )}
                </div>
                <div className="pb-6">
                  <div className="text-sm font-bold text-emerald-400">{milestone.year}</div>
                  <p className="mt-1 text-white/70">{milestone.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-emerald-500/20 blur-[50px] animate-pulse" style={{ animationDuration: '8s' }} />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Join our mission
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Whether you&apos;re a hotelier looking for better tools or a talented person wanting to make a difference — we&apos;d love to hear from you.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button size="lg" className="h-13 bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 border-0">
                Get In Touch
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/careers">
              <Button size="lg" variant="outline" className="h-13 border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10">
                View Open Positions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
