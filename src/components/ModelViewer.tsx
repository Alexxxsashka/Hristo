import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, PerspectiveCamera, Environment } from '@react-three/drei';

interface ModelViewerProps {
  modelPath: string;
}

const Model = ({ path }: { path: string }) => {
  const fullPath = (path.startsWith('http') || path.startsWith('/models/')) 
    ? path 
    : `/models/${path}`;
  
  const { scene } = useGLTF(fullPath);
  return <primitive object={scene} />;
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#f87171" wireframe />
        </mesh>
      );
    }
    return this.props.children;
  }
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ modelPath }) => {
  return (
    <div className="w-full h-full bg-transparent flex items-center justify-center">
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <ErrorBoundary>
              <Model path={modelPath} />
            </ErrorBoundary>
          </Stage>
          <OrbitControls 
            makeDefault 
            autoRotate 
            autoRotateSpeed={0.5} 
            minDistance={1.5}
            maxDistance={5}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Suspense>
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
