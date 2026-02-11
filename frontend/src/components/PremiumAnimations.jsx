// Premium Animation Components with Glow Effects
import React from 'react';
import { motion } from 'framer-motion';

// Glowing Card Component
export const GlowCard = ({ children, className = '', glowColor = '#FFD700', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={`relative group ${className}`}
    >
      {/* Glow Effect */}
      <div 
        className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-75 blur-xl transition-all duration-500"
        style={{ background: `linear-gradient(135deg, ${glowColor}40, ${glowColor}20)` }}
      />
      
      {/* Card Content */}
      <div className="relative bg-[#111118]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
};

// Animated Counter Component
export const AnimatedCounter = ({ value, duration = 2, className = '' }) => {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) return;
    
    const incrementTime = (duration * 1000) / end;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <span className={className}>{count}</span>;
};

// Pulse Glow Button
export const GlowButton = ({ children, onClick, className = '', disabled = false, variant = 'gold' }) => {
  const colors = {
    gold: { bg: '#FFD700', glow: '#FFD700' },
    blue: { bg: '#3b82f6', glow: '#60a5fa' },
    green: { bg: '#10b981', glow: '#34d399' }
  };
  
  const color = colors[variant] || colors.gold;
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`relative group overflow-hidden ${className}`}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {/* Animated Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            `0 0 20px ${color.glow}40`,
            `0 0 40px ${color.glow}60`,
            `0 0 20px ${color.glow}40`
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ background: `linear-gradient(135deg, ${color.bg}, ${color.bg}dd)` }}
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

// Floating Particles Background
export const FloatingParticles = ({ count = 20, color = '#FFD700' }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5
  }));
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Progress Ring with Glow
export const GlowProgressRing = ({ progress, size = 120, strokeWidth = 8, color = '#FFD700' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow Effect */}
      <svg
        className="absolute inset-0 blur-md opacity-50"
        width={size}
        height={size}
      >
        <circle
          className="transform -rotate-90 origin-center"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.5s ease'
          }}
        />
      </svg>
      
      {/* Main Ring */}
      <svg width={size} height={size}>
        {/* Background Ring */}
        <circle
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Ring */}
        <motion.circle
          className="transform -rotate-90 origin-center"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
    </div>
  );
};

// Shimmer Loading Effect
export const ShimmerEffect = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent)'
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};

// Animated Badge
export const AnimatedBadge = ({ children, variant = 'gold' }) => {
  const variants = {
    gold: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30',
    blue: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30'
  };
  
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}
    >
      <motion.span
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full bg-current mr-2"
      />
      {children}
    </motion.span>
  );
};

// Page Transition Wrapper
export const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Stagger Children Animation
export const StaggerContainer = ({ children, className = '', staggerDelay = 0.1 }) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {children}
    </motion.div>
  );
};

export default {
  GlowCard,
  AnimatedCounter,
  GlowButton,
  FloatingParticles,
  GlowProgressRing,
  ShimmerEffect,
  AnimatedBadge,
  PageTransition,
  StaggerContainer,
  StaggerItem
};
