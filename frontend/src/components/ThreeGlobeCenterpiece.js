"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function ThreeGlobeCenterpiece() {
  const mountRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let renderer, scene, camera, composer;
    let reqId;
    let globalNodes = [];
    let flashes = [];

    const initGlobe = async () => {
      try {
        // Dynamically import Three.js modules inside useEffect to completely prevent SSR crashes
        const THREE = await import('three');
        const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
        const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
        const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');

        if (!isMounted || !mountRef.current) return;

        // ----------------------------------------------------
        // Setup Scene, Camera, Renderer
        // ----------------------------------------------------
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050510);

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 6.0; // Adjusted for full ring visibility

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.margin = "0 auto";
        renderer.domElement.style.display = "block";
        mountRef.current.appendChild(renderer.domElement);

        // ----------------------------------------------------
        // Post Processing
        // ----------------------------------------------------
        const renderPass = new RenderPass(scene, camera);
        // Adjusted bloom strength for proportional screen size
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2.0, 1.0, 0.0);
        
        composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);

        // ----------------------------------------------------
        // Starfield
        // ----------------------------------------------------
        const particleCount = 2000;
        const pos = new Float32Array(particleCount * 3);
        const sz = new Float32Array(particleCount);
        const speeds = new Float32Array(particleCount);
        const phases = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
          const r = 10 + Math.random() * 40;
          const theta = 2 * Math.PI * Math.random();
          const phi = Math.acos(2 * Math.random() - 1);
          
          pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          pos[i * 3 + 2] = r * Math.cos(phi);
          
          sz[i] = 0.01 + Math.random() * 0.02;
          
          // 30% twinkle
          if (Math.random() < 0.3) {
            speeds[i] = 1 + Math.random() * 2;
            phases[i] = Math.random() * Math.PI * 2;
          } else {
            speeds[i] = 0;
            phases[i] = 0;
          }
        }

        const starsGeo = new THREE.BufferGeometry();
        starsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        starsGeo.setAttribute('size', new THREE.BufferAttribute(sz, 1));
        starsGeo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        starsGeo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

        const starsMat = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: { time: { value: 0 } },
          vertexShader: `
            attribute float size;
            attribute float speed;
            attribute float phase;
            varying float vAlpha;
            uniform float time;
            void main() {
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_Position = projectionMatrix * mvPosition;
              gl_PointSize = size * (300.0 / -mvPosition.z);
              if (speed > 0.0) {
                vAlpha = 0.6 + 0.4 * sin(time * speed + phase);
              } else {
                vAlpha = 0.4;
              }
            }
          `,
          fragmentShader: `
            varying float vAlpha;
            void main() {
              vec2 xy = gl_PointCoord.xy - vec2(0.5);
              float ll = length(xy);
              if (ll > 0.5) discard;
              gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha * (1.0 - (ll*2.0)));
            }
          `
        });

        const starsGroup = new THREE.Points(starsGeo, starsMat);
        scene.add(starsGroup);

        // Subtle background nebula glow
        const nebulaGeo = new THREE.PlaneGeometry(20, 20);
        const nebulaMat = new THREE.MeshBasicMaterial({ color: 0x1A0A3A, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
        const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
        nebula.position.z = -5;
        scene.add(nebula);

        // ----------------------------------------------------
        // Globe Base & Atmosphere
        // ----------------------------------------------------
        const globeGroup = new THREE.Group();
        globeGroup.position.set(0, 0, 0); // Perfectly center globe
        scene.add(globeGroup);

        // Adjusted scaled down radius
        const sphereGeo = new THREE.SphereGeometry(0.75, 64, 64);
        const sphereMat = new THREE.MeshPhongMaterial({
          color: 0x0A1628,
          emissive: 0x001A33,
          emissiveIntensity: 0.6,
          shininess: 50
        });
        const globeBase = new THREE.Mesh(sphereGeo, sphereMat);
        globeGroup.add(globeBase);

        const wireGeo = new THREE.SphereGeometry(0.755, 36, 18);
        const wireMat = new THREE.MeshBasicMaterial({
          color: 0x00D4FF,
          wireframe: true,
          transparent: true,
          opacity: 0.15,
          blending: THREE.AdditiveBlending
        });
        const wireGlobe = new THREE.Mesh(wireGeo, wireMat);
        globeBase.add(wireGlobe);

        const atmosGeo = new THREE.SphereGeometry(0.83, 48, 48);
        const atmosMat = new THREE.MeshBasicMaterial({
          color: 0x00D4FF,
          transparent: true,
          opacity: 0.08,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
        globeGroup.add(atmosphere);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // ----------------------------------------------------
        // Orbital Rings
        // ----------------------------------------------------
        const ringsData = [
          { color: 0x00D4FF, tiltX: 15, speedRad: 0.012, clockwise: true, nodeCount: 6, radius: 1.2 },
          { color: 0xFF2D9B, tiltX: 75, speedRad: 0.007, clockwise: false, nodeCount: 6, radius: 1.4 },
          { color: 0x00D4FF, tiltX: 45, speedRad: 0.004, clockwise: true, nodeCount: 6, radius: 1.6 }
        ];

        const ringGroups = [];
        const nodeMeshes = [];

        ringsData.forEach((ringInfo, ringIndex) => {
          const ringOuter = new THREE.Group();
          ringOuter.rotation.x = ringInfo.tiltX * (Math.PI / 180);
          scene.add(ringOuter);

          const ringInner = new THREE.Group();
          ringOuter.add(ringInner);

          // 0.008 thin radius
          const torusGeo = new THREE.TorusGeometry(ringInfo.radius, 0.008, 16, 100);
          const torusMat = new THREE.MeshBasicMaterial({ color: ringInfo.color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
          const torus = new THREE.Mesh(torusGeo, torusMat);
          ringInner.add(torus);

          for (let i = 0; i < ringInfo.nodeCount; i++) {
            const angle = (i / ringInfo.nodeCount) * Math.PI * 2;
            const px = Math.cos(angle) * ringInfo.radius;
            const py = Math.sin(angle) * ringInfo.radius;

            const nodeGeo = new THREE.SphereGeometry(0.05, 16, 16);
            const nodeMat = new THREE.MeshPhongMaterial({ color: ringInfo.color, emissive: ringInfo.color, emissiveIntensity: 1.0 });
            const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
            nodeMesh.position.set(px, py, 0);
            
            ringInner.add(nodeMesh);
            
            nodeMeshes.push({
              mesh: nodeMesh,
              ringIndex,
              nodeIndex: i,
              phaseOffset: i * 45.2
            });
          }

          ringGroups.push({ group: ringInner, info: ringInfo, index: ringIndex });
        });

        // ----------------------------------------------------
        // Intersection Flashes Group
        // ----------------------------------------------------
        const flashGroup = new THREE.Group();
        scene.add(flashGroup);

        // ----------------------------------------------------
        // Resize Handler
        // ----------------------------------------------------
        const handleResize = () => {
          if (!isMounted) return;
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          composer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // ----------------------------------------------------
        // Animation Loop
        // ----------------------------------------------------
        const clock = new THREE.Clock();

        const animate = () => {
          if (!isMounted) return;
          reqId = requestAnimationFrame(animate);
          
          const t = clock.getElapsedTime();

          // Camera Drift (centered with Y downward shift for top space)
          camera.position.x = Math.sin(t * Math.PI * 2 / 20) * 0.05;
          camera.position.y = -0.3 + Math.cos(t * Math.PI * 2 / 20) * 0.05;
          camera.lookAt(0, 0, 0);

          // Starfield
          starsMat.uniforms.time.value = t;
          starsGroup.rotation.y -= 0.0005;
          starsGroup.rotation.x += 0.0002;

          // Globe Rotation & Breathe
          globeGroup.rotation.y += 0.002;
          const globeScale = 1.015 + Math.sin(t * Math.PI * 2 / 3) * 0.015;
          globeBase.scale.set(globeScale, globeScale, globeScale);
          atmosphere.material.opacity = 0.08 + Math.sin(t * Math.PI * 2 / 5) * 0.04;

          // Bloom Breathe
          bloomPass.strength = 1.8 + Math.sin(t * Math.PI * 2 / 4) * 0.4;

          // Rings
          ringGroups.forEach((rg) => {
            let currentSpeed = rg.info.speedRad;
            let direction = rg.info.clockwise ? -1 : 1;

            if (rg.index === 0) {
              currentSpeed = rg.info.speedRad * (1 + Math.sin(t * Math.PI * 2 / 10) * 0.8);
            } else if (rg.index === 1) {
              const burst = Math.pow(Math.sin(t * Math.PI * 2 / 8), 20);
              currentSpeed = rg.info.speedRad + burst * 0.05;
            } else if (rg.index === 2) {
              direction *= Math.sign(Math.sin(t * Math.PI * 2 / 60));
            }

            rg.group.rotation.z += currentSpeed * direction;
          });

          // Nodes
          globalNodes = [];
          nodeMeshes.forEach((nm) => {
            const scale = 1.4 + Math.sin(t * 3 + nm.phaseOffset) * 0.4;
            nm.mesh.scale.set(scale, scale, scale);
            nm.mesh.material.emissiveIntensity = 1.25 + Math.sin(t * 4 + nm.phaseOffset) * 0.75;

            const worldPos = new THREE.Vector3();
            nm.mesh.getWorldPosition(worldPos);
            globalNodes.push({
              id: `r${nm.ringIndex}_n${nm.nodeIndex}`,
              ringIndex: nm.ringIndex,
              pos: worldPos
            });
          });

          // Flashes Logic
          const newFlashes = [];
          for (let i = 0; i < globalNodes.length; i++) {
            for (let j = i + 1; j < globalNodes.length; j++) {
              const n1 = globalNodes[i];
              const n2 = globalNodes[j];
              if (n1.ringIndex !== n2.ringIndex) {
                if (n1.pos.distanceTo(n2.pos) < 0.25) {
                  newFlashes.push({
                    id: `${n1.id}_${n2.id}_${Math.floor(t * 2)}`,
                    pos: n1.pos.clone().lerp(n2.pos, 0.5),
                    time: t
                  });
                }
              }
            }
          }

          flashes = flashes.filter(f => t - f.time < 0.3);
          const toAdd = newFlashes.filter(nf => !flashes.some(af => af.pos.distanceTo(nf.pos) < 0.5));
          
          toAdd.forEach(f => {
            const flashGeo = new THREE.SphereGeometry(0.08, 16, 16);
            const flashMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
            const flashMesh = new THREE.Mesh(flashGeo, flashMat);
            flashMesh.position.copy(f.pos);
            flashGroup.add(flashMesh);
            flashes.push({ ...f, mesh: flashMesh });
          });

          flashes.forEach(f => {
            const progress = Math.min((t - f.time) / 0.3, 1.0);
            const s = 1 + progress * 2.5;
            f.mesh.scale.set(s, s, s);
            f.mesh.material.opacity = 1 - Math.pow(progress, 2);
          });
          
          for (let i = flashGroup.children.length - 1; i >= 0; i--) {
            const child = flashGroup.children[i];
            if (!flashes.some(f => f.mesh === child)) {
              flashGroup.remove(child);
              child.geometry.dispose();
              child.material.dispose();
            }
          }

          composer.render();
        };

        animate();

      } catch (error) {
        console.error('Globe initialization error:', error);
        if (isMounted) setHasError(true);
      }
    };

    initGlobe();

    // Cleanup
    return () => {
      isMounted = false;
      if (reqId) cancelAnimationFrame(reqId);
      
      // We must handle dom element removal and listeners cleanly
      const domElement = renderer?.domElement;
      if (domElement && domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
      
      window.removeEventListener('resize', () => {});
      
      if (composer) composer.dispose();
      if (renderer) renderer.dispose();
      // Scene clearance is handled automatically by garbage collector here 
      // since the references die, but we could be explicit if needed.
    };
  }, []);

  if (hasError) {
    return (
      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#050510] z-0">
        <div className="w-64 h-64 border border-[#00D4FF] rounded-full opacity-20 animate-ping"></div>
        <div className="absolute text-[#00D4FF] font-mono tracking-widest text-sm animate-pulse">
          INITIALIZING_FALLBACK_NODE...
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 w-full h-full" 
      style={{ 
        background: 'radial-gradient(ellipse at center, #1A0A3A 0%, #0D0B2A 40%, #050510 100%)',
        overflow: 'visible' 
      }}
    >
      {/* Vanilla Three.js Mount Point */}
      <div 
        ref={mountRef} 
        className="absolute top-0 left-0 w-full h-full flex justify-center items-center"
        style={{ outline: 'none', border: 'none', paddingTop: '60px' }}
      />

      {/* Single Bottom HUD Overlay */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <div 
          className="font-mono font-bold" 
          style={{ 
            color: '#00F5FF',
            fontSize: '14px',
            letterSpacing: '4px',
            textShadow: '0 0 10px rgba(0,245,255,0.8)' 
          }}
        >
          ORCHESTRATOR_ACTIVE
        </div>
        <div 
          className="font-mono mt-2"
          style={{
            color: '#8892A4',
            fontSize: '11px',
            letterSpacing: '3px'
          }}
        >
          READY_FOR_DEPLOYMENT
        </div>
      </div>
    </div>
  );
}
