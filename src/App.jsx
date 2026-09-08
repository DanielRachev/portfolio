import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import PortfolioPage from './PortfolioPage';
import './Portfolio.css';
import { shouldPreload } from './scenePolicy';

function createUniverse() {
  return lazy(async () => {
    const module = await import('./Universe');
    module.resetSceneAssets();
    return module;
  });
}

function supportsWebGL() {
  try {
    const context = document.createElement('canvas').getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function App() {
  const [prepareScene, setPrepareScene] = useState(false);
  const [sceneStatus, setSceneStatus] = useState(() => shouldPreload(navigator.connection) ? 'loading' : 'idle');
  const [Universe, setUniverse] = useState(createUniverse);
  const [attempt, setAttempt] = useState(0);
  const attemptRef = useRef(0);
  const [inUniverse, setInUniverse] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [ProjectPanel, setProjectPanel] = useState(null);
  const [panelStatus, setPanelStatus] = useState('idle');
  const panelRequest = useRef(0);
  const [entryProjectId, setEntryProjectId] = useState(null);
  const entryRef = useRef(null);
  const returnFocus = useRef(null);
  const savedScroll = useRef(0);

  const startScene = useCallback(() => {
    attemptRef.current += 1;
    setAttempt(attemptRef.current);
    setUniverse(createUniverse);
    setInUniverse(false);
    const supported = supportsWebGL();
    setSceneStatus(supported ? 'loading' : 'error');
    setPrepareScene(supported);
  }, []);

  useEffect(() => {
    if (!shouldPreload(navigator.connection)) return;
    // Keep loading off the initial paint and respect constrained connections.
    let idle;
    const timer = window.setTimeout(() => {
      if (window.requestIdleCallback) idle = window.requestIdleCallback(startScene, { timeout: 2500 });
      else startScene();
    }, 1200);
    return () => {
      window.clearTimeout(timer);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, [startScene]);

  useEffect(() => {
    if (!prepareScene || sceneStatus !== 'loading') return;
    const timeout = window.setTimeout(() => setSceneStatus('error'), 45000);
    return () => window.clearTimeout(timeout);
  }, [prepareScene, sceneStatus, attempt]);

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

  const sceneReady = useCallback(() => {
    if (attempt === attemptRef.current) setSceneStatus(current => current === 'loading' ? 'ready' : current);
  }, [attempt]);
  const sceneFailed = useCallback(() => {
    if (attempt !== attemptRef.current) return;
    setSceneStatus('error');
    setInUniverse(false);
  }, [attempt]);
  const closeProject = useCallback(() => setSelectedProject(null), []);
  const selectProject = async project => {
    const request = ++panelRequest.current;
    if (ProjectPanel) { setSelectedProject(project); return; }
    setPanelStatus('loading');
    try {
      const module = await import('./ProjectPanel');
      if (request !== panelRequest.current) return;
      setProjectPanel(() => module.default);
      setSelectedProject(project);
      setPanelStatus('idle');
    } catch {
      if (request === panelRequest.current) setPanelStatus('error');
    }
  };
  const enterUniverse = (event, projectId = null) => {
    panelRequest.current++;
    setPanelStatus('idle');
    if (sceneStatus === 'idle' || sceneStatus === 'error') { startScene(); return; }
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
        onSelectProject={selectProject}
      />
      {panelStatus === 'loading' && <span className="sr-only" role="status">Loading project details.</span>}
      {panelStatus === 'error' && <p className="project-load-error" role="alert">Project details couldn’t load. Please try opening the project again.</p>}
      {selectedProject && ProjectPanel && <ProjectPanel project={selectedProject} onClose={closeProject} />}
      {prepareScene && sceneStatus !== 'error' && (
        <div className={`universe-shell ${inUniverse ? 'is-active' : ''}`} inert={!inUniverse} aria-hidden={!inUniverse}>
          <SceneBoundary key={attempt} onError={sceneFailed}>
            <Suspense fallback={null}>
              <Universe active={inUniverse} ready={sceneStatus === 'ready'} onReady={sceneReady} onError={sceneFailed} onExit={exitUniverse} entryProjectId={entryProjectId} />
            </Suspense>
          </SceneBoundary>
        </div>
      )}
    </>
  );
}
