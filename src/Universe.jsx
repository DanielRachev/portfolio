import React, { Suspense, useCallback, useEffect, useRef, useState, useMemo } from 'react';

import * as THREE from 'three';
import { Billboard, Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

import { AnimatePresence, useReducedMotion } from 'framer-motion';

import ProjectPanel from './ProjectPanel';
import { projects } from './content';
import './PlanetMarker.css';

import sunVertexShader from './shaders/sun.vertex.glsl';
import sunFragmentShader from './shaders/sun.fragment.glsl';
import { useEncryptedGLTF } from './loaders/useEncryptedGLTF';

// --- Helper Components ---

const AMBIENT_ORBIT_SPEED = 0.70;

function CameraManager({ targetRef, isReturning, onReturnComplete }) {
  const { camera } = useThree();
  const defaultCameraPosition = useMemo(() => new THREE.Vector3(0, 20, 25), []);

  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraLookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (targetRef && targetRef.current) {
      targetRef.current.getWorldPosition(targetPosition);

      // Calculate the final camera position
      const horizontalShift = 2;
      const offset = new THREE.Vector3(4, 0.5, 3);

      cameraPosition
        .copy(targetPosition)
        .add(offset);
      cameraPosition.x += horizontalShift;

      // The camera should look at a point slightly to the right of the planet
      cameraLookAt.copy(targetPosition);
      cameraLookAt.x += horizontalShift;

      // Smoothly move the camera
      camera.position.lerp(cameraPosition, 0.05);
      camera.lookAt(cameraLookAt);

    } else if (isReturning) {
      camera.position.lerp(defaultCameraPosition, 0.05);
      camera.lookAt(0, 0, 0);

      // If the camera is close enough to the default position, stop the animation
      if (camera.position.distanceTo(defaultCameraPosition) < 0.9) {
        onReturnComplete();
      }
    }
  });

  return null;
}

function Orbit({ radius }) {
  return (
    <mesh rotation-x={Math.PI / 2}>
      <torusGeometry args={[radius, 0.015, 16, 100]} />
      <meshBasicMaterial color="#333" transparent opacity={0.5} />
    </mesh>
  );
}

function PlanetMarker({
  planetRef,
  visualRadius,
  isHovered,
  accent,
  category,
  projectInfo,
  technologies,
}) {
  const markerAnchorRef = useRef();
  const { camera, size } = useThree();
  const vectors = useMemo(
    () => ({
      center: new THREE.Vector3(),
      edge: new THREE.Vector3(),
      screenUp: new THREE.Vector3(),
      projectedCenter: new THREE.Vector3(),
      projectedEdge: new THREE.Vector3(),
    }),
    [],
  );
  const placement = useRef('above');
  const calculateMarkerPosition = useMemo(
    () => (_, activeCamera, viewportSize) => {
      if (!planetRef.current) {
        return [viewportSize.width * 0.5, viewportSize.height * 0.5];
      }

      planetRef.current.getWorldPosition(vectors.center);
      vectors.projectedCenter.copy(vectors.center).project(activeCamera);

      return [
        (vectors.projectedCenter.x + 1) * viewportSize.width * 0.5,
        (1 - vectors.projectedCenter.y) * viewportSize.height * 0.5,
      ];
    },
    [planetRef, vectors],
  );

  useFrame(() => {
    if (!planetRef.current || !markerAnchorRef.current) return;

    planetRef.current.getWorldPosition(vectors.center);
    vectors.screenUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    vectors.edge
      .copy(vectors.center)
      .addScaledVector(vectors.screenUp, visualRadius);
    vectors.projectedCenter.copy(vectors.center).project(camera);
    vectors.projectedEdge.copy(vectors.edge).project(camera);

    const projectedRadius = Math.abs(
      (vectors.projectedEdge.y - vectors.projectedCenter.y) * size.height * 0.5,
    );
    const markerOffset = THREE.MathUtils.clamp(projectedRadius + 14, 34, 170);
    const markerScale = THREE.MathUtils.clamp(projectedRadius / 58, 0.76, 1.08);
    const vertical = vectors.projectedCenter.y > 0.45 ? 'below' : 'above';
    const anchor = markerAnchorRef.current;

    anchor.style.setProperty('--planet-label-offset', `${markerOffset}px`);
    anchor.style.setProperty('--planet-label-scale', markerScale.toFixed(3));

    if (placement.current !== vertical) {
      anchor.dataset.vertical = vertical;
      placement.current = vertical;
    }
  });

  return (
    <Html
      position={[0, 0, 0]}
      calculatePosition={calculateMarkerPosition}
      zIndexRange={[100, 10]}
      style={{ top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}
    >
      <div
        ref={markerAnchorRef}
        className="planet-marker-anchor"
        data-vertical="above"
        style={{ '--planet-accent': accent }}
      >
        <div className="planet-marker-positioner">
          <div className="planet-marker-scaler">
            <div
              className={`planet-marker ${isHovered ? 'is-expanded' : 'is-compact'}`}
              role={isHovered ? 'tooltip' : undefined}
            >
              <div className="planet-marker__heading">
                <span className="planet-marker__signal" aria-hidden="true" />
                <span className="planet-marker__category">{category}</span>
              </div>
              <strong className="planet-marker__title">{projectInfo}</strong>

              {isHovered && (
                <>
                  <ul className="planet-marker__technologies" aria-label="Technologies">
                    {technologies?.slice(0, 3).map((technology) => (
                      <li key={technology}>{technology}</li>
                    ))}
                  </ul>
                  <span className="planet-marker__hint">
                    Click to explore <span aria-hidden="true">&#8594;</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Html>
  );
}

const Planet = React.forwardRef(({
  id,
  orbitalRadius,
  orbitalSpeed,
  animationSpeed,
  onPlanetClick,
  onPlanetHoverChange,
  modelPath,
  visualRadius,
  projectInfo,
  category,
  technologies,
  accent,
  featured = false,
}, ref) => {
  const orbitAngle = useRef(Math.random() * Math.PI * 2);
  const visualRef = useRef();
  const highlightRef = useRef();
  const highlightMaterialRef = useRef();
  const [isHovered, setHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { scene } = useEncryptedGLTF(modelPath);

  const { model, modelScale } = useMemo(() => {
    const clonedModel = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(clonedModel);
    const boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());

    clonedModel.position.sub(boundingSphere.center);
    clonedModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return {
      model: clonedModel,
      modelScale: visualRadius / boundingSphere.radius,
    };
  }, [scene, visualRadius]);

  useFrame(({ clock }, delta) => {
    if (!ref.current || !visualRef.current) return;
    // The canvas sleeps while the written portfolio is visible. Discard a
    // long first delta on resume so planets do not jump around their orbits.
    delta = Math.min(delta, 0.05);

    orbitAngle.current += delta * orbitalSpeed * animationSpeed;
    ref.current.position.x = Math.sin(orbitAngle.current) * orbitalRadius;
    ref.current.position.z = Math.cos(orbitAngle.current) * orbitalRadius;

    if (!shouldReduceMotion && animationSpeed > 0) {
      visualRef.current.rotation.y += 0.06 * delta;
    }
    const hoverScale = modelScale * (isHovered ? 1.08 : 1);
    const nextScale = THREE.MathUtils.damp(
      visualRef.current.scale.x,
      hoverScale,
      10,
      delta,
    );
    visualRef.current.scale.setScalar(nextScale);

    if (highlightRef.current && highlightMaterialRef.current) {
      const targetOpacity = isHovered ? 0.7 : featured ? 0.24 : 0;
      highlightMaterialRef.current.opacity = THREE.MathUtils.damp(
        highlightMaterialRef.current.opacity,
        targetOpacity,
        8,
        delta,
      );

      const pulse = shouldReduceMotion
        ? 1
        : 1 + Math.sin(clock.getElapsedTime() * 1.35 + id) * 0.025;
      const targetScale = (isHovered ? 1.08 : 1) * pulse;
      const nextHighlightScale = THREE.MathUtils.damp(
        highlightRef.current.scale.x,
        targetScale,
        8,
        delta,
      );
      highlightRef.current.scale.setScalar(nextHighlightScale);
    }
  }, -1);

  return (
    <group
      ref={ref}
      onClick={(event) => {
        event.stopPropagation();
        onPlanetClick(id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        onPlanetHoverChange(id, true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        onPlanetHoverChange(id, false);
        document.body.style.cursor = 'default';
      }}
    >
      <Billboard>
        <mesh ref={highlightRef}>
          <ringGeometry args={[visualRadius * 0.95, visualRadius * 0.98, 96]} />
          <meshBasicMaterial
            ref={highlightMaterialRef}
            color={accent}
            transparent
            opacity={featured ? 0.24 : 0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>

      <group ref={visualRef} scale={modelScale} rotation={[-0.2, 0.55, 0.05]}>
        <primitive object={model} />
      </group>

      {(isHovered || featured) && (
        <PlanetMarker
          planetRef={ref}
          visualRadius={visualRadius}
          isHovered={isHovered}
          accent={accent}
          category={category}
          projectInfo={projectInfo}
          technologies={technologies}
        />
      )}
    </group>
  );
});

function Sun() {
  const materialRef = useRef();

  useFrame(({ clock }) => {
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  return (
    <mesh>
      <sphereGeometry args={[2.5, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={sunVertexShader}
        fragmentShader={sunFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

const starVertexShader = `
  uniform float uPixelRatio;
  uniform float uTime;

  varying float vSeed;
  varying float vTwinkle;

  float random(vec3 value) {
    return fract(sin(dot(value, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  }

  void main() {
    vSeed = random(position * 0.173);
    float sizeSeed = random(position.zyx * 0.317);
    float phase = vSeed * 6.28318530718;
    float speed = mix(0.05, 0.16, sizeSeed);
    float twinkleStrength = mix(0.006, 0.03, smoothstep(0.86, 1.0, sizeSeed));
    vTwinkle = 1.0 + twinkleStrength * sin(uTime * speed + phase);

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    float sizeVariance = mix(0.7, 1.7, pow(sizeSeed, 5.0));
    float perspectiveSize = 110.0 * sizeVariance / max(1.0, -viewPosition.z);

    gl_PointSize = clamp(perspectiveSize, 1.35, 5.0) * uPixelRatio;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const starFragmentShader = `
  varying float vSeed;
  varying float vTwinkle;

  void main() {
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));

    if (distanceFromCenter > 0.5) discard;

    float glow = 1.0 - smoothstep(0.08, 0.5, distanceFromCenter);
    float core = 1.0 - smoothstep(0.0, 0.16, distanceFromCenter);
    float warmMix = smoothstep(0.82, 1.0, vSeed);
    vec3 coolWhite = vec3(0.72, 0.84, 1.0);
    vec3 warmWhite = vec3(1.0, 0.86, 0.67);
    vec3 starColor = mix(coolWhite, warmWhite, warmMix);
    starColor = mix(starColor, vec3(1.0), core);

    float alpha = (0.24 * glow + 0.76 * core) * vTwinkle;
    float brightness = (0.75 + 1.5 * core) * vTwinkle;
    gl_FragColor = vec4(starColor * brightness, alpha);
  }
`;

function Stars({ count = 5000 }) {
  const ref = useRef();
  const materialRef = useRef();
  const shouldReduceMotion = useReducedMotion();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const isNearFieldStar = Math.random() < 0.14;
      const r = isNearFieldStar
        ? 6 + 42 * Math.cbrt(Math.random())
        : 65 + 135 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },
    }),
    [],
  );

  // Slowly rotate the starfield for a dynamic effect
  useFrame(({ clock, gl }, delta) => {
    delta = Math.min(delta, 0.05);
    if (!shouldReduceMotion) {
      ref.current.rotation.y += delta * 0.01;
      ref.current.rotation.x += delta * 0.005;
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
    materialRef.current.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.5);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

// --- Main App Component ---

projects.forEach(({ modelPath }) => useEncryptedGLTF.preload(modelPath));

// This mounts only once all suspended models have parsed. Wait for a rendered
// frame too, so the entry button never promises an empty scene.
function SceneReady({ onReady }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 2) onReady();
  });
  return null;
}

export default function Universe({ active, ready, onReady, onExit, entryProjectId }) {
  const shouldReduceMotion = useReducedMotion();
  const [hoveredPlanetId, setHoveredPlanetId] = useState(null);
  const [focusedPlanet, setFocusedPlanet] = useState(null);
  const [isReturning, setIsReturning] = useState(false);

  const planetRefs = useMemo(() =>
    Array(projects.length).fill().map(() => React.createRef()),
    []
  );

  const handlePlanetClick = (id) => {
    if (isReturning) setIsReturning(false);

    const project = projects.find(p => p.id === id);
    setHoveredPlanetId(null);
    setFocusedPlanet(project);
  };

  const handlePlanetHoverChange = (id, isHovered) => {
    setHoveredPlanetId((currentId) => {
      if (isHovered) return id;
      return currentId === id ? null : currentId;
    });
  };

  const handleClosePanel = useCallback(() => {
    setFocusedPlanet(null);
    setHoveredPlanetId(null);
    setIsReturning(true);
  }, []);

  const backRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    backRef.current?.focus();
    setFocusedPlanet(projects.find(project => project.id === entryProjectId) || null);
    setHoveredPlanetId(null);
    setIsReturning(!entryProjectId);
  }, [active, entryProjectId]);
  useEffect(() => {
    if (!active) return;
    const escape = (event) => {
      if (event.key === 'Escape' && !focusedPlanet) onExit();
    };
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('keydown', escape);
      document.body.style.cursor = '';
    };
  }, [active, focusedPlanet, onExit]);

  const handleReturnComplete = () => {
    setIsReturning(false);
  };

  const focusedPlanetRef = focusedPlanet ? planetRefs[projects.findIndex(p => p.id === focusedPlanet.id)] : null;
  const animationSpeed = shouldReduceMotion || (hoveredPlanetId && !focusedPlanet)
    ? (shouldReduceMotion ? 0 : 0.03)
    : AMBIENT_ORBIT_SPEED;

  return (
    <>
      <AnimatePresence>
        {focusedPlanet && (
          <ProjectPanel project={focusedPlanet} onClose={handleClosePanel} />
        )}
      </AnimatePresence>
      <div className="universe-content" inert={!!focusedPlanet}>
        <header className="universe-toolbar">
          <button ref={backRef} className="button button--glass" onClick={onExit}>← Back to portfolio</button>
          <span>Daniel Rachev <span className="muted">/ Selected work</span></span>
        </header>
        <div className="universe-guide">
          <p>Select a planet to explore my work.</p>
          <span>Drag to orbit · Scroll to zoom</span>
          <nav aria-label="Select a project">
            {projects.map(project => <button key={project.id} onClick={() => handlePlanetClick(project.id)}>{project.projectInfo}</button>)}
          </nav>
        </div>
      <Canvas frameloop={active || !ready ? 'always' : 'never'} camera={{ position: [0, 20, 25], fov: 45 }} dpr={[1, 1.5]} fallback={<p className="scene-fallback">This browser cannot display the universe. You can explore every project in the portfolio below.</p>}>
        <Suspense fallback={null}>
        <hemisphereLight color="#b7d8ff" groundColor="#180b08" intensity={0.75} />
        <pointLight color="#fff5e6" intensity={700} position={[0, 0, 0]} />

        <OrbitControls enabled={!focusedPlanet && !isReturning} />

        <CameraManager
          targetRef={focusedPlanetRef}
          isReturning={isReturning}
          onReturnComplete={handleReturnComplete}
        />

        <Stars />

        <Sun />

        {projects.map((project, index) => (
          <Planet
            key={project.id}
            ref={planetRefs[index]}
            {...project}
            animationSpeed={animationSpeed}
            onPlanetClick={handlePlanetClick}
            onPlanetHoverChange={handlePlanetHoverChange}
          />
        ))}
        {projects.map(p => <Orbit key={`orbit_${p.id}`} radius={p.orbitalRadius} />)}

        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.9}
            height={300}
          />
        </EffectComposer>
        <SceneReady onReady={onReady} />
        </Suspense>
      </Canvas>
      </div>
    </>
  );
}
