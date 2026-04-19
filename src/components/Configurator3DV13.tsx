import React, { Suspense, useRef, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, createPortal } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Html, useGLTF } from '@react-three/drei';
import { useConfiguratorStore } from '../store/configuratorStore';
import { Product } from '../types';
import * as THREE from 'three';
import { X, Lightbulb, MousePointer2, Move, ZoomIn, Mouse, Sparkles, Plus, Layers, Target, Settings, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { databaseService } from '../services/databaseService';

// --- EFT RECURSIVE ENGINE V1.3 ---

interface DiscoveredSlot {
  id: string;      
  type: string;    
  fullName: string;
  object: THREE.Object3D;
}

const SLOT_PREFIXES = ['slot_'];

const discoverSlots = (object: THREE.Object3D): DiscoveredSlot[] => {
  const slots: DiscoveredSlot[] = [];
  const seenPositions = new Set<string>();
  
  object.updateWorldMatrix(true, true);

  const search = (obj: THREE.Object3D) => {
    if ((obj as any).isMountPoint) {
      if (obj.children) obj.children.forEach(search);
      return;
    }

    const name = obj.name.toLowerCase();
    const prefix = SLOT_PREFIXES.find(p => name.startsWith(p));
    
    if (prefix) {
      const type = name.slice(prefix.length).split('_')[0]; 
      
      const worldPos = new THREE.Vector3();
      worldPos.setFromMatrixPosition(obj.matrixWorld);
      const posKey = `${worldPos.x.toFixed(3)},${worldPos.y.toFixed(3)},${worldPos.z.toFixed(3)}`;
      
      if (!seenPositions.has(posKey)) {
        slots.push({
          id: obj.name,
          type: type,
          fullName: obj.name,
          object: obj
        });
        seenPositions.add(posKey);
      }
    }
    
    if (obj.children) {
      obj.children.forEach(search);
    }
  };

  if (object.children) {
    object.children.forEach(search);
  }
  
  return slots;
};

// Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const ModuleSelectorPopover = ({ slotId, slotType, onClose, parentId }: { slotId: string, slotType: string, onClose: () => void, parentId: string }) => {
  const { allModules, addPart, selectedParts, removePart } = useConfiguratorStore();
  
  const compatibleModules = allModules.filter(m => {
    // Synonyms for tactical slots (EFT Style)
    const slotSynonyms: Record<string, string[]> = {
      muzzle: ['suppressors', 'muzzle', 'compensators', 'silencers', 'muzzle_brake'],
      scope: ['optics', 'scopes', 'sights', 'reflex_sights', 'magnifiers'],
      tactical: ['flashlights', 'lasers', 'tactical_combos'],
      magazine: ['magazines', 'mags'],
      handguard: ['handguards', 'rails'],
      stock: ['stocks', 'buttstocks']
    };

    const sType = slotType.toLowerCase();
    const category = m.category?.toLowerCase() || m.type?.toLowerCase() || '';
    
    // Check synonyms first
    const isSynonymMatch = slotSynonyms[sType]?.some(syn => 
      category.toLowerCase().includes(syn) || syn.includes(category.toLowerCase())
    );
    const fitsInSlot = m.attachmentSlot?.toLowerCase() === sType;
    const allowedInSlots = m.allowedSlots?.some(s => s.toLowerCase() === sType);
    
    let typeMatch = category === sType || fitsInSlot || allowedInSlots || isSynonymMatch;
    
    const activeProd = useConfiguratorStore.getState().activeProduct;
    const allowedWeapons = (m.compatibleWeapons && m.compatibleWeapons.length > 0) ? m.compatibleWeapons :
                          ((m.compatibleIds && m.compatibleIds.length > 0) ? m.compatibleIds : []);

    const weaponMatch = allowedWeapons.length === 0 || 
      allowedWeapons.some(w => 
        w.toLowerCase() === parentId.toLowerCase() || 
        (activeProd && (
          w.toLowerCase() === activeProd.id.toLowerCase() || 
          w.toLowerCase() === (activeProd.uid || '').toLowerCase() || 
          w.toLowerCase() === activeProd.name.toLowerCase()
        ))
      );
    
    // CRITICAL: If specifically whitelisted for this weapon, we allow it even if category/synonym check fails
    const isExplicitlyWhitelisted = allowedWeapons.some(w => 
      w.toLowerCase() === parentId.toLowerCase() || 
      (activeProd && w.toLowerCase() === activeProd.id.toLowerCase())
    );

    return (typeMatch && weaponMatch) || isExplicitlyWhitelisted;
  });

  const fullSlotId = `${parentId}:${slotId}`;
  const currentPart = selectedParts[fullSlotId];

  return (
    <div className="bg-black/90 backdrop-blur-3xl border border-white/5 rounded-2xl shadow-3xl w-64 max-h-[400px] flex flex-col overflow-hidden pointer-events-auto ring-1 ring-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <Layers size={12} className="text-amber-500" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">{slotType} SLOT</span>
        </div>
        <button onClick={onClose} className="p-1 text-zinc-600 hover:text-white transition-colors"><X size={14} /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {currentPart && (
          <button 
            onClick={() => { removePart(fullSlotId); onClose(); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <X size={18} />
            </div>
            <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest">DISASSEMBLE</p>
                <p className="text-[9px] font-bold text-red-500/60 truncate max-w-[120px]">{currentPart.name}</p>
            </div>
          </button>
        )}
        
        {compatibleModules.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-20">
            <Target size={24} className="text-zinc-600" />
            <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">NO DATA COMPATIBLE</p>
          </div>
        ) : (
          compatibleModules.map(module => (
            <button
              key={module.id}
              onClick={() => { addPart(module, fullSlotId); onClose(); }}
              className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all duration-500 group ${
                currentPart?.id === module.id 
                  ? 'bg-amber-500/10 border-amber-500/30 text-white' 
                  : 'bg-white/[0.02] border-white/5 hover:border-white/20 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="relative w-12 h-12 rounded-lg bg-black shrink-0 overflow-hidden border border-white/5">
                <img 
                    src={module.images?.[0] || module.image} 
                    className="w-full h-full object-contain opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" 
                    alt={module.name} 
                />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] font-black truncate uppercase tracking-tighter group-hover:tracking-normal transition-all">{module.name}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-zinc-600 font-mono">€{module.price}</span>
                    {module.brand && <span className="text-[8px] bg-white/5 px-1 rounded text-zinc-500 uppercase">{module.brand}</span>}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const Socket = ({ 
  slot,
  parentId,
  children, 
  isSelected,
  onClick,
  index = 0
}: { 
  slot: DiscoveredSlot;
  parentId: string;
  children?: ReactNode;
  isSelected?: boolean;
  onClick: () => void;
  index?: number;
}) => {
  const { selectedParts, setSelectedSlotId, showMarkers } = useConfiguratorStore();
  const [hovered, setHovered] = React.useState(false);
  const fullSlotId = `${parentId}:${slot.id}`;
  const currentPart = selectedParts[fullSlotId];

  React.useEffect(() => {
    if (slot.object) slot.object.visible = true;
  }, [slot.object]);

  // Cinematic Marker Layout
  const layout = useMemo(() => {
    let hash = 0;
    const seed = fullSlotId + index;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    const angle = Math.abs(hash) % 360;
    const rad = (angle * Math.PI) / 180;
    const lengthBase = 100 + (Math.abs(hash >> 2) % 60);
    return { angle, cos: Math.cos(rad), sin: Math.sin(rad), length: lengthBase };
  }, [fullSlotId, index]);

  return createPortal(
    <group>
      {children}
      
      {showMarkers && (
        <Html 
            distanceFactor={1.5} 
            position={[0, 0, 0]} 
            zIndexRange={isSelected ? [1000, 2000] : [10, 100]}
            occlude="blended"
        >
            <div className="relative pointer-events-none w-px h-px">
                {/* Connecting Line */}
                <div 
                    className={`absolute h-[1.5px] origin-left transition-all duration-700 ease-out ${
                        isSelected ? 'bg-amber-500 opacity-100 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : (hovered ? 'bg-white/40 opacity-60' : 'bg-white/10 opacity-30')
                    }`}
                    style={{ 
                        width: `${isSelected ? layout.length + 40 : (hovered ? layout.length + 20 : layout.length)}px`,
                        transform: `rotate(${layout.angle}deg)`,
                    }} 
                />

                {/* Interactive Node */}
                <div 
                    className={`absolute pointer-events-auto transition-all duration-700 ease-in-out ${isSelected ? 'scale-110' : 'scale-100'}`}
                    style={{ 
                        left: `${(isSelected ? layout.length + 40 : (hovered ? layout.length + 20 : layout.length)) * layout.cos}px`, 
                        top: `${(isSelected ? layout.length + 40 : (hovered ? layout.length + 20 : layout.length)) * layout.sin}px`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="relative group/node">
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onClick(); }}
                            onMouseEnter={() => setHovered(true)}
                            onMouseLeave={() => setHovered(false)}
                            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative backdrop-blur-xl ${
                                isSelected 
                                    ? 'bg-amber-500 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]' 
                                    : (currentPart 
                                        ? 'bg-zinc-950/80 border-white/20 hover:border-amber-500/50' 
                                        : 'bg-black/40 border-white/5 hover:border-white/20')
                            }`}
                        >
                            {currentPart ? (
                                <div className="p-1.5 w-full h-full">
                                    <img 
                                        src={currentPart.images?.[0] || currentPart.image} 
                                        className="w-full h-full object-contain opacity-80 group-hover/node:opacity-100 transition-opacity" 
                                        alt={currentPart.name}
                                    />
                                </div>
                            ) : (
                                <Plus size={20} className={`transition-all duration-500 ${hovered ? 'text-white rotate-90' : 'text-white/10'}`} />
                            )}

                            {/* Label */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <p className={`text-[8px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${
                                    isSelected ? 'text-amber-500 opacity-100 translate-y-0' : (hovered ? 'text-white opacity-100 translate-y-0' : 'text-zinc-700 opacity-0 translate-y-2')
                                }`}>
                                    {slot.type.replace(/_/g, ' ')}
                                </p>
                            </div>
                        </motion.button>

                        <AnimatePresence>
                            {isSelected && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 30 }}
                                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                    className="absolute top-0 left-full z-50 origin-left"
                                >
                                    <ModuleSelectorPopover 
                                        slotId={slot.id} 
                                        slotType={slot.type}
                                        parentId={parentId}
                                        onClose={() => setSelectedSlotId(null)} 
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </Html>
      )}
    </group>,
    slot.object
  );
};

const PartModel = ({ part, slot, parentId }: { part: Product; slot: DiscoveredSlot; parentId: string; }) => {
  const { selectedParts, setSelectedSlotId, selectedSlotId } = useConfiguratorStore();
  const fullSlotId = `${parentId}:${slot.id}`;
  
  const rawPath = part.model3D || part.model;
  const modelPath = rawPath ? (rawPath.startsWith('http') ? rawPath : `/models/${rawPath}`) : null;
  
  const [modelScene, setModelScene] = React.useState<THREE.Group | null>(null);
  const discoveredSlots = useMemo(() => modelScene ? discoverSlots(modelScene) : [], [modelScene]);

  return (
    <Socket 
      slot={slot}
      parentId={parentId}
      isSelected={selectedSlotId === fullSlotId}
      onClick={() => setSelectedSlotId(selectedSlotId === fullSlotId ? null : fullSlotId)}
    >
      <Suspense fallback={null}>
          {modelPath && (
            <ActualPartModel 
                path={modelPath} 
                slotType={slot.type}
                onLoad={(scene) => setModelScene(scene)}
            />
          )}
      </Suspense>
      
      {discoveredSlots.map((s, index) => {
        const partFullId = `${part.id}:${s.id}`;
        const attachedPart = selectedParts[partFullId];
        
        if (attachedPart) {
          return <PartModel key={partFullId} part={attachedPart} slot={s} parentId={part.id} />;
        }
        return (
          <Socket 
            key={partFullId}
            slot={s}
            parentId={part.id}
            isSelected={selectedSlotId === partFullId}
            onClick={() => setSelectedSlotId(selectedSlotId === partFullId ? null : partFullId)}
            index={index}
          />
        );
      })}
    </Socket>
  );
};

const ActualPartModel = ({ path, slotType, onLoad }: { path: string; slotType?: string; onLoad: (scene: THREE.Group) => void; }) => {
  const { scene } = useGLTF(path);
  
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone();
    clone.visible = true;
    
    let mountPoint: THREE.Object3D | null = null;
    clone.traverse((child) => {
      child.visible = true;
      const name = child.name.toLowerCase();
      // EFT v1.3 Magnet Logic
      if (slotType && name === `mod_${slotType.toLowerCase()}`) mountPoint = child;
      else if (!mountPoint && name.startsWith('mod_')) mountPoint = child;

      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if ((child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            mat.roughness = Math.min(mat.roughness, 0.7);
            mat.metalness = Math.max(mat.metalness, 0.3);
        }
      }
    });

    if (mountPoint) {
      // 1. Reset root transforms
      clone.position.set(0, 0, 0);
      clone.quaternion.set(0, 0, 0, 1);
      clone.scale.set(1, 1, 1);
      clone.updateMatrixWorld(true);

      // 2. Calculate the local matrix of mountPoint Relative to clone
      // Since clone is at origin with identity rotation/scale, 
      // mountPoint.matrixWorld IS the relative matrix we need.
      const relativeMatrix = mountPoint.matrixWorld.clone();
      
      // 3. Invert and apply to root to bring mountPoint to (0,0,0)
      const inverseMatrix = new THREE.Matrix4().copy(relativeMatrix).invert();
      clone.applyMatrix4(inverseMatrix);
      
      // 4. Force scale to exactly 1 to avoid export errors
      clone.scale.set(1, 1, 1);
      
      (mountPoint as any).isMountPoint = true;
    }
    
    clone.scale.set(1, 1, 1);
    return clone;
  }, [scene, path, slotType]);

  React.useEffect(() => {
    if (clonedScene) onLoad(clonedScene);
  }, [clonedScene, onLoad]);
  
  return clonedScene ? <primitive object={clonedScene} /> : null;
};

const WeaponModel = ({ product }: { product: Product }) => {
  const { selectedParts, setSelectedSlotId, selectedSlotId } = useConfiguratorStore();
  const rawPath = product.model3D || product.model;
  const modelPath = rawPath ? (rawPath.startsWith('http') ? rawPath : `/models/${rawPath}`) : null;
  
  const [weaponScene, setWeaponScene] = React.useState<THREE.Group | null>(null);
  const discoveredSlots = useMemo(() => weaponScene ? discoverSlots(weaponScene) : [], [weaponScene]);

  return (
    <group>
      <Suspense fallback={null}>
          {modelPath && <ActualWeaponModel path={modelPath} onLoad={(scene) => setWeaponScene(scene)} />}
      </Suspense>

      {discoveredSlots.map((s, index) => {
        const fullSlotId = `${product.id}:${s.id}`;
        const attachedPart = selectedParts[fullSlotId];
        
        if (attachedPart) {
          return <PartModel key={fullSlotId} part={attachedPart} slot={s} parentId={product.id} />;
        }
        return (
          <Socket 
            key={fullSlotId}
            slot={s}
            parentId={product.id}
            isSelected={selectedSlotId === fullSlotId}
            onClick={() => setSelectedSlotId(selectedSlotId === fullSlotId ? null : fullSlotId)}
            index={index}
          />
        );
      })}
    </group>
  );
};

const ActualWeaponModel = ({ path, onLoad }: { path: string, onLoad: (scene: THREE.Group) => void }) => {
  const { scene } = useGLTF(path);
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.scale.set(1, 1, 1);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, path]);

  React.useEffect(() => { onLoad(clonedScene); }, [clonedScene, onLoad]);
  return <primitive object={clonedScene} />;
};

export const Configurator3DV13: React.FC = () => {
  const { 
    activeProduct, 
    setSelectedSlotId, 
    showHUD, 
    toggleMarkers, 
    toggleHUD,
    setAllModules
  } = useConfiguratorStore();

  React.useEffect(() => {
    databaseService.getProducts().then(data => {
      if (data) {
        const modules = data.filter((p: Product) => p.type === 'module' || p.type === 'part');
        setAllModules(modules);
      }
    });
  }, [setAllModules]);

  return (
    <div className="w-full h-full bg-[#020202] relative overflow-hidden group/config">
        {/* Dynamic Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020202_100%)]" />

      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping }} onPointerMissed={() => setSelectedSlotId(null)}>
        <PerspectiveCamera makeDefault position={[2, 0.5, 2]} fov={30} />
        <Suspense fallback={null}>
          <group position={[0, -0.2, 0]}>
            {activeProduct && <WeaponModel product={activeProduct} />}
          </group>
          
          <ContactShadows opacity={0.6} scale={15} blur={3} far={10} color="#000000" />
          <OrbitControls 
            makeDefault 
            enableDamping 
            dampingFactor={0.03} 
            minDistance={1} 
            maxDistance={8} 
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 4}
          />
          
          <Environment preset="night" />
          <ambientLight intensity={0.1} />
          <spotLight position={[5, 10, 5]} angle={0.2} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4444ff" />
        </Suspense>
      </Canvas>
      
      {showHUD && (
        <>
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-24 left-8 pointer-events-none z-10"
          >
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-8 bg-amber-500" />
                    <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-1">
                            {activeProduct?.name}
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.4em]">
                                SYSTEM_ACTIVE // {activeProduct?.uid || 'GEN-4'}
                            </span>
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>

          {/* Tactical Command Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-6 py-3 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-full"
          >
              <HUDButton icon={<Target size={18} />} label="MARKERS" onClick={toggleMarkers} active={true} />
              <div className="w-px h-4 bg-white/10" />
              <HUDButton icon={<Settings size={18} />} label="UI" onClick={toggleHUD} active={true} />
              <div className="w-px h-4 bg-white/10" />
              <HUDButton icon={<Eye size={18} />} label="GOSS" onClick={() => {}} active={false} />
          </motion.div>
        </>
      )}
    </div>
  );
};

const HUDButton = ({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick: () => void, active: boolean }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all group ${
            active ? 'text-white hover:bg-white/5' : 'text-zinc-700 hover:text-zinc-500'
        }`}
    >
        <div className="group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] hidden sm:block">{label}</span>
    </button>
);
