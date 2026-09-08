import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import ProjectPanel from './ProjectPanel';
import PortfolioPage from './PortfolioPage';
import './Portfolio.css';

const Universe = lazy(() => import('./Universe'));

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function App() {
  const [prepareScene, setPrepareScene] = useState(false);
  const [sceneStatus, setSceneStatus] = useState('loading');
  const [inUniverse, setInUniverse] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [entryProjectId, setEntryProjectId] = useState(null);
  const entryRef = useRef(null);
  const returnFocus = useRef(null);
  const savedScroll = useRef(0);

  useEffect(() => {
    // Give the text and navigation a chance to paint before fetching WebGL.
    const timer = window.setTimeout(() => setPrepareScene(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!prepareScene || sceneStatus !== 'loading') return;
    const timeout = window.setTimeout(() => setSceneStatus('error'), 45000);
    return () => window.clearTimeout(timeout);
  }, [prepareScene, sceneStatus]);

  useEffect(() => {
    if (!inUniverse && !selectedProject) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [inUniverse, selectedProject]);

  useEffect(() => {
    if (inUniverse || !returnFocus.current) return;
    // Restore focus after React has removed inert from the written portfolio.
    window.scrollTo({ top: savedScroll.current, behavior: 'instant' });
    returnFocus.current.focus({ preventScroll: true });
  }, [inUniverse]);

  const sceneReady = useCallback(() => setSceneStatus('ready'), []);
  const sceneFailed = useCallback(() => { setSceneStatus('error'); setInUniverse(false); }, []);
  const closeProject = useCallback(() => setSelectedProject(null), []);
  const enterUniverse = (event, projectId = null) => {
    if (sceneStatus !== 'ready') return;
    savedScroll.current = window.scrollY;
    returnFocus.current = event.currentTarget;
    setEntryProjectId(projectId);
    setInUniverse(true);
  };
  const exitUniverse = useCallback(() => {
    setInUniverse(false);
  }, []);
  return (
    <>
      <PortfolioPage
        inactive={inUniverse || !!selectedProject}
        sceneStatus={sceneStatus}
        entryRef={entryRef}
        onEnterUniverse={enterUniverse}
        onSelectProject={setSelectedProject}
      />
      {selectedProject && <ProjectPanel project={selectedProject} onClose={closeProject} />}
      {prepareScene && sceneStatus !== 'error' && (
        <div className={`universe-shell ${inUniverse ? 'is-active' : ''}`} inert={!inUniverse} aria-hidden={!inUniverse}>
          <SceneBoundary onError={sceneFailed}>
            <Suspense fallback={null}>
              <Universe active={inUniverse} ready={sceneStatus === 'ready'} onReady={sceneReady} onExit={exitUniverse} entryProjectId={entryProjectId} />
            </Suspense>
          </SceneBoundary>
        </div>
      )}
    </>
  );
}
