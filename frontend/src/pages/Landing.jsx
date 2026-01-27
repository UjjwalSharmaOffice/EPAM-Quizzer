import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import { NeonOrbs } from '../components/NeonOrbs';
import '../styles/reset.css';
import '../styles/variables.css';
import '../styles/typography.css';
import '../styles/landing.css';
import '../styles/components.css';
import '../styles/animations.css';
import '../styles/theme-toggle.css';

const Landing = () => {
  // Animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        delay: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.8 + i * 0.05,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        delay: 1.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: 1.8,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    tap: {
      scale: 0.98
    }
  };

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const title = "QUIZ BUZZER";

  return (
    <div>
      {/* Neon Orbs Background */}
      <NeonOrbs />

      {/* Navigation Bar */}
      <motion.nav 
        className="navbar"
        variants={navVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="logo">
              <span className="logo-text">EPAM Quiz Buzzer</span>
            </div>
          </div>
          <div className="navbar-actions">
            <ThemeToggle />
          </div>
        </div>
      </motion.nav>

      {/* Main Welcome Section */}
      <main className="welcome-section">
        <div className="welcome-container">
          {/* Glassmorphic Welcome Card */}
          <div className="glass-card">
            <div className="card-content">
              <motion.h1 
                className="welcome-title"
                variants={titleVariants}
                initial="hidden"
                animate="visible"
                style={{ 
                  fontSize: 'clamp(2rem, 5vw, 4rem)',
                  fontWeight: 200,
                  letterSpacing: '0.2em',
                  marginBottom: '1.5rem'
                }}
              >
                {title.split("").map((char, i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={letterVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ display: 'inline-block' }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.h1>
              
              <motion.p 
                className="welcome-subtitle"
                variants={subtitleVariants}
                initial="hidden"
                animate="visible"
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                  fontWeight: 300,
                  letterSpacing: '0.1em',
                  opacity: 0.7
                }}
              >
                Real-time interactive quizzes
              </motion.p>
              
              <Link to="/app" style={{ textDecoration: 'none' }}>
                <motion.button
                  className="start-button"
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <span className="button-text">Get Started</span>
                  <span className="button-icon">&rarr;</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
