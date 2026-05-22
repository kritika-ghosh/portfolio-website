import './Portfolio.css';

const NAV_LINKS = ['About', 'Projects', 'Skills', 'Contact'];

const PROJECTS = [
  {
    title: 'Project Alpha',
    desc:  'A full-stack web application with real-time collaboration features.',
    tags:  ['React', 'Node.js', 'WebSockets'],
    color: '#4f8ef7',
  },
  {
    title: 'Project Beta',
    desc:  'Machine learning pipeline for image recognition at scale.',
    tags:  ['Python', 'PyTorch', 'Docker'],
    color: '#8b5cf6',
  },
  {
    title: 'Project Gamma',
    desc:  'Mobile-first design system used across 3 product teams.',
    tags:  ['Figma', 'React Native', 'CSS'],
    color: '#06b6d4',
  },
];

const SKILLS = [
  { label: 'React / Next.js', pct: 92 },
  { label: 'Node.js',         pct: 85 },
  { label: 'WebGL / GLSL',    pct: 78 },
  { label: 'Python / ML',     pct: 72 },
  { label: 'UI / UX Design',  pct: 80 },
];

const Portfolio = () => (
  <div className="portfolio">

    {/* ── Navigation ─────────────────────────────────────────────── */}
    <nav className="portfolio-nav">
      <div className="portfolio-nav__logo">◈</div>
      <ul className="portfolio-nav__links">
        {NAV_LINKS.map(l => (
          <li key={l}><a href={`#${l.toLowerCase()}`}>{l}</a></li>
        ))}
      </ul>
    </nav>

    {/* ── Hero ───────────────────────────────────────────────────── */}
    <section className="portfolio-hero" id="about">
      <div className="portfolio-hero__tag">Full-Stack · Creative Developer</div>
      <h1 className="portfolio-hero__title">
        Crafting digital<br />
        <span className="portfolio-hero__title--accent">experiences</span>
      </h1>
      <p className="portfolio-hero__sub">
        I design and build performant, visually stunning web applications —
        from GPU-accelerated particle systems to accessible design systems.
      </p>
      <div className="portfolio-hero__cta">
        <a href="#projects" className="btn btn--primary">View Projects</a>
        <a href="#contact"  className="btn btn--ghost">Get in Touch</a>
      </div>
      {/* Floating orbs */}
      <div className="orb orb--1" />
      <div className="orb orb--2" />
      <div className="orb orb--3" />
    </section>

    {/* ── Projects ───────────────────────────────────────────────── */}
    <section className="portfolio-section" id="projects">
      <div className="section-header">
        <span className="section-tag">Work</span>
        <h2>Selected Projects</h2>
      </div>
      <div className="projects-grid">
        {PROJECTS.map(({ title, desc, tags, color }) => (
          <article key={title} className="project-card" style={{ '--accent': color }}>
            <div className="project-card__glow" />
            <h3 className="project-card__title">{title}</h3>
            <p  className="project-card__desc">{desc}</p>
            <div className="project-card__tags">
              {tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <a href="#" className="project-card__link">View →</a>
          </article>
        ))}
      </div>
    </section>

    {/* ── Skills ─────────────────────────────────────────────────── */}
    <section className="portfolio-section" id="skills">
      <div className="section-header">
        <span className="section-tag">Stack</span>
        <h2>Skills &amp; Technologies</h2>
      </div>
      <div className="skills-list">
        {SKILLS.map(({ label, pct }) => (
          <div key={label} className="skill-row">
            <div className="skill-row__label">
              <span>{label}</span>
              <span className="skill-row__pct">{pct}%</span>
            </div>
            <div className="skill-bar">
              <div className="skill-bar__fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* ── Contact ────────────────────────────────────────────────── */}
    <section className="portfolio-section portfolio-contact" id="contact">
      <div className="section-header">
        <span className="section-tag">Say Hello</span>
        <h2>Let&apos;s Work Together</h2>
      </div>
      <p className="contact-sub">
        Open to freelance work, full-time roles, and exciting collaborations.
      </p>
      <a href="mailto:hello@example.com" className="btn btn--primary btn--lg">
        hello@example.com
      </a>
    </section>

    <footer className="portfolio-footer">
      <span>◈ Portfolio · {new Date().getFullYear()}</span>
    </footer>
  </div>
);

export default Portfolio;
