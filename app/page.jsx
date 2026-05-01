'use client'
import Link from 'next/link'

const NAV_LINKS = ['Features', 'How it works', 'Pricing']

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
        <span className="text-white font-mono font-bold text-sm tracking-wide">S</span>
      </div>
      <span className="font-mono font-semibold text-white text-lg tracking-tight">stackr</span>
    </div>
  )
}

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md bg-navy/80">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
              className="text-sm text-white/50 hover:text-white transition-colors font-sans">
              {l}
            </a>
          ))}
        </div>
        <Link href="/analyze"
          className="text-sm font-mono font-medium bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg transition-colors">
          Try free →
        </Link>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="grid-bg min-h-screen flex flex-col items-center justify-center pt-14 px-6">
      <div className="max-w-4xl mx-auto text-center">

        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          <span className="text-xs font-mono text-accent">AI-powered · ASME Y14.5 · GD&T</span>
        </div>

        <h1 className="font-mono font-bold text-5xl md:text-7xl text-white leading-tight mb-6">
          Tolerance<br />
          <span className="text-accent">stackup</span> in<br />
          seconds.
        </h1>

        <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-sans leading-relaxed">
          Upload any engineering drawing and instantly get MMC, LMC, GD&T analysis,
          with intelligent selection between RSS, Worst Case, and Vector methods.
          No $20K software. No 8-hour spreadsheet.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/analyze"
            className="w-full sm:w-auto text-center font-mono font-medium bg-accent hover:bg-accent/90 text-white px-8 py-3.5 rounded-lg transition-all text-base">
            Analyze a drawing →
          </Link>
          <a href="#how-it-works"
            className="w-full sm:w-auto text-center font-mono text-sm text-white/40 hover:text-white/70 px-8 py-3.5 transition-colors">
            See how it works ↓
          </a>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-xs font-mono text-white/25">
          No account required · Free to start · Results in &lt; 2 minutes
        </p>
      </div>

      {/* Mock screenshot */}
      <div className="max-w-4xl mx-auto w-full mt-16 px-0">
        <div className="rounded-xl border border-white/10 bg-navy-2 overflow-hidden shadow-2xl">
          <div className="border-b border-white/5 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs font-mono text-white/20">stackr.ai/analyze</span>
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-navy-3 rounded-lg p-4 border border-white/5">
              <p className="text-xs font-mono text-white/30 mb-2">METHOD SELECTED</p>
              <div className="flex items-center gap-2">
                <div className="bg-accent/20 text-accent border border-accent/30 rounded-full px-3 py-1 text-sm font-mono font-medium">RSS</div>
                <p className="text-xs text-white/50">6 independent contributors detected</p>
              </div>
            </div>
            <div className="bg-navy-3 rounded-lg p-4 border border-white/5">
              <p className="text-xs font-mono text-white/30 mb-2">FINAL GAP</p>
              <p className="text-3xl font-mono font-bold text-green">0.42 <span className="text-lg font-normal">mm</span></p>
              <p className="text-xs text-white/40 mt-1">Min: 0.18 · Max: 0.66</p>
            </div>
            <div className="col-span-2 bg-navy-3 rounded-lg p-4 border border-white/5">
              <p className="text-xs font-mono text-white/30 mb-3">IDENTIFIED DIMENSIONS</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['Housing bore', '25.00', '+0.02', '-0.00', 'MMC'],
                  ['Shaft OD', '24.97', '+0.00', '-0.02', 'MMC'],
                  ['Bearing width', '12.00', '±0.05', '', 'RFS'],
                ].map(([feat, nom, u, l, cond]) => (
                  <div key={feat} className="bg-navy/50 rounded p-2.5 border border-white/5">
                    <p className="text-xs text-white/30 mb-1">{feat}</p>
                    <p className="text-sm font-mono text-accent font-medium">{nom}</p>
                    <p className="text-xs font-mono text-green">{u}</p>
                    {l && <p className="text-xs font-mono text-red-400">{l}</p>}
                    <span className="inline-block mt-1 text-xs bg-accent/10 text-accent/70 px-1.5 py-0.5 rounded">{cond}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: '◎',
      title: 'GD&T extraction',
      desc: 'Reads flatness, perpendicularity, position, runout, and all 14 geometric controls directly from your drawing.',
    },
    {
      icon: '⊕',
      title: 'MMC & LMC analysis',
      desc: 'Automatically identifies maximum and least material conditions and applies bonus tolerances correctly.',
    },
    {
      icon: '∑',
      title: 'Intelligent method selection',
      desc: 'AI picks RSS, Worst Case, or Vector method based on contributor count, criticality, and assembly type.',
    },
    {
      icon: '⟳',
      title: 'Full stackup chain',
      desc: 'Traces the complete dimensional loop through your assembly and shows every contributor.',
    },
    {
      icon: '↓',
      title: 'ASME-ready reports',
      desc: 'Export PDF reports formatted for DFM reviews and engineering release packages.',
    },
    {
      icon: '✦',
      title: 'Image & CAD input',
      desc: 'Works from photos, PDFs, screenshots. STEP/IGES file import coming in Pro.',
    },
  ]

  return (
    <section id="features" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-mono text-accent mb-3 tracking-widest">FEATURES</p>
        <h2 className="font-mono font-bold text-3xl md:text-4xl text-white mb-4">
          Everything tolerance analysis<br />needs. Nothing it doesn't.
        </h2>
        <p className="text-white/40 text-lg mb-16 max-w-xl">
          Built for mechanical engineers who need results, not another complex CAE workflow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-navy-2 border border-white/5 rounded-xl p-6 hover:border-accent/20 transition-colors">
              <div className="text-2xl text-accent mb-4 font-mono">{f.icon}</div>
              <h3 className="font-mono font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Upload your drawing', desc: 'Drop a photo, PDF screenshot, or CAD export of your assembly. Any format that shows dimensions and tolerances.' },
    { num: '02', title: 'AI extracts tolerances', desc: 'Stackr reads every dimension, GD&T callout, MMC/LMC condition, and datum reference from your image.' },
    { num: '03', title: 'Get your stackup analysis', desc: 'See the full chain, the recommended method, min/max gap, sigma level, and engineering recommendations.' },
  ]

  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-mono text-accent mb-3 tracking-widest">HOW IT WORKS</p>
        <h2 className="font-mono font-bold text-3xl md:text-4xl text-white mb-16">
          Three steps. Two minutes.<br />One less headache.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(s => (
            <div key={s.num} className="relative">
              <div className="text-6xl font-mono font-bold text-white/5 mb-4 select-none">{s.num}</div>
              <div className="w-8 h-0.5 bg-accent mb-4" />
              <h3 className="font-mono font-semibold text-white text-lg mb-3">{s.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      sub: 'forever',
      features: ['5 analyses per month', 'Image upload', 'RSS + Worst Case methods', 'PDF report export'],
      cta: 'Get started',
      href: '/analyze',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$49',
      sub: '/month',
      features: ['Unlimited analyses', 'STEP / IGES file import', 'All 3 methods + Vector', 'Analysis history & projects', 'ASME-format reports', 'Priority support'],
      cta: 'Start free trial',
      href: '/analyze',
      highlight: true,
    },
    {
      name: 'Team',
      price: '$199',
      sub: '/month',
      features: ['5 seats included', 'Shared project library', 'Commenting & review flow', 'Audit trail & revision log', 'Slack / Jira integration', 'Admin dashboard'],
      cta: 'Contact us',
      href: 'mailto:hello@stackr.ai',
      highlight: false,
    },
  ]

  return (
    <section id="pricing" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-mono text-accent mb-3 tracking-widest">PRICING</p>
        <h2 className="font-mono font-bold text-3xl md:text-4xl text-white mb-4">
          Priced for engineers,<br />not enterprise procurement.
        </h2>
        <p className="text-white/40 text-lg mb-16">
          3DCS costs $20,000/seat. We don't.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(t => (
            <div key={t.name}
              className={`rounded-xl p-6 border flex flex-col ${t.highlight
                ? 'bg-accent/5 border-accent/40'
                : 'bg-navy-2 border-white/5'}`}>
              {t.highlight && (
                <div className="text-xs font-mono text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1 self-start mb-4">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-mono font-semibold text-white text-lg mb-1">{t.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-mono font-bold text-white">{t.price}</span>
                  <span className="text-white/30 text-sm">{t.sub}</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/50">
                    <span className="text-green mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={t.href}
                className={`text-center font-mono text-sm font-medium py-2.5 rounded-lg transition-colors ${t.highlight
                  ? 'bg-accent hover:bg-accent/90 text-white'
                  : 'border border-white/10 hover:border-white/20 text-white/60 hover:text-white'}`}>
                {t.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-mono font-bold text-3xl md:text-5xl text-white mb-6">
          Your engineers are spending<br />
          <span className="text-accent">8 hours on spreadsheets.</span>
        </h2>
        <p className="text-white/40 text-lg mb-10">
          Get the same result in 2 minutes. Free to try, no account needed.
        </p>
        <Link href="/analyze"
          className="inline-block font-mono font-medium bg-accent hover:bg-accent/90 text-white px-10 py-4 rounded-lg transition-colors text-lg">
          Analyze your first drawing →
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="text-xs font-mono text-white/20">
          © 2025 Stackr · Tolerance stackup analysis for mechanical engineers
        </p>
        <div className="flex gap-6">
          <a href="mailto:hello@stackr.ai" className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors">Contact</a>
          <a href="#" className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
