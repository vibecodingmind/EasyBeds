'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import PublicLayout from '@/components/layout/public-layout'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, including:
• Account information (name, email, password, hotel details)
• Booking and guest data you manage through our platform
• Payment and billing information
• Communications you send to us (support tickets, feedback)
• Usage data and analytics about how you interact with our platform`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:
• Provide, maintain, and improve our services
• Process transactions and send related notifications
• Respond to your comments, questions, and support requests
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent or unauthorized activities
• Personalize and improve your experience
• Develop new features and services`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell your personal information. We may share information with:
• Service providers who assist in our operations (payment processors, hosting providers)
• OTA channel partners (Booking.com, Airbnb, etc.) as required for booking synchronization
• Law enforcement when required by law or to protect our rights
• Business partners with your explicit consent
• Analytics partners to help us understand platform usage (anonymized data)`,
  },
  {
    title: '4. Data Security',
    content: `We implement industry-standard security measures to protect your information:
• All data transmitted to our servers is encrypted using TLS/SSL
• Passwords are hashed using bcrypt and never stored in plain text
• Regular security audits and penetration testing
• Access controls and authentication mechanisms
• Automated backups with encryption at rest
• SOC 2 Type II compliance for our infrastructure providers`,
  },
  {
    title: '5. Data Retention',
    content: `We retain your personal information for as long as your account is active or as needed to provide services. If you wish to delete your account, we will:
• Delete your personal information within 30 days of request
• Retain anonymized data for analytics purposes
• Maintain certain data as required by law (e.g., financial records)
• Delete all guest data associated with your hotel upon verified request`,
  },
  {
    title: '6. Cookies and Tracking',
    content: `We use cookies and similar technologies to:
• Remember your preferences and settings
• Analyze how you use our platform
• Provide essential functionality
You can control cookie settings through your browser. Disabling cookies may affect some features of the platform.`,
  },
  {
    title: '7. Your Rights',
    content: `Depending on your location, you may have rights to:
• Access the personal information we hold about you
• Request correction of inaccurate information
• Request deletion of your personal information
• Export your data in a machine-readable format
• Object to processing of your personal information
• Withdraw consent where processing is based on consent
To exercise these rights, contact us at privacy@easybeds.io`,
  },
  {
    title: '8. Children\'s Privacy',
    content: `EasyBeds is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children. If we learn that we have collected information from a child under 16, we will take steps to delete such information.`,
  },
  {
    title: '9. International Data Transfers',
    content: `Your data may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place, including standard contractual clauses and data processing agreements.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last Updated" date. Your continued use of the platform after changes constitutes acceptance of the updated policy.`,
  },
]

export default function PrivacyPage() {
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
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              Legal
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Privacy Policy
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
              At EasyBeds (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our hotel management platform. Please read this policy carefully. By using EasyBeds, you agree to the practices described in this policy.
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
                Questions about this policy? Contact us at{' '}
                <a href="mailto:privacy@easybeds.io" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  privacy@easybeds.io
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  )
}
