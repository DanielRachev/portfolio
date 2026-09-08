import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';

import './ProjectPanel.css';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function ProjectAction({ href, className, children }) {
  if (!href) {
    return null;
  }

  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default function ProjectPanel({ project, onClose }) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 700px)').matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 700px)');
    const updateLayout = (event) => setIsMobile(event.matches);

    mediaQuery.addEventListener('change', updateLayout);
    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusableElements = Array.from(
        panelRef.current.querySelectorAll(focusableSelector),
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    closeButtonRef.current?.focus();
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  if (!project) return null;

  let panelMotion;

  if (shouldReduceMotion) {
    panelMotion = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  } else if (isMobile) {
    panelMotion = {
      initial: { y: 'calc(100% + 24px)', opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 'calc(100% + 24px)', opacity: 0 },
    };
  } else {
    panelMotion = {
      initial: { x: 'calc(100% + 32px)', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 'calc(100% + 32px)', opacity: 0 },
    };
  }

  const titleId = `project-title-${project.id}`;

  return (
    <>
      <motion.div
        className="project-panel-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.25 }}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.aside
        ref={panelRef}
        className="project-panel"
        style={{ '--project-accent': project.accent || '#8edcf0' }}
        initial={panelMotion.initial}
        animate={panelMotion.animate}
        exit={panelMotion.exit}
        transition={
          shouldReduceMotion
            ? { duration: 0.01 }
            : { type: 'spring', stiffness: 280, damping: 30 }
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label={`Close ${project.projectInfo}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="project-panel__content">
          <header className="project-header">
            <p className="project-eyebrow">
              <span>{project.sequence}</span>
              {project.category}
            </p>
            <h2 id={titleId}>{project.projectInfo}</h2>
            <p className="project-summary">{project.summary}</p>
          </header>

          <ul className="technology-list" aria-label="Technologies used">
            {project.technologies?.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>

          <dl className="project-meta">
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{project.year}</dd>
            </div>
          </dl>

          <p className="project-description">{project.description}</p>

          {(project.liveUrl || project.sourceUrl) && <footer className="project-actions">
            <ProjectAction href={project.liveUrl} className="project-action project-action--primary">
              View live <span aria-hidden="true">↗</span>
            </ProjectAction>
            <ProjectAction href={project.sourceUrl} className="project-action project-action--secondary">
              Source code
            </ProjectAction>
          </footer>}
        </div>
      </motion.aside>
    </>
  );
}
