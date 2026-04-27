import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, type Variants } from 'framer-motion';
import {
  Code2,
  Users,
  Video,
  MessageSquare,
  Shield,
  Play,
  Sparkles,
  ArrowRight,
  Globe,
  Link2,
  MousePointer2,
  History,
  Mail,
  Zap,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBackground } from '@/components/ui/CodeBackground';

/* ---------- Reusable animation variants ---------- */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

/* ---------- Section wrapper that triggers on scroll ---------- */
const Reveal = ({
  children,
  className = '',
  variants = fadeUp,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ===========================================================
   HERO
   =========================================================== */
const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-40 right-10 w-[400px] h-[400px] rounded-full bg-accent/20 blur-[120px]" />
      </div>

      <motion.div style={{ y, opacity }} className="container mx-auto px-6 text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-sm mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Real-time collaborative coding</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
        >
          Code together,
          <br />
          <span className="text-gradient-primary">in perfect sync.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          A collaborative code editor with live cursors, video chat, and instant code execution —
          built for pair programming, interviews, and remote teams.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button asChild size="lg" variant="glow" className="group">
            <Link to="/auth">
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/app">Try the Editor</Link>
          </Button>
        </motion.div>

        {/* Animated editor preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 mx-auto max-w-4xl"
        >
          <EditorPreview />
        </motion.div>
      </motion.div>
    </section>
  );
};

/* ---------- Animated mock editor ---------- */
const EditorPreview = () => {
  const lines = [
    { tokens: [{ t: 'function ', c: 'text-accent' }, { t: 'greet', c: 'text-primary' }, { t: '(name) {', c: 'text-foreground' }] },
    { tokens: [{ t: '  return ', c: 'text-accent' }, { t: '`Hello, ${name}!`', c: 'text-yellow-400' }, { t: ';', c: 'text-foreground' }] },
    { tokens: [{ t: '}', c: 'text-foreground' }] },
    { tokens: [] },
    { tokens: [{ t: 'greet(', c: 'text-foreground' }, { t: '"world"', c: 'text-yellow-400' }, { t: ');', c: 'text-foreground' }] },
  ];
  return (
    <div className="relative rounded-xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-primary/70" />
        </div>
        <span className="text-xs text-muted-foreground font-mono">main.java</span>
        <div className="flex -space-x-2">
          {['bg-primary', 'bg-accent', 'bg-yellow-500'].map((c, i) => (
            <div key={i} className={`w-6 h-6 rounded-full border-2 border-card ${c}`} />
          ))}
        </div>
      </div>

      {/* Code body */}
      <div className="p-6 font-mono text-sm text-left bg-[hsl(var(--editor-bg))]">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 + i * 0.12, duration: 0.4 }}
            className="flex gap-4 leading-7"
          >
            <span className="text-muted-foreground/50 select-none w-6 text-right">{i + 1}</span>
            <span className="whitespace-pre">
              {line.tokens.map((tok, j) => (
                <span key={j} className={tok.c}>
                  {tok.t}
                </span>
              ))}
            </span>
          </motion.div>
        ))}

        {/* Live cursor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [0, 80, 40, 120, 60], y: [0, 14, 28, 14, 0] }}
          transition={{ delay: 1.8, duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute"
          style={{ top: 90, left: 80 }}
        >
          <MousePointer2 className="w-4 h-4 text-accent fill-accent" />
          <span className="ml-3 px-2 py-0.5 text-[10px] rounded bg-accent text-accent-foreground font-sans whitespace-nowrap">
            Sarah
          </span>
        </motion.div>
      </div>
    </div>
  );
};

/* ===========================================================
   FEATURES
   =========================================================== */
const features = [
  { icon: Code2, title: 'Real-time editor', desc: 'Monaco editor with multi-language support, syntax highlighting, and starter templates.' },
  { icon: MousePointer2, title: 'Live cursors & presence', desc: 'See teammates typing, scrolling, and selecting in real time with colored cursors.' },
  { icon: Video, title: 'Video & voice chat', desc: 'Built-in WebRTC video, audio, and screen sharing — no extra tools needed.' },
  { icon: MessageSquare, title: 'In-room chat', desc: 'Discuss code without leaving the editor. Messages sync instantly across all participants.' },
  { icon: Play, title: 'Run code instantly', desc: 'Execute snippets in Java & Python directly in the browser via secure remote execution.' },
  { icon: Shield, title: 'Roles & permissions', desc: 'Hosts control who can edit, chat, run code, or share video with granular permissions.' },
  { icon: History, title: 'Version history', desc: 'Save snapshots of your code and restore any previous version with one click.' },
  { icon: Mail, title: 'Invite by link or email', desc: 'Generate time-limited invite links or send invitations directly to your teammates.' },
];

const Features = () => (
  <section id="features" className="py-24 md:py-32 relative">
    <div className="container mx-auto px-6 max-w-6xl">
      <Reveal className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need to code together</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Real features built for real collaboration. No fluff.
        </p>
      </Reveal>

      <Reveal variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative p-6 rounded-xl border border-border bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-colors"
          >
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
            <div className="relative">
              <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </Reveal>
    </div>
  </section>
);

/* ===========================================================
   HOW IT WORKS
   =========================================================== */
const steps = [
  { n: '01', title: 'Create a room', desc: "Sign in and spin up a new collaboration room in seconds. Pick your language and you're ready." },
  { n: '02', title: 'Invite your team', desc: 'Share an invite link or send an email. Assign host or participant roles before they join.' },
  { n: '03', title: 'Code, talk, ship', desc: 'Write code together, hop on video, chat, run snippets, and save versions as you go.' },
];

const HowItWorks = () => (
  <section className="py-24 md:py-32 relative bg-card/20">
    <div className="container mx-auto px-6 max-w-5xl">
      <Reveal className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">How it works</h2>
        <p className="text-lg text-muted-foreground">Three steps from sign-up to shipping together.</p>
      </Reveal>

      <Reveal variants={stagger} className="relative grid md:grid-cols-3 gap-8">
        {/* Connector line */}
        <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{ originX: 0 }}
            className="h-full bg-gradient-to-r from-primary via-accent to-primary"
          />
        </div>

        {steps.map((s) => (
          <motion.div key={s.n} variants={fadeUp} className="relative text-center">
            <div className="relative z-10 w-16 h-16 mx-auto rounded-full border border-border bg-background flex items-center justify-center mb-5">
              <span className="text-gradient-primary font-bold">{s.n}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </Reveal>
    </div>
  </section>
);

/* ===========================================================
   DEMO / SCREENSHOTS
   =========================================================== */
const demoScreens = [
  {
    title: 'Multi-language editor',
    desc: 'Switch between Java and Python with starter templates ready to go.',
    icon: Code2,
  },
  {
    title: 'Video & screen share',
    desc: 'Talk face-to-face while you pair program, with WebRTC built in.',
    icon: Video,
  },
  {
    title: 'Granular host controls',
    desc: 'Toggle edit, chat, video, audio, and execution permissions per room.',
    icon: Shield,
  },
];

const Demo = () => (
  <section className="py-24 md:py-32">
    <div className="container mx-auto px-6 max-w-6xl">
      <Reveal className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">See it in action</h2>
        <p className="text-lg text-muted-foreground">A glimpse of the workspace.</p>
      </Reveal>

      <Reveal variants={stagger} className="grid md:grid-cols-3 gap-6">
        {demoScreens.map((d, i) => (
          <motion.div
            key={d.title}
            variants={scaleIn}
            whileHover={{ y: -6, rotateX: 4, rotateY: -2 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            style={{ transformPerspective: 1000 }}
            className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/40 p-6 overflow-hidden"
          >
            <div className="aspect-video rounded-lg bg-[hsl(var(--editor-bg))] border border-border mb-5 relative overflow-hidden flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10"
              />
              <d.icon className="relative w-12 h-12 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{d.title}</h3>
            <p className="text-sm text-muted-foreground">{d.desc}</p>
          </motion.div>
        ))}
      </Reveal>
    </div>
  </section>
);

/* ===========================================================
   BENEFITS
   =========================================================== */
const benefits = [
  { icon: Zap, title: 'Zero setup', desc: 'No installs, no config. Open a link, start coding.' },
  { icon: Users, title: 'Built for teams', desc: 'Designed for pair programming, mock interviews, and remote standups.' },
  { icon: Shield, title: 'You stay in control', desc: 'Hosts decide who can do what — at any moment.' },
];

const Benefits = () => (
  <section className="py-24 md:py-32 bg-card/20">
    <div className="container mx-auto px-6 max-w-5xl">
      <Reveal className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Why teams choose CodeSync</h2>
      </Reveal>

      <Reveal variants={stagger} className="grid md:grid-cols-3 gap-8">
        {benefits.map((b) => (
          <motion.div key={b.title} variants={fadeUp} className="text-center">
            <motion.div
              whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg"
            >
              <b.icon className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">{b.title}</h3>
            <p className="text-muted-foreground">{b.desc}</p>
          </motion.div>
        ))}
      </Reveal>
    </div>
  </section>
);

/* ===========================================================
   CTA
   =========================================================== */
const CTA = () => (
  <section className="py-24 md:py-32 relative overflow-hidden">
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/15 blur-[120px]" />
    </div>
    <div className="container mx-auto px-6 max-w-3xl text-center">
      <Reveal>
        <motion.h2
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
        >
          Start coding together <span className="text-gradient-primary">today.</span>
        </motion.h2>
        <p className="text-lg text-muted-foreground mb-10">
          Create a room in seconds. Invite your team. Ship faster.
        </p>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block">
          <Button asChild size="lg" variant="glow" className="text-base px-8 h-12">
            <Link to="/auth">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </Reveal>
    </div>
  </section>
);

/* ===========================================================
   NAV + FOOTER
   =========================================================== */
const Nav = () => (
  <motion.header
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl"
  >
    <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Code2 className="w-4 h-4 text-primary-foreground" />
        </div>
        CodeSync
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
        <a href="#demo" className="hover:text-foreground transition-colors">Demo</a>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant="glow">
          <Link to="/auth">Get started</Link>
        </Button>
      </div>
    </nav>
  </motion.header>
);

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Code2 className="w-4 h-4 text-primary-foreground" />
          </div>
          CodeSync
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <Link to="/auth" className="hover:text-foreground transition-colors">Sign in</Link>
        </div>
        <div className="flex items-center gap-3">
          {[Globe, X, Link2].map((Icon, i) => (
            <motion.a
              key={i}
              href="#"
              whileHover={{ y: -2, scale: 1.1 }}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              <Icon className="w-4 h-4" />
            </motion.a>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-8">
        © {new Date().getFullYear()} CodeSync. Crafted for developers.
      </p>
    </div>
  </footer>
);

/* ===========================================================
   PAGE
   =========================================================== */
const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased scroll-smooth relative overflow-hidden">
      {/* Animated code background across the whole page */}
      <CodeBackground />

      {/* Subtle full-page tint so code bg doesn't overwhelm content */}
      <div className="absolute inset-0 bg-background/60 pointer-events-none" style={{ zIndex: 1 }} />

      <div className="relative" style={{ zIndex: 2 }}>
        <Nav />
        <main>
          <Hero />
          <div id="features"><Features /></div>
          <div id="how"><HowItWorks /></div>
          <div id="demo"><Demo /></div>
          <Benefits />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Landing;
