import React, { useRef, useState, useMemo } from 'react';

import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

import { AnimatePresence, useReducedMotion } from 'framer-motion';

import ProjectPanel from './ProjectPanel';

import sunVertexShader from './shaders/sun.vertex.glsl';
import sunFragmentShader from './shaders/sun.fragment.glsl';
import { useEncryptedGLTF } from './loaders/useEncryptedGLTF';

// --- Helper Components ---

const PLANET_ASSET_ROOT = `${import.meta.env.BASE_URL}assets/planets`;

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

const Planet = React.forwardRef(({
  id,
  orbitalRadius,
  orbitalSpeed,
  animationSpeed,
  setAnimationSpeed,
  onPlanetClick,
  modelPath,
  visualRadius,
}, ref) => {
  const orbitAngle = useRef(Math.random() * Math.PI * 2);
  const visualRef = useRef();
  const [isHovered, setHovered] = useState(false);
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

  useFrame((_, delta) => {
    if (!ref.current || !visualRef.current) return;

    orbitAngle.current += delta * orbitalSpeed * animationSpeed;
    ref.current.position.x = Math.sin(orbitAngle.current) * orbitalRadius;
    ref.current.position.z = Math.cos(orbitAngle.current) * orbitalRadius;

    visualRef.current.rotation.y += 0.2 * delta;
    const hoverScale = modelScale * (isHovered ? 1.08 : 1);
    const nextScale = THREE.MathUtils.damp(
      visualRef.current.scale.x,
      hoverScale,
      10,
      delta,
    );
    visualRef.current.scale.setScalar(nextScale);
  });

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
        document.body.style.cursor = 'pointer';
        if (animationSpeed !== 0) setAnimationSpeed(0.1);
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
        if (animationSpeed !== 0) setAnimationSpeed(1);
      }}
    >
      <group ref={visualRef} scale={modelScale} rotation={[-0.2, 0.55, 0.05]}>
        <primitive object={model} />
      </group>
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

const projects = [
  {
    id: 1,
    orbitalRadius: 10,
    orbitalSpeed: 0.5,
    modelPath: `${PLANET_ASSET_ROOT}/p-c7b5e103.planet`,
    visualRadius: 1.8,
    sequence: '01',
    category: 'Featured project',
    projectInfo: 'Project A',
    summary: 'A concise, outcome-focused summary of this project will live here.',
    description: 'Use this space to explain the problem, your approach, the decisions you made, and the result you delivered.',
    technologies: ['React', 'Three.js', 'WebGL'],
    role: 'Design & development',
    year: '2026',
    accent: '#ff9a55',
  },
  {
    id: 2,
    orbitalRadius: 16,
    orbitalSpeed: 0.3,
    modelPath: `${PLANET_ASSET_ROOT}/p-a91f2d4c.planet`,
    visualRadius: 1.45,
    sequence: '02',
    category: 'Selected work',
    projectInfo: 'Project B',
    summary: 'A concise, outcome-focused summary of this project will live here.',
    description: 'Use this space to explain the problem, your approach, the decisions you made, and the result you delivered.',
    technologies: ['React', 'Vite', 'Animation'],
    role: 'Product engineering',
    year: '2026',
    accent: '#72d9ff',
  },
  {
    id: 3,
    orbitalRadius: 22,
    orbitalSpeed: 0.2,
    modelPath: `${PLANET_ASSET_ROOT}/p-e48279ad.planet`,
    visualRadius: 1.2,
    sequence: '03',
    category: 'Selected work',
    projectInfo: 'Project C',
    summary: 'A concise, outcome-focused summary of this project will live here.',
    description: 'Use this space to explain the problem, your approach, the decisions you made, and the result you delivered.',
    technologies: ['JavaScript', 'Shaders', 'UI/UX'],
    role: 'Creative development',
    year: '2026',
    accent: '#ff6b78',
  },
];

projects.forEach(({ modelPath }) => useEncryptedGLTF.preload(modelPath));


export default function App() {
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [focusedPlanet, setFocusedPlanet] = useState(null);
  const [isReturning, setIsReturning] = useState(false);

  const planetRefs = useMemo(() =>
    Array(projects.length).fill().map(() => React.createRef()),
    []
  );

  const handlePlanetClick = (id) => {
    if (isReturning) setIsReturning(false);

    const project = projects.find(p => p.id === id);
    setFocusedPlanet(project);
    setAnimationSpeed(0);
  };

  const handleClosePanel = () => {
    setFocusedPlanet(null);
    setAnimationSpeed(1.0);
    setIsReturning(true);
  };

  const handleReturnComplete = () => {
    setIsReturning(false);
  };

  const focusedPlanetRef = focusedPlanet ? planetRefs[projects.findIndex(p => p.id === focusedPlanet.id)] : null;

  return (
    <>
      <AnimatePresence>
        {focusedPlanet && (
          <ProjectPanel project={focusedPlanet} onClose={handleClosePanel} />
        )}
      </AnimatePresence>
      <Canvas camera={{ position: [0, 20, 25], fov: 45 }} dpr={[1, 1.5]}>
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
            setAnimationSpeed={setAnimationSpeed}
            onPlanetClick={handlePlanetClick}
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
      </Canvas>
    </>
  );
}
