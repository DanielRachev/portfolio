import { Orbit } from 'lucide-react';
import { experience, projects, technicalStack } from './content';

function OrbitIcon() {
  return <Orbit className="orbit-icon" size={20} aria-hidden="true" />;
}

export default function PortfolioPage({ inactive, sceneStatus, entryRef, onEnterUniverse, onSelectProject }) {
  const ready = sceneStatus === 'ready';
  const entryLabel = ready ? 'Enter solar system' : sceneStatus === 'error' ? 'Retry solar system' : sceneStatus === 'idle' ? 'Load solar system' : 'Loading solar system';

  return (
    <div className="portfolio-page" inert={inactive} aria-hidden={inactive ? true : undefined}>
      <a className="skip-link" href="#work">Skip to featured work</a>
      <header className="site-header">
        <div className="header-inner page-width">
          <a className="identity" href="#home" aria-label="Daniel Rachev, home">
            <span className="identity-symbol"><OrbitIcon /></span>
            <span className="identity-copy"><strong>Daniel Rachev</strong><span>Software engineer</span></span>
          </a>
          <nav className="site-navigation" aria-label="Main navigation">
            <a href="#about">About</a>
            <a href="#work">Projects</a>
            <a href="#experience">Experience</a>
            <a href="#contact">Contact</a>
          </nav>
          <button ref={entryRef} className="universe-entry" disabled={sceneStatus === 'loading'} onClick={onEnterUniverse}>
            {sceneStatus === 'loading' ? <span className="loading-orbit" aria-hidden="true" /> : <OrbitIcon />}
            <span>{entryLabel}</span>
          </button>
          <span className="sr-only" role="status">
            {ready ? 'The solar system is ready to explore.' : sceneStatus === 'error' ? 'The scene could not load. Retry using the solar system button. All projects are available below.' : sceneStatus === 'idle' ? 'The solar system will load on request to save data.' : 'Preparing the solar system. You can read and scroll now.'}
          </span>
        </div>
      </header>

      <main id="home" className="page-width">
        <section id="about" className="hero" aria-labelledby="identity-title">
          <h1 id="identity-title">Building software.<br />Exploring distributed systems.</h1>
          <p className="hero-statement">I’m Daniel, a master’s student in Computer Science at TU Delft and a software engineer at Codehive. I’m interested in how distributed systems coordinate, recover, and stay correct.</p>
          <div className="hero-actions">
            <button className="button button--primary" disabled={sceneStatus === 'loading'} onClick={onEnterUniverse}>
              <OrbitIcon /><span>{sceneStatus === 'error' ? 'Retry 3D view' : sceneStatus === 'idle' ? 'Load 3D view' : 'Explore in 3D'}</span>
            </button>
            <a className="button button--secondary" href="https://github.com/DanielRachev" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="#work">Browse projects <span aria-hidden="true">↓</span></a>
          </div>
          {sceneStatus === 'error' && <p className="scene-note">The solar system couldn’t load this time. You can retry above or explore all my projects below.</p>}
          {sceneStatus === 'idle' && <p className="scene-note">To save data, the solar system loads only when you request it.</p>}
        </section>

        <section id="work" className="work-section" aria-labelledby="work-title">
          <h2 id="work-title">Featured Work</h2>
          <div className="project-grid">
            {projects.map(project => (
              <article key={project.id} className="work-card">
                <div className="work-card-heading">
                  <h3><button className="work-card-button" onClick={() => onSelectProject(project)} aria-haspopup="dialog">{project.projectInfo}</button></h3>
                  <span className="work-card-number">{project.sequence}</span>
                </div>
                <p className="work-card-summary">{project.summary}</p>
                <ul className="work-card-stack" aria-label={`${project.projectInfo} technologies`}>
                  {project.technologies.map(technology => <li key={technology}>{technology}</li>)}
                </ul>
                <div className="work-card-actions">
                  <button onClick={() => onSelectProject(project)} aria-haspopup="dialog" aria-label={`View details for ${project.projectInfo}`}>View project <span aria-hidden="true">↗</span></button>
                  <button className="planet-link" disabled={!ready} onClick={event => onEnterUniverse(event, project.id)} aria-label={`Explore ${project.projectInfo} in the solar system`}>Explore planet <span aria-hidden="true">↗</span></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="stack" className="stack-section" aria-labelledby="stack-title">
          <h2 id="stack-title">Technical Stack</h2>
          <div className="stack-grid">
            {technicalStack.map(group => (
              <article key={group.title} className="stack-card">
                <h3>{group.title}</h3>
                <dl>{group.items.map(([name, detail]) => <div key={name}><dt>{name}</dt><dd>{detail}</dd></div>)}</dl>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="experience-section" aria-labelledby="experience-title">
          <h2 id="experience-title">Academic &amp; Industry Experience</h2>
          <div className="experience-list">
            {experience.map(job => (
              <article className="experience-row" key={`${job.company}-${job.dates}`}>
                <div className="experience-copy">
                  <div className="experience-heading"><h3>{job.role}</h3><span className="organisation">{job.company}</span></div>
                  <p>{job.description}</p>
                </div>
                <p className="experience-date">{job.dates}</p>
              </article>
            ))}
            <article className="experience-row">
              <div className="experience-copy">
                <div className="experience-heading"><h3>MSc Computer Science</h3><span className="organisation">TU Delft</span></div>
                <p>Interested in distributed systems, with projects in distributed data processing and formal verification.</p>
              </div>
              <p className="experience-date">Expected June 2027</p>
            </article>
            <article className="experience-row">
              <div className="experience-copy">
                <div className="experience-heading"><h3>BSc Computer Science and Engineering</h3><span className="organisation">TU Delft</span></div>
                <p>Graduated cum laude with an 8.5/10 GPA, in the top 5% of the class.</p>
              </div>
              <p className="experience-date">June 2025</p>
            </article>
          </div>
        </section>

        <section id="contact" className="contact-section" aria-labelledby="contact-title">
          <div className="contact-copy">
            <h2 id="contact-title">Establish Connection</h2>
            <p>Have a project or research question in mind? I’m happy to talk about software, distributed systems, and opportunities to work together.</p>
            <dl className="contact-links">
              <div><dt>Email</dt><dd><a href="mailto:daniel.n.rachev@gmail.com">daniel.n.rachev@gmail.com</a></dd></div>
              <div><dt>GitHub</dt><dd><a href="https://github.com/DanielRachev" target="_blank" rel="noopener noreferrer">github.com/DanielRachev</a></dd></div>
            </dl>
          </div>
          <div className="contact-reserved" aria-hidden="true" />
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-inner page-width">
          <span>© {new Date().getFullYear()} Daniel Rachev</span>
          <nav aria-label="Footer navigation"><a href="https://github.com/DanielRachev" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="#home">Back to top ↑</a></nav>
        </div>
      </footer>
    </div>
  );
}
