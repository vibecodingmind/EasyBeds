'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { HelpCircle, ArrowRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import PublicLayout from '@/components/layout/public-layout'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const faqCategories = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'How do I create an account on EasyBeds?',
        a: 'Creating an account takes less than 60 seconds. Click "Start Free Trial" on our homepage, enter your name, email, hotel name, and password. No credit card is required for the free plan. Once registered, you can immediately start adding rooms and accepting bookings.',
      },
      {
        q: 'How do I add my rooms and set up rates?',
        a: 'After creating your account, go to the Rooms section in your dashboard. Click "Add Room Type" to create room categories (e.g., Standard, Deluxe, Suite). For each type, set the base rate, maximum occupancy, and upload photos. You can set different rates for different seasons using our dynamic pricing tools.',
      },
      {
        q: 'Can I import my existing bookings?',
        a: 'Yes! EasyBeds supports importing bookings from CSV files and syncing from OTA platforms via iCal. During onboarding, our support team can also help migrate your data from other property management systems.',
      },
    ],
  },
  {
    category: 'Pricing & Billing',
    items: [
      {
        q: 'Is there really a free plan?',
        a: 'Yes! Our Free plan is free forever for up to 5 rooms. It includes basic booking management, calendar view, guest management, and email support. No credit card required, no hidden fees, no time limit.',
      },
      {
        q: 'Can I upgrade or downgrade my plan?',
        a: 'Absolutely. You can upgrade or downgrade your plan at any time from your account settings. When upgrading, you\'ll be charged the prorated difference. When downgrading, the change takes effect at the start of your next billing cycle.',
      },
      {
        q: 'Do you offer discounts for annual billing?',
        a: 'Yes, annual billing comes with a 20% discount compared to monthly billing. You can switch between monthly and annual billing from your subscription settings at any time.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept Visa, Mastercard, American Express, and bank transfers for annual plans. All payments are processed securely through Stripe. We also support M-Pesa for hotels in East Africa.',
      },
    ],
  },
  {
    category: 'Features & Integrations',
    items: [
      {
        q: 'Which OTA platforms does EasyBeds sync with?',
        a: 'EasyBeds supports two-way sync with Booking.com, Airbnb, Expedia, TripAdvisor, and many more via iCal. On the Starter plan, you can connect up to 3 channels. On the Pro plan, you get unlimited channel connections.',
      },
      {
        q: 'What is the AI Concierge?',
        a: 'The AI Concierge is an intelligent chatbot that answers guest questions 24/7. It can provide information about hotel amenities, local attractions, check-in/check-out times, and more. On the Starter plan, you get 100 AI messages per month. On Pro, it\'s unlimited.',
      },
      {
        q: 'How does dynamic pricing work?',
        a: 'Our dynamic pricing engine automatically adjusts room rates based on demand, seasonality, local events, and competitor pricing. You set the rules and minimum/maximum rates, and the system optimizes pricing to maximize your revenue. This feature is available on the Pro plan.',
      },
      {
        q: 'Can I create a branded online booking page?',
        a: 'Yes! EasyBeds provides a customizable booking page that matches your hotel\'s brand. You can add your logo, colors, photos, and policies. Guests book directly on your page with zero commissions. Available on Starter and Pro plans.',
      },
    ],
  },
  {
    category: 'Support & Security',
    items: [
      {
        q: 'How do I contact support?',
        a: 'You can reach our support team via email at support@easybeds.io, through the in-app chat, or by calling +254 700 123 456 during business hours (Mon-Fri, 8am-6pm EAT). Pro plan users get priority support with faster response times.',
      },
      {
        q: 'Is my data secure?',
        a: 'Absolutely. We use bank-grade encryption (TLS/SSL) for all data in transit and at rest. Our infrastructure is hosted on secure cloud servers with regular backups. We undergo regular security audits and are committed to protecting your data.',
      },
      {
        q: 'What happens to my data if I cancel?',
        a: 'If you cancel your subscription, you can export all your data within a 30-day grace period. After 30 days, your data will be permanently deleted from our servers, except where retention is required by law. Your free plan account remains active.',
      },
      {
        q: 'Do you offer onboarding assistance?',
        a: 'Yes! All new users get access to our comprehensive help center with video tutorials and guides. Starter and Pro plan users also get a free onboarding call with our team to help set up their account and connect channels.',
      },
    ],
  },
]

export default function FAQPage() {
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
              <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
              FAQ
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Questions
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              Everything you need to know about EasyBeds. Can&apos;t find the answer you&apos;re looking for?{' '}
              <Link href="/contact" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                Contact our team
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="relative overflow-hidden pb-24 sm:pb-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {faqCategories.map((category, catIdx) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: catIdx * 0.1 }}
              >
                <h2 className="mb-6 text-2xl font-bold text-white">{category.category}</h2>
                <Accordion type="single" collapsible className="space-y-3">
                  {category.items.map((item, i) => (
                    <AccordionItem
                      key={i}
                      value={`${catIdx}-${i}`}
                      className="rounded-xl border border-white/10 bg-white/5 px-6 backdrop-blur-xl data-[state=open]:border-emerald-500/30 data-[state=open]:bg-white/10 transition-all"
                    >
                      <AccordionTrigger className="text-left text-white hover:text-white hover:no-underline py-4">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-white/60 leading-relaxed pb-4">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-16 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center backdrop-blur-xl"
          >
            <h3 className="text-xl font-semibold text-white">Still have questions?</h3>
            <p className="mt-2 text-white/60">
              Our team is ready to help you with anything you need.
            </p>
            <Link href="/contact" className="mt-4 inline-block">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 border-0">
                Contact Support
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  )
}
