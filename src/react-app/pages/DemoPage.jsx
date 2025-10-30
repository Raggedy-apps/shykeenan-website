import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function DemoPage() {
  const { setTheme } = useTheme();
  const [currentDemo, setCurrentDemo] = useState('neon-showcase');
  const [sparkEnabled, setSparkEnabled] = useState(true);

  // Force neon theme for the demo
  useEffect(() => {
    setTheme('neon');
  }, [setTheme]);

  const demoSections = [
    {
      id: 'neon-showcase',
      title: 'Hot Pink & Black Neon Showcase',
      description: 'The signature hot pink and black cyberpunk aesthetic with spark effects'
    },
    {
      id: 'circular-gallery',
      title: 'Circular Gallery Hero',
      description: 'Dramatic hero section with circular portraits and animations'
    },
    {
      id: 'phoenix-effects',
      title: 'Phoenix Rebirth Animations',
      description: 'Spinning phoenix effects and rebirth banners'
    },
    {
      id: 'interactive-timeline',
      title: 'Interactive Timeline',
      description: 'Animated timeline with glowing markers and fade effects'
    },
    {
      id: 'admin-interface',
      title: 'Admin Interface',
      description: 'Professional admin panels with neon touches'
    }
  ];

  return (
    <div className="demo-page-container">
      {/* Demo Navigation */}
      <div className="demo-nav">
        <div className="demo-nav-header">
          <h1 className="neon-text">🌟 Frontend Demo Showcase</h1>
          <p className="demo-subtitle">All the styles she loved - Hot Pink, Black & Sparks!</p>
        </div>
        
        <div className="demo-controls">
          <div className="theme-info">
            <span className="status-pill neon-active">Neon Theme Active</span>
            <label className="spark-toggle">
              <input 
                type="checkbox" 
                checked={sparkEnabled}
                onChange={(e) => setSparkEnabled(e.target.checked)}
              />
              <span>✨ Spark Effects</span>
            </label>
          </div>
          
          <div className="demo-section-tabs">
            {demoSections.map((section) => (
              <button
                key={section.id}
                className={`demo-tab ${currentDemo === section.id ? 'active' : ''}`}
                onClick={() => setCurrentDemo(section.id)}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="demo-content">
        {currentDemo === 'neon-showcase' && <NeonShowcase sparkEnabled={sparkEnabled} />}
        {currentDemo === 'circular-gallery' && <CircularGalleryDemo sparkEnabled={sparkEnabled} />}
        {currentDemo === 'phoenix-effects' && <PhoenixEffectsDemo sparkEnabled={sparkEnabled} />}
        {currentDemo === 'interactive-timeline' && <InteractiveTimelineDemo sparkEnabled={sparkEnabled} />}
        {currentDemo === 'admin-interface' && <AdminInterfaceDemo sparkEnabled={sparkEnabled} />}
      </div>
    </div>
  );
}

// Hot Pink & Black Neon Showcase
function NeonShowcase({ sparkEnabled }) {
  return (
    <div className="neon-showcase-section">
      <div className={`rebirth-banner ${sparkEnabled ? 'phoenix-rebirth' : ''}`}>
        <h1 className="neon-text">💖 HOT PINK & BLACK AESTHETIC 💖</h1>
        <p>The signature look she loved!</p>
      </div>

      <div className="neon-elements-grid">
        {/* Glowing Cards */}
        <div className="neon-card demo-card">
          <h3 className="neon-pink">Glowing Hot Pink Cards</h3>
          <p>Cards with that signature hot pink glow and black backgrounds</p>
          <button className="neon-button">Neon Button</button>
        </div>

        <div className="neon-card demo-card">
          <h3 className="neon-cyan">Cyan Accent Elements</h3>
          <p>Bright cyan accents that pop against the dark theme</p>
          <div className="neon-badge">✨ Spark Effect</div>
        </div>

        <div className="neon-card demo-card">
          <h3 className="neon-purple">Purple Highlights</h3>
          <p>Rich purple tones that complement the hot pink</p>
          <div className="neon-progress-bar">
            <div className="neon-progress-fill"></div>
          </div>
        </div>

        {/* Text Effects */}
        <div className="neon-card demo-card">
          <h3 className="neon-hover">Hover Effects</h3>
          <p className="neon-text">Flickering neon text that pulses</p>
          <span className="neon-magenta">Hot pink magenta glow</span>
        </div>

        {/* Image with Neon Overlay */}
        <div className="neon-card demo-card neon-image-overlay">
          <h3>Neon Image Effects</h3>
          <div className="demo-image-container">
            <div className="demo-image neon-border">
              <span className="image-placeholder">📸 Image with neon border</span>
            </div>
          </div>
        </div>

        {/* Animated Elements */}
        <div className="neon-card demo-card">
          <h3 className="neon-yellow">Animated Sparks</h3>
          <div className={`spark-container ${sparkEnabled ? 'active' : ''}`}>
            <div className="spark spark-1">✦</div>
            <div className="spark spark-2">✧</div>
            <div className="spark spark-3">✦</div>
            <div className="spark spark-4">✧</div>
          </div>
          <p>Floating spark animations she loved!</p>
        </div>
      </div>

      {/* Neon Typography Showcase */}
      <div className="typography-showcase">
        <h1 className="neon-text neon-pink">Hot Pink Headlines 💕</h1>
        <h2 className="neon-text neon-cyan">Cyan Subheadings ⚡</h2>
        <h3 className="neon-text neon-purple">Purple Accents ✨</h3>
        <p className="neon-hover">Interactive text that glows on hover</p>
        <blockquote className="neon-quote">
          "The perfect hot pink and black aesthetic with just the right amount of sparkle!"
        </blockquote>
      </div>
    </div>
  );
}

// Circular Gallery Demo
function CircularGalleryDemo({ sparkEnabled }) {
  return (
    <div className="circular-gallery-demo">
      <div className="circular-gallery-hero">
        <div className="hero-content">
          <h1 className="hero-title neon-text">Circular Gallery Magic</h1>
          <p className="hero-subtitle">Dramatic hero sections with circular portraits</p>
          <p className="hero-motto neon-hover">Rise like a phoenix ✨</p>
        </div>
      </div>

      <div className="circular-portraits">
        <div className="portrait-row">
          {[1, 2, 3].map(i => (
            <div key={i} className="portrait-circle">
              <div className="circle-image">
                <div className="demo-portrait">
                  <span className="portrait-icon">👤</span>
                </div>
              </div>
              <div className="circle-label">Portrait {i}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="category-navigation">
        <h2 className="section-title">Category Circles</h2>
        <div className="category-circles">
          <div className="category-circle">
            <div className="circle-icon phoenix-icon">
              <span className="icon-text">🔥 Phoenix</span>
            </div>
            <div className="category-label">Phoenix Mode</div>
          </div>
          <div className="category-circle">
            <div className="circle-icon gradient-love">
              <span className="icon-text">💖 Love</span>
            </div>
            <div className="category-label">Love & Light</div>
          </div>
          <div className="category-circle">
            <div className="circle-icon gradient-phoenix">
              <span className="icon-text">✨ Spark</span>
            </div>
            <div className="category-label">Spark Effects</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Phoenix Effects Demo
function PhoenixEffectsDemo({ sparkEnabled }) {
  return (
    <div className="phoenix-effects-demo">
      <div className={`rebirth-banner ${sparkEnabled ? 'phoenix-rebirth' : ''}`}>
        <h1>🔥 PHOENIX REBIRTH EFFECTS 🔥</h1>
        <p>The spark effects she absolutely loved!</p>
      </div>

      <div className="phoenix-showcase-grid">
        <div className="phoenix-demo-card">
          <h3>Spinning Phoenix Overlay</h3>
          <div className="phoenix-rebirth demo-phoenix-container">
            <div className="phoenix-content">
              <span className="phoenix-symbol">🔥</span>
              <p>Rotating conic gradient behind content</p>
            </div>
          </div>
        </div>

        <div className="phoenix-demo-card">
          <h3>Neon Gradient Animation</h3>
          <div className="neon-bg demo-gradient-box">
            <span>Animated rainbow gradient</span>
          </div>
        </div>

        <div className="phoenix-demo-card">
          <h3>Pulsing Glow Effects</h3>
          <div className="pulse-demo-container">
            <div className="neon-border pulse-element">
              <span>Pulsing Border</span>
            </div>
          </div>
        </div>

        <div className="phoenix-demo-card">
          <h3>Flickering Text</h3>
          <div className="flicker-demo">
            <h2 className="neon-text">Flickering Neon Text</h2>
            <p className="neon-hover">Hover for extra glow</p>
          </div>
        </div>
      </div>

      {sparkEnabled && (
        <div className="floating-sparks">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`floating-spark spark-${(i % 4) + 1}`}>
              {i % 3 === 0 ? '✦' : i % 3 === 1 ? '✧' : '✨'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Interactive Timeline Demo
function InteractiveTimelineDemo({ sparkEnabled }) {
  const timelineEvents = [
    { year: '2020', title: 'The Beginning', content: 'Started with a vision of hot pink and black' },
    { year: '2021', title: 'Adding Sparks', content: 'Introduced the spark effects she loved' },
    { year: '2022', title: 'Phoenix Rising', content: 'Added the spinning phoenix animations' },
    { year: '2023', title: 'Neon Perfection', content: 'Perfected the neon aesthetic' },
    { year: '2024', title: 'Rebirth Complete', content: 'The ultimate hot pink and black experience' }
  ];

  return (
    <div className="interactive-timeline">
      <h2 className="section-title">Interactive Timeline</h2>
      <p className="section-subtitle">Animated timeline with glowing markers</p>

      <div className="timeline-container">
        <div className="timeline-track">
          {timelineEvents.map((event, index) => (
            <div key={index} className="timeline-item">
              <div className={`timeline-marker ${index === 2 ? 'active' : ''}`}></div>
              <div className="timeline-content">
                <div className="timeline-year">{event.year}</div>
                <h3>{event.title}</h3>
                <p>{event.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Admin Interface Demo
function AdminInterfaceDemo({ sparkEnabled }) {
  return (
    <div className="admin-interface-demo">
      <h2 className="section-title">Admin Interface with Neon Touches</h2>
      
      <div className="admin-demo-grid">
        <div className="react-admin-card neon-card">
          <h3 className="react-admin-title">System Status</h3>
          <div className="admin-stats">
            <div className="stat-item">
              <div className="stat-label">Hot Pink Theme</div>
              <div className="stat-value neon-pink">Active ✓</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Spark Effects</div>
              <div className="stat-value neon-cyan">{sparkEnabled ? 'Enabled ✨' : 'Disabled'}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Neon Glow</div>
              <div className="stat-value neon-purple">Maximum 💫</div>
            </div>
          </div>
        </div>

        <div className="react-admin-card neon-card">
          <h3 className="react-admin-title">Theme Controls</h3>
          <div className="theme-control-panel">
            <button className="neon-button">Enable Hot Pink Mode</button>
            <button className="neon-button">Activate Sparks</button>
            <button className="neon-button">Phoenix Rebirth</button>
          </div>
        </div>

        <div className="react-admin-card neon-card">
          <h3 className="react-admin-title">Neon Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card neon-border">
              <h4>Glow Intensity</h4>
              <div className="metric-value neon-pink">100%</div>
            </div>
            <div className="metric-card neon-border">
              <h4>Spark Count</h4>
              <div className="metric-value neon-cyan">∞</div>
            </div>
            <div className="metric-card neon-border">
              <h4>Phoenix Power</h4>
              <div className="metric-value neon-purple">🔥🔥🔥</div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-actions">
        <button className="neon-button neon-hover">💖 Activate Her Favorite Theme</button>
        <button className="neon-button neon-hover">✨ Enable All Spark Effects</button>
        <button className="neon-button neon-hover">🔥 Phoenix Rebirth Mode</button>
      </div>
    </div>
  );
}