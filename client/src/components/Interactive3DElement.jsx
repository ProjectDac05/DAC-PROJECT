import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useSpring } from "@react-spring/three";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";

function InteractiveMesh({ mouseX, mouseY }) {
  const mesh = useRef();

  // Create animated rotations based on mouse position
  const { rotation } = useSpring({
    rotation: [mouseY / 50, mouseX / 50, 0],
    config: { mass: 1, tension: 170, friction: 26 },
  });

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
      mesh.current.rotation.y += 0.01;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh} rotation={rotation}>
        <torusKnotGeometry args={[1, 0.3, 128, 16]} />
        <meshPhongMaterial
          color="#6366f1"
          shininess={100}
          specular={new THREE.Color("#ffffff")}
        />
      </mesh>
    </Float>
  );
}

export default function Interactive3DElement({ mouseX = 0, mouseY = 0 }) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <InteractiveMesh mouseX={mouseX} mouseY={mouseY} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
