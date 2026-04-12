'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import PublicLayout from '@/components/layout/public-layout'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using EasyBeds ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access or use the Service.

EasyBeds reserves the right to update or modify these Terms at any time without prior notice. Your continued use of the Service after any such changes constitutes acceptance of the new Terms.`,
  },
  {
    title: '2. Description of Service',
    content: `EasyBeds provides a cloud-based hotel management platform that includes:
• Booking management and calendar synchronization
• OTA channel management and iCal synchronization
• Online booking page generation
• Housekeeping management tools
• Guest relationship management
• Revenue management and dynamic pricing
• AI-powered guest concierge
• Analytics and reporting

The Service is provided "as is" and "as available" without warranties of any kind.`,
  },
  {
    title: '3. Account Registration',
    content: `To use the Service, you must:
• Be at least 18 years of age
• Provide accurate and complete registration information
• Maintain the security of your account credentials
• Notify us immediately of any unauthorized use of your account
• Be responsible for all activities under your account

We reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    title: '4. Subscription Plans and Billing',
    content: `• Subscription fees are billed in advance on a monthly or annual basis
• Prices are subject to change with 30 days' written notice
• Free trials are limited to one per hotel/organization
• Refunds are available within 14 days of purchase for annual plans
• We reserve the right to change pricing with reasonable notice
• Unused portions of subscription periods are not refundable
• Taxes may apply based on your jurisdiction`,
  },
  {
    title: '5. Acceptable Use',
    content: `You agree not to:
• Use the Service for any unlawful purpose
• Share your account credentials with unauthorized users
• Attempt to reverse engineer, decompile, or disassemble the Service
• Interfere with or disrupt the Service or servers
• Use automated tools to scrape or collect data from the Service
• Upload malicious code, viruses, or harmful content
• Misrepresent your identity or affiliation
• Use the Service to compete directly with EasyBeds
• Violate any applicable laws or regulations`,
  },
  {
    title: '6. Data Ownership',
    content: `• You retain ownership of all data you input into the Service
• EasyBeds holds a limited license to process your data for service delivery
• We do not claim ownership of your hotel, guest, or booking data
• You may export your data at any time through our export tools
• Upon account deletion, we will delete your data per our Privacy Policy
• You are responsible for ensuring your use of data complies with applicable laws`,
  },
  {
    title: '7. Intellectual Property',
    content: `• The Service and its original content, features, and functionality are owned by EasyBeds
• Our trademarks, service marks, and trade dress may not be used without permission
• You may not copy, modify, or distribute any part of the Service
• Any feedback or suggestions you provide may be used by EasyBeds without obligation`,
  },
  {
    title: '8. Limitation of Liability',
    content: `To the maximum extent permitted by law:
• EasyBeds shall not be liable for any indirect, incidental, special, or consequential damages
• Our total liability shall not exceed the amount paid by you in the past 12 months
• We are not liable for any loss of data, revenue, or business opportunities
• We do not guarantee uninterrupted or error-free operation of the Service
• We are not responsible for actions of third-party OTA platforms`,
  },
  {
    title: '9. Termination',
    content: `• You may terminate your account at any time by contacting support
• EasyBeds may terminate accounts for violation of these Terms with 30 days' notice
• Upon termination, your right to use the Service ceases immediately
• Provisions that by nature should survive termination will remain in effect
• We will provide a reasonable data export period before permanent deletion`,
  },
  {
    title: '10. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of Kenya. Any disputes arising from these Terms or the Service shall be resolved in the courts of Nairobi, Kenya. You agree to waive any right to a jury trial and to participate in class action lawsuits.`,
  },
]

export default function TermsPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[60px] animate-pulse" style={{ animationDuration: '8s' }} />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm">
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              Legal
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-sm text-white/40">Last updated: January 2025</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="relative overflow-hidden pb-24 sm:pb-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-10 backdrop-blur-xl"
          >
            <p className="mb-8 text-white/60 leading-relaxed">
              Please read these Terms of Service carefully before using EasyBeds. These terms govern your use of the platform and establish the legal agreement between you and EasyBeds Inc.
            </p>

            <div className="space-y-8">
              {sections.map((section, i) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <h2 className="text-xl font-semibold text-white mb-3">{section.title}</h2>
                  <p className="text-white/60 leading-relaxed whitespace-pre-line">{section.content}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm text-white/60">
                Questions about these terms? Contact us at{' '}
                <a href="mailto:legal@easybeds.io" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  legal@easybeds.io
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  )
}
