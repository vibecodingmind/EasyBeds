'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Hotel, Menu, X, Sun, Moon, ArrowRight, Shield, ChevronDown, LogOut, LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  SHARED FOOTER                                                              */
/* -------------------------------------------------------------------------- */
export function PublicFooter() {
  return (
    <footer className="bg-gray-950 border-t border-white/10 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-600/20">
                <Hotel className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EasyBeds</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Smart hotel management platform for booking management, channel distribution, and guest services.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/#features" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-white/50 transition-colors hover:text-emerald-400">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} EasyBeds. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

/* -------------------------------------------------------------------------- */
/*  THEME TOGGLE                                                               */
/* -------------------------------------------------------------------------- */
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-white/70 hover:text-white hover:bg-white/10"
      >
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="text-white/70 hover:text-white hover:bg-white/10"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*  SHARED NAVBAR WITH ANIMATED HAMBURGER                                      */
/* -------------------------------------------------------------------------- */
export function PublicNavbar() {
  const pathname = usePathname()
  const { isAuthenticated, currentUser, logout } = useAppStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [avatarDropdown, setAvatarDropdown] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
      if (avatarDropdown && avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileOpen, avatarDropdown])

  // Close on route change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])
  /* eslint-enable react-hooks/set-state-in-effect */

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
  }, [])

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const links = [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-600/30">
            <Hotel className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">EasyBeds</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-white',
                pathname === link.href ? 'text-white' : 'text-white/60'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-3" ref={avatarRef}>
              <button
                onClick={() => setAvatarDropdown(!avatarDropdown)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 pr-3 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20">
                  {getInitials(currentUser.name)}
                </div>
                <span className="text-sm font-medium text-white/80">{currentUser.name.split(' ')[0]}</span>
                <ChevronDown className={cn('h-4 w-4 text-white/50 transition-transform', avatarDropdown && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {avatarDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-4 top-14 w-48 rounded-xl border border-white/10 bg-gray-900/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl"
                  >
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <div className="text-sm font-medium text-white truncate">{currentUser.name}</div>
                      <div className="text-xs text-white/50 truncate">{currentUser.email}</div>
                    </div>
                    <Link href="/dashboard" onClick={() => setAvatarDropdown(false)}>
                      <button
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </button>
                    </Link>
                    <button
                      onClick={() => { logout(); setAvatarDropdown(false) }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 text-white">
                  Start Free Trial
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Animated Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/10 bg-gray-900/95 backdrop-blur-xl md:hidden"
          >
            <div className="px-4 pb-4 pt-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  onClick={closeMobile}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                {isAuthenticated && currentUser ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white">
                        {getInitials(currentUser.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{currentUser.name}</div>
                        <div className="text-xs text-white/50 truncate">{currentUser.email}</div>
                      </div>
                    </div>
                    <Link href="/dashboard" onClick={closeMobile}>
                      <Button
                        variant="outline"
                        className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Go to Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => { logout(); closeMobile() }}
                      className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={closeMobile}>
                      <Button
                        variant="outline"
                        className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                      >
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={closeMobile}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25">
                        Start Free Trial
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/*  PUBLIC LAYOUT WRAPPER                                                      */
/* -------------------------------------------------------------------------- */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <PublicNavbar />
      <main className="pt-16">{children}</main>
      <PublicFooter />
    </div>
  )
}
