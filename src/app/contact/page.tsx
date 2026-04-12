'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Mail, Phone, MapPin, Send, Clock, MessageSquare, ArrowRight,
  Globe, Headphones, Calendar, ChevronRight, Instagram, Twitter, Linkedin,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent
} from '@/components/ui/accordion'
import { toast } from 'sonner'
import PublicLayout from '@/components/layout/public-layout'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const faqs = [
  {
    question: 'How do I get started with EasyBeds?',
    answer: 'Getting started is simple — sign up for a free account, add your hotel details and rooms, and you\'re ready to accept bookings. Our onboarding wizard guides you through the entire process in under 5 minutes.',
  },
  {
    question: 'Is there a free trial available?',
    answer: 'Yes! EasyBeds offers a generous free plan for up to 5 rooms. No credit card is required. You can upgrade to Starter or Pro plans anytime as your hotel grows.',
  },
  {
    question: 'How does OTA sync work?',
    answer: 'EasyBeds uses two-way iCal synchronization to connect with Booking.com, Airbnb, Expedia, and 100+ other channels. When a booking is made on any channel, it instantly updates across all your connected platforms — eliminating double bookings.',
  },
  {
    question: 'Can I migrate data from my current system?',
    answer: 'Absolutely. We offer free data migration assistance for hotels switching from other PMS systems. Our support team handles the entire migration process, ensuring zero downtime and complete data integrity.',
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'We offer email support for all plans, priority email for Starter, and dedicated support with a named account manager for Pro. All customers have access to our comprehensive knowledge base and video tutorials.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. EasyBeds uses bank-level AES-256 encryption, SOC 2 compliant infrastructure, and automated daily backups. Your data is hosted on secure servers and never shared with third parties.',
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success('Message sent! We\'ll get back to you within 24 hours.')
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    setLoading(false)
  }

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'For general inquiries and support',
      value: 'hello@easybeds.io',
      secondary: 'support@easybeds.io',
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-500/15',
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Speak with our team directly',
      value: '+254 700 123 456',
      secondary: '+254 800 987 654',
      color: 'from-teal-500 to-cyan-500',
      bg: 'bg-teal-500/15',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with us in real-time',
      value: 'Available 24/7',
      secondary: 'Avg. response: 2 min',
      color: 'from-cyan-500 to-blue-500',
      bg: 'bg-cyan-500/15',
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      description: 'Come say hello',
      value: 'Westlands, Nairobi',
      secondary: 'Kenya',
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/15',
    },
  ]

  const socialLinks = [
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Globe, label: 'Website', href: '#' },
  ]

  return (
    <PublicLayout>
      {/* Hero - Compact */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[60px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-teal-400/8 blur-[50px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
              Get In Touch
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              We&apos;d love to{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                hear from you
              </span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/60">
              Whether you have a question, need a demo, or want to explore partnership opportunities — our team is here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards + Form */}
      <section className="relative overflow-hidden pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Left side - Contact info gradient card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Main gradient card */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-950/80 via-teal-950/60 to-gray-900/80 p-6 sm:p-8 backdrop-blur-xl">
                {/* Background decoration */}
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-[40px]" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-teal-500/10 blur-[30px]" />

                <div className="relative">
                  <h2 className="text-xl font-bold text-white mb-2">Contact Information</h2>
                  <p className="text-sm text-white/50 mb-6">
                    Reach out through any of the channels below and we&apos;ll get back to you promptly.
                  </p>

                  {/* Contact methods grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {contactMethods.map((method, idx) => (
                      <div
                        key={method.title}
                        className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:-translate-y-0.5"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg ${method.bg}`}>
                          <method.icon className="h-4 w-4 text-emerald-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">{method.title}</h3>
                        <p className="mt-0.5 text-xs text-white/70 font-medium">{method.value}</p>
                        <p className="mt-0.5 text-xs text-white/40">{method.secondary}</p>
                      </div>
                    ))}
                  </div>

                  {/* Support hours */}
                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
                      <Clock className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Support Hours</p>
                      <p className="text-xs text-white/50">Mon-Fri: 8am-6pm EAT &middot; Email: 24/7</p>
                    </div>
                  </div>

                  {/* Social links */}
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Follow Us</p>
                    <div className="flex gap-2">
                      {socialLinks.map((social) => (
                        <button
                          key={social.label}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-all duration-200 hover:border-emerald-500/30 hover:bg-white/10 hover:text-emerald-400"
                          aria-label={social.label}
                        >
                          <social.icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right side - Contact form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                    <Send className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Send us a message</h2>
                    <p className="text-sm text-white/50">We typically respond within 2-4 hours</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="text-white/70 text-sm font-medium">
                        Full Name <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="contact-name"
                        placeholder="John Smith"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-white/70 text-sm font-medium">
                        Email Address <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="john@hotel.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone" className="text-white/70 text-sm font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder="+254 700 123 456"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-subject" className="text-white/70 text-sm font-medium">
                        Subject <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="contact-subject"
                        placeholder="How can we help?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-message" className="text-white/70 text-sm font-medium">
                      Message <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                      id="contact-message"
                      placeholder="Tell us more about your needs, your hotel, and how we can help..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 border-0"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending...
                      </span>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Schedule a Demo CTA */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-teal-950 to-gray-900 p-8 sm:p-12"
          >
            {/* Background decoration */}
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-[40px]" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-teal-500/10 blur-[30px]" />
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Calendar className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Schedule a Demo</h2>
                  <p className="mt-2 text-white/60 max-w-md">
                    See EasyBeds in action. Get a personalized walkthrough of how our platform can help your hotel grow revenue and streamline operations.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      30 minutes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Headphones className="h-3.5 w-3.5" />
                      Free consultation
                    </span>
                  </div>
                </div>
              </div>
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 border-0 whitespace-nowrap"
                >
                  Book a Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
                <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
                Quick Help
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-3 text-white/50">
                Find quick answers to common questions about EasyBeds
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`faq-${idx}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-6 backdrop-blur-xl transition-colors data-[state=open]:border-emerald-500/20 data-[state=open]:bg-white/10"
                >
                  <AccordionTrigger className="text-sm sm:text-base font-medium text-white hover:text-emerald-300 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-white/60">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 text-center">
              <p className="text-sm text-white/40">
                Still have questions?{' '}
                <Link href="#contact-form" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Contact us
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="relative overflow-hidden pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-xl">
            <div className="flex h-64 sm:h-80 items-center justify-center bg-gradient-to-br from-emerald-950/50 to-teal-950/50">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-emerald-400/60" />
                <p className="mt-3 text-lg font-semibold text-white/70">EasyBeds HQ</p>
                <p className="text-sm text-white/50">Westlands, Nairobi, Kenya</p>
                <Link
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Open in Google Maps
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Live Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-110 hover:shadow-emerald-500/50"
          aria-label="Live Chat"
          onClick={() => toast.info('Live chat coming soon! In the meantime, email us at hello@easybeds.io')}
        >
          <MessageSquare className="h-6 w-6" />
        </button>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
        </span>
      </div>
    </PublicLayout>
  )
}
