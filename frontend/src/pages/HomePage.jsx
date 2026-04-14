import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Zap, Brain, ArrowRight, Lock, WifiOff,
  Server, Sparkles, FileText, MessageSquare, CheckCircle,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';

/* ─── Static data ─── */
const features = [
  {
    icon: Shield,
    title: 'Complete Privacy',
    description: 'Your data never leaves your device. All AI processing happens locally with zero external data transmission or tracking.',
    iconBg: 'linear-gradient(135deg,#10B981,#0D9488)',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'No network latency or server queues. Get instant responses with optimized local AI models running at native hardware speed.',
    iconBg: 'linear-gradient(135deg,#F59E0B,#EA580C)',
  },
  {
    icon: Brain,
    title: 'Intelligent Analysis',
    description: 'Upload PDFs and images for deep contextual analysis. Ask complex questions and receive detailed, well-formatted answers.',
    iconBg: 'linear-gradient(135deg,#3B82F6,#7C3AED)',
  },
];

const stats = [
  { value: '100%', label: 'Private',  icon: Lock,    description: 'Data stays local',   bg: 'linear-gradient(135deg,#10B981,#0D9488)' },
  { value: '0ms',  label: 'Latency',  icon: Zap,     description: 'Instant responses',  bg: 'linear-gradient(135deg,#F59E0B,#EA580C)' },
  { value: '∞',    label: 'Offline',  icon: WifiOff, description: 'No internet needed', bg: 'linear-gradient(135deg,#3B82F6,#7C3AED)' },
  { value: 'Multi',label: 'Format',   icon: Server,  description: 'PDF, images & more', bg: 'linear-gradient(135deg,#06B6D4,#2563EB)' },
];

const howItWorks = [
  { step: '01', icon: FileText,      title: 'Upload Documents', description: 'Drag and drop your PDF or image files into the upload area.' },
  { step: '02', icon: MessageSquare, title: 'Ask Questions',    description: 'Type your questions naturally in the chat interface.' },
  { step: '03', icon: Sparkles,      title: 'Get AI Answers',   description: 'Receive detailed, intelligent responses generated locally.' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Styled section container ─── */
const Container = ({ children, maxWidth = 1100, style = {} }) => (
  <div style={{ maxWidth, margin: '0 auto', padding: '0 24px', ...style }}>
    {children}
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F1A', color: '#E2E8F0', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />

      {/* ═══════════════ HERO ═══════════════ */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
        {/* Ambient orbs */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -128, right: -96, width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle,#3B82F6,transparent 70%)', opacity: 0.08 }} />
          <div style={{ position: 'absolute', bottom: -128, left: -96, width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle,#8B5CF6,transparent 70%)', opacity: 0.08 }} />
          <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle,#06B6D4,transparent 70%)', opacity: 0.04 }} />
        </div>

        <Container style={{ paddingTop: '7rem', paddingBottom: '8rem' }}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ textAlign: 'center' }}>

            {/* Badge */}
            <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 22px', borderRadius: 9999, background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', color: '#60A5FA', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
                  <span className="animate-ping" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#34D399', opacity: 0.75 }} />
                  <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                </span>
                100% Offline · Zero Data Collection
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={itemVariants}
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: 760, margin: '0 auto 24px' }}
            >
              <span style={{ color: '#F1F5F9' }}>Privacy-First </span>
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ background: 'linear-gradient(135deg,#60A5FA,#A78BFA,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Offline AI
                </span>
                <motion.span
                  style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)', borderRadius: 9999 }}
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
                />
              </span>
              <br />
              <span style={{ color: '#E2E8F0' }}>Assistant</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              style={{ fontSize: 'clamp(1rem,2vw,1.15rem)', color: '#94A3B8', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.75 }}
            >
              Upload your documents, ask questions, and get intelligent responses — all processed
              locally on your device. Your data stays yours, always.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 72 }}>
              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard')}
                id="get-started-btn"
                style={{ padding: '17px 44px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 17, color: 'white', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 8px 32px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }}
              >
                Get Started <ArrowRight style={{ width: 18, height: 18 }} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ padding: '17px 44px', borderRadius: 14, cursor: 'pointer', fontWeight: 600, fontSize: 17, color: '#CBD5E1', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', fontFamily: 'inherit' }}
              >
                Learn More
              </motion.button>
            </motion.div>

            {/* Stat Cards */}
            <motion.div
              variants={itemVariants}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16, maxWidth: 720, margin: '0 auto' }}
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  className="info-card"
                  style={{ background: 'rgba(17,24,39,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px 16px', textAlign: 'center', cursor: 'default', boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}
                >
                  <div style={{ width: 40, height: 40, margin: '0 auto 12px', borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                    <stat.icon style={{ width: 20, height: 20, stroke: 'white', fill: 'none' }} />
                  </div>
                  <p style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{stat.value}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>{stat.label}</p>
                  <p style={{ fontSize: 11, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>{stat.description}</p>
                </motion.div>
              ))}
            </motion.div>

          </motion.div>
        </Container>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" style={{ padding: '7rem 0', background: 'rgba(14,18,37,0.6)' }}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '4rem' }}
          >
            <span style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#60A5FA', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)', marginBottom: 18 }}>
              Why Choose Us
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.025em', marginBottom: 16 }}>
              Why Choose{' '}
              <span style={{ background: 'linear-gradient(135deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Offline AI?
              </span>
            </h2>
            <p style={{ color: '#94A3B8', maxWidth: 480, margin: '0 auto', fontSize: 16, lineHeight: 1.75 }}>
              Experience the power of AI without compromising your privacy or relying on internet connectivity.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ scale: 1.025, y: -6 }}
                whileTap={{ scale: 0.98 }}
                className="feature-card"
                style={{ padding: 32, borderRadius: 24, background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'default' }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: feature.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <feature.icon style={{ width: 28, height: 28, stroke: 'white', fill: 'none', strokeWidth: 1.75 }} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 12, letterSpacing: '-0.01em' }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.75 }}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section style={{ padding: '7rem 0', backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px' }}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '4rem' }}
          >
            <span style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#34D399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: 18 }}>
              Simple Workflow
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.025em', marginBottom: 16 }}>
              How It Works
            </h2>
            <p style={{ color: '#94A3B8', maxWidth: 480, margin: '0 auto', fontSize: 16, lineHeight: 1.75 }}>
              Get started in three simple steps. No account required, no setup hassle.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 32 }}>
            {howItWorks.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ scale: 1.03, y: -6 }}
                whileTap={{ scale: 0.98 }}
                className="workflow-card"
                style={{ textAlign: 'center', padding: '28px 20px', background: 'rgba(17,24,39,0.55)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
              >
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', opacity: 0.12, transform: 'rotate(6deg)' }} />
                  <div
                    className="workflow-icon-box"
                    style={{ position: 'relative', width: 80, height: 80, borderRadius: 20, background: '#111827', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', transition: 'box-shadow 0.3s ease, border-color 0.3s ease' }}
                  >
                    <item.icon style={{ width: 32, height: 32, stroke: '#60A5FA', fill: 'none', strokeWidth: 1.75 }} />
                  </div>
                  <span style={{ position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800, boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}>
                    {item.step}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.75, maxWidth: 260, margin: '0 auto' }}>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      <section style={{ padding: '6rem 0' }}>
        <Container>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
            style={{ borderRadius: 32, padding: '4.5rem 3rem', textAlign: 'center', color: 'white', background: 'linear-gradient(135deg,#3B82F6 0%,#8B5CF6 50%,#06B6D4 100%)', backgroundSize: '300% 300%', animation: 'gradient-shift 12s ease infinite', boxShadow: '0 32px 80px rgba(59,130,246,0.25)', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', transform: 'translate(25%,-50%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 140, height: 140, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', transform: 'translate(-25%,33%)' }} />
            <div style={{ position: 'relative' }}>
              <Sparkles style={{ width: 40, height: 40, margin: '0 auto 20px', opacity: 0.9, stroke: 'white', fill: 'none' }} />
              <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>Ready to Get Started?</h2>
              <p style={{ color: 'rgba(255,255,255,0.72)', maxWidth: 480, margin: '0 auto 40px', fontSize: 16, lineHeight: 1.75 }}>
                Upload your first document and experience the power of privacy-first AI assistance. No signup required.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                style={{ padding: '18px 56px', borderRadius: 16, background: 'white', color: '#0B0F1A', fontWeight: 700, fontSize: 17, border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}
              >
                Launch Assistant <ArrowRight style={{ width: 20, height: 20 }} />
              </motion.button>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer style={{ padding: '2.5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Container style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain style={{ width: 14, height: 14, stroke: 'white', fill: 'none' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#CBD5E1' }}>Offline AI Assistant</span>
          </div>
          <p style={{ fontSize: 12, color: '#334155' }}>
            © {new Date().getFullYear()} Offline AI Assistant. Built with privacy in mind.
          </p>
        </Container>
      </footer>
    </div>
  );
};

export default HomePage;
