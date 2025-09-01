import './ProjectPanel.css';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export default function ProjectPanel({ project, onClose }) {
  if (!project) return null;

  return (
    <motion.div
      className="project-panel"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <button className="close-button" onClick={onClose}>
        &times;
      </button>
      <h2>{project.projectInfo}</h2>
      <p>
        This is a placeholder description for {project.projectInfo}. Here you would
        describe the project, the technologies used, and the challenges you
        overcame.
      </p>
      <a href="#" className="project-link" target="_blank" rel="noopener noreferrer">
        View Project &rarr;
      </a>
    </motion.div>
  );
}