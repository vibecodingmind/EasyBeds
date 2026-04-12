'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Briefcase, MapPin, Clock, ArrowRight, Heart, Globe, Zap,
  Code, Users, BarChart3, Shield, Sparkles, GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PublicLayout from '@/components/layout/public-layout'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const perks = [
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Comprehensive medical, dental, and vision insurance for you and your dependents.',
  },
  {
    icon: Zap,
    title: 'Learning Budget',
    description: '$2,000 annual learning budget for courses, conferences, and professional development.',
  },
  {
    icon: Globe,
    title: 'Remote-First',
    description: 'Work from anywhere in Africa. Flexible hours with async-first communication.',
  },
  {
    icon: GraduationCap,
    title: 'Paid Time Off',
    description: '25 days PTO plus public holidays. We encourage you to take time to recharge.',
  },
  {
    icon: Code,
    title: 'Top Equipment',
    description: 'MacBook Pro, 4K monitor, and all the tools you need to do your best work.',
  },
  {
    icon: Users,
    title: 'Team Retreats',
    description: 'Quarterly team gatherings in beautiful locations across Africa.',
  },
]

const positions = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (Africa)',
    type: 'Full-time',
    description: 'Build and scale our core platform serving 2,400+ hotels. You\'ll work with Next.js, TypeScript, PostgreSQL, and modern cloud infrastructure.',
    tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote (Africa)',
    type: 'Full-time',
    description: 'Design intuitive interfaces for hotel management. From booking calendars to revenue dashboards, you\'ll shape how hoteliers interact with our product.',
    tags: ['Figma', 'Design Systems', 'UX Research', 'Prototyping'],
  },
  {
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Nairobi, Kenya',
    type: 'Full-time',
    description: 'Help hotels get the most out of EasyBeds. You\'ll onboard new customers, provide training, and build lasting relationships.',
    tags: ['Hospitality', 'Onboarding', 'Relationship Management'],
  },
  {
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote (Africa)',
    type: 'Full-time',
    description: 'Build and maintain our cloud infrastructure. Ensure 99.9% uptime for our hotel management platform serving thousands of users.',
    tags: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
  },
  {
    title: 'Sales Development Representative',
    department: 'Sales',
    location: 'Lagos, Nigeria / Nairobi, Kenya',
    type: 'Full-time',
    description: 'Generate and qualify leads for our sales team. You\'ll be the first point of contact for hotels interested in EasyBeds.',
    tags: ['B2B SaaS', 'Outbound', 'CRM', 'Hospitality'],
  },
  {
    title: 'Technical Writer',
    department: 'Product',
    location: 'Remote (Africa)',
    type: 'Contract',
    description: 'Create clear, concise documentation for our API, help center, and knowledge base. Help hoteliers and developers succeed with EasyBeds.',
    tags: ['Technical Writing', 'API Docs', 'Help Center'],
  },
]

export default function CareersPage() {
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
              <Briefcase className="h-3.5 w-3.5 text-emerald-400" />
              Join Us
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Build the future of{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                African hospitality
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              Join a passionate team building technology that empowers 2,400+ hotels across Africa. We&apos;re looking for talented people who share our mission.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Perks */}
      <section className="relative overflow-hidden bg-gray-900/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Why EasyBeds?</h2>
            <p className="mt-4 text-lg text-white/60">We invest in our people because they&apos;re the heart of everything we do.</p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {perks.map((perk, i) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-white/10"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 transition-colors group-hover:bg-emerald-500/30">
                  <perk.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{perk.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{perk.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Open Positions</h2>
            <p className="mt-4 text-lg text-white/60">
              {positions.length} open roles across {new Set(positions.map(p => p.department)).size} departments
            </p>
          </motion.div>

          <div className="space-y-4">
            {positions.map((position, i) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/10"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{position.title}</h3>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-0 text-xs">
                        {position.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed mb-3">{position.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {position.location}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {position.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-white/10 bg-white/5 text-white/60 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Link href="/contact">
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 shrink-0">
                      Apply
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* No match CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-emerald-500/20 blur-[50px] animate-pulse" style={{ animationDuration: '8s' }} />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Don&apos;t see your role?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            We&apos;re always looking for talented people. Send us your resume and tell us how you can make a difference at EasyBeds.
          </p>
          <div className="mt-10">
            <Link href="/contact">
              <Button size="lg" className="h-13 bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 border-0">
                Send Your Resume
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
