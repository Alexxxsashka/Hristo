import React, { Suspense, useRef, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, createPortal } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float, Html, useGLTF, Text } from '@react-three/drei';
import { useConfiguratorStore } from '../store/configuratorStore';
import { Product } from '../types';
import { formatEnum } from '../utils/format';
import * as THREE from 'three';
import { X, Lightbulb, MousePointer2, Move, ZoomIn, Mouse, Eye, EyeOff, Maximize, Layout, Minimize, Sparkles, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { databaseService } from '../services/databaseService';

// EFT Style Slot Metadata
interface DiscoveredSlot {
  id: string;      // Unique identifier (the full object name)
  type: string;    // Logical type (e.g., muzzle, scope)
  fullName: string;
  object: THREE.Object3D;
}

const SLOT_PREFIXES = ['slot_', 'mod_'];

const discoverSlots = (object: THREE.Object3D): DiscoveredSlot[] => {
  const slots: DiscoveredSlot[] = [];
  const seenPositions = new Set<string>();
  
  // Ensure matrices are updated relative to the object root for accurate position discovery
  object.updateWorldMatrix(true, true);

  const search = (obj: THREE.Object3D) => {
    // Skip if this is the mount point used to attach this part
    if ((obj as any).isMountPoint) {
      if (obj.children) obj.children.forEach(search);
      return;
    }

    const name = obj.name.toLowerCase();
    const prefix = SLOT_PREFIXES.find(p => name.startsWith(p));
    
    if (prefix) {
      // Extract type (e.g. muzzle from slot_muzzle_01)
      const type = name.slice(prefix.length).split('_')[0]; 
      
      // EFT Logic: If multiple slots exist at the exact same position, only take one
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

// ScaleCompensator ensures that child objects (attachments) maintain a world scale 
// that matches the weapon's root world scale, regardless of the slot's local scale.
const ScaleCompensator = ({ children }: { children: ReactNode }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current && groupRef.current.parent) {
      const parent = groupRef.current.parent;
      
      // Find the weapon root (top-most parent before the scene)
      let weaponRoot = parent;
      while (weaponRoot.parent && !(weaponRoot.parent instanceof THREE.Scene)) {
        weaponRoot = weaponRoot.parent;
      }
      
      const parentWorldScale = new THREE.Vector3();
      const targetWorldScale = new THREE.Vector3();
      
      // Ensure matrices are up to date for accurate scale retrieval
      parent.updateWorldMatrix(true, false);
      weaponRoot.updateWorldMatrix(true, false);
      
      parent.getWorldScale(parentWorldScale);
      weaponRoot.getWorldScale(targetWorldScale);
      
      if (parentWorldScale.x !== 0 && parentWorldScale.y !== 0 && parentWorldScale.z !== 0) {
        let sx = targetWorldScale.x / parentWorldScale.x;
        let sy = targetWorldScale.y / parentWorldScale.y;
        let sz = targetWorldScale.z / parentWorldScale.z;
        
        // HYPER-SCALE PROTECTION:
        // If the compensation factor is extreme (like 100x), it usually means 
        // the parent model is using Blender's 0.01 units. In this case, 
        // we should actually NOT compensate if our part is already real-world size.
        if (sx > 10 || sx < 0.1) {
          console.log(`[ScaleCompensator] Hyper-scaling detected (${sx.toFixed(2)}x). Reverting to 1:1 to prevent visual bugs.`);
          sx = 1; sy = 1; sz = 1;
        }

        // Only update if changed significantly to avoid jitter
        if (Math.abs(groupRef.current.scale.x - sx) > 0.0001) {
          console.log(`[ScaleCompensator] Adjusting scale. Final:`, { sx, sy, sz });
          groupRef.current.scale.set(sx, sy, sz);
        }
      }
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

// Error Boundary for 3D components
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("3D Model Loading Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const ModelFallback = ({ label, type = 'part', onSceneLoad }: { label: string, type?: 'weapon' | 'part', onSceneLoad?: (scene: THREE.Group) => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  React.useEffect(() => {
    if (groupRef.current && onSceneLoad && type === 'part') {
      onSceneLoad(groupRef.current);
    }
  }, [onSceneLoad, type]);

  return (
    <group ref={groupRef} />
  );
};

const ModuleSelectorPopover = ({ slotId, slotType, onClose, parentId }: { slotId: string, slotType: string, onClose: () => void, parentId: string }) => {
  const { allModules, addPart, selectedParts, removePart } = useConfiguratorStore();
  
  // EFT Logic: Filter modules by category matching the slot type
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
    const cat = (m.category || '').toLowerCase();
    const subcat = (m.subcategory || '').toLowerCase();
    const catId = (m.category_id || '').toLowerCase();
    const mType = (m.type || '').toLowerCase();
    
    // 1. SLOT TYPE MATCH (Check all possible category fields)
    const isSynonymMatch = slotSynonyms[sType]?.some(syn => 
      cat.includes(syn) || subcat.includes(syn) || catId.includes(syn) || syn.includes(cat) || syn.includes(subcat) || syn.includes(catId)
    );
    
    const fitsInSlot = (m.attachmentSlot || '').toLowerCase() === sType;
    const allowedInSlots = (m.allowedSlots || []).some(s => s.toLowerCase() === sType);
    
    const typeMatch = cat === sType || subcat === sType || catId === sType || mType === sType || fitsInSlot || allowedInSlots || isSynonymMatch;
    
    // 2. WEAPON MATCH (Whitelists)
    const activeProd = useConfiguratorStore.getState().activeProduct;
    const allowedWeapons = (m.compatibleWeapons && m.compatibleWeapons.length > 0) ? m.compatibleWeapons :
                          ((m.compatibleIds && m.compatibleIds.length > 0) ? m.compatibleIds : []);

    const isExplicitlyWhitelisted = allowedWeapons.some(w => 
      w.toLowerCase() === parentId.toLowerCase() || 
      (activeProd && (
        w.toLowerCase() === activeProd.id.toLowerCase() || 
        w.toLowerCase() === (activeProd.uid || '').toLowerCase()
      ))
    );

    const weaponMatch = allowedWeapons.length === 0 || isExplicitlyWhitelisted;

    // Both must be true: It must fit the SLOT TYPE and be allowed on this WEAPON
    const isCompatible = typeMatch && weaponMatch;

    if (sType === 'muzzle' || sType === 'scope') {
      console.log(`[Configurator V1.2] Checking module "${m.name}" for slot "${sType}":`, {
        cat,
        subcat,
        catId,
        typeMatch,
        weaponMatch,
        isCompatible,
        allowedWeapons,
        parentId
      });
    }

    return isCompatible;
  });

  console.log(`[Configurator V1.2] Slot "${slotType}" (${slotId}) final compatible modules:`, compatibleModules.length);

  const fullSlotId = `${parentId}:${slotId}`;
  const currentPart = selectedParts[fullSlotId];

  return (
    <div className="bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-xl shadow-2xl w-56 sm:w-64 max-h-72 sm:max-h-80 overflow-y-auto p-2 pointer-events-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-2 px-2 py-1">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select Module</span>
        <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white"><X size={14} /></button>
      </div>
      <div className="space-y-1.5">
        {currentPart && (
          <button 
            onClick={() => { removePart(fullSlotId); onClose(); }}
            className="w-full flex items-center gap-3 p-2 rounded-lg bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600/20 transition-all"
          >
            <div className="w-8 h-8 rounded bg-red-600/20 flex items-center justify-center shrink-0">
              <X size={16} />
            </div>
            <span className="text-xs font-bold uppercase">Remove Current</span>
          </button>
        )}
        {compatibleModules.length === 0 ? (
          <p className="text-[10px] text-zinc-600 text-center py-6 uppercase font-bold tracking-widest">No compatible modules</p>
        ) : (
          compatibleModules.map(module => (
            <button
              key={module.id}
              onClick={() => { addPart(module, fullSlotId); onClose(); }}
              className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                currentPart?.id === module.id 
                  ? 'bg-red-600/20 border-red-500 text-white' 
                  : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 text-zinc-300'
              }`}
            >
              <img src={module.images && module.images.length > 0 ? module.images[0] : (module.image?.startsWith('http') ? module.image : (module.image || `https://picsum.photos/seed/${module.id}/100/100`))} className="w-8 h-8 object-cover rounded bg-black shrink-0" alt={module.name} />
              <div className="text-left overflow-hidden">
                <p className="text-[10px] font-bold truncate uppercase">{module.name}</p>
                <p className="text-[9px] text-zinc-500 font-mono mt-0.5">€{module.price}</p>
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

  // Ensure visibility on the slot object
  React.useEffect(() => {
    if (slot.object) {
      slot.object.visible = true;
    }
  }, [slot.object]);

  const layout = useMemo(() => {
    let hash = 0;
    const seed = fullSlotId + index;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a pseudo-random angle (0-360)
    const angle = Math.abs(hash) % 360;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Randomize length offset for more variety (0-100px)
    const lengthOffset = Math.abs(hash >> 2) % 100;
    
    return { angle, cos, sin, lengthOffset };
  }, [fullSlotId, index]);

  React.useEffect(() => {
    document.body.style.cursor = hovered && showMarkers ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered, showMarkers]);

  // Use createPortal to render children into the slot object.
  return createPortal(
    <group>
      <ScaleCompensator>
        {children}
      </ScaleCompensator>
      
      {showMarkers && (
        <group>
          <Html 
            distanceFactor={1.2} 
            position={[0, 0, 0]} 
            zIndexRange={isSelected ? [1000, 2000] : [10, 100]}
          >
            <div className="relative pointer-events-none" style={{ width: '1px', height: '1px' }}>
              <div 
                className={`absolute h-[1px] bg-gradient-to-r from-white/60 to-transparent origin-left transition-all duration-500 ${
                  isSelected 
                    ? 'from-red-500 opacity-100' 
                    : (hovered ? 'opacity-80' : 'opacity-30')
                }`}
                style={{ 
                  width: `${(isSelected ? 120 : (hovered ? 100 : 80)) + layout.lengthOffset}px`,
                  left: '0', 
                  top: '0', 
                  transform: `rotate(${layout.angle}deg)`,
                  boxShadow: isSelected ? '0 0 8px rgba(239, 68, 68, 0.5)' : 'none'
                }} 
              >
                <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-colors ${
                  isSelected ? 'bg-red-500' : 'bg-white/40'
                }`} />
              </div>
              
              <div 
                className={`absolute pointer-events-auto transition-all duration-300 ${
                  isSelected ? 'scale-110' : 'scale-100'
                }`}
                style={{ 
                  left: `${((isSelected ? 120 : (hovered ? 100 : 80)) + layout.lengthOffset) * layout.cos}px`, 
                  top: `${((isSelected ? 120 : (hovered ? 100 : 80)) + layout.lengthOffset) * layout.sin}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative group/cell">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    className={`w-12 h-12 sm:w-10 sm:h-10 border flex items-center justify-center transition-all overflow-hidden relative ${
                      isSelected 
                        ? 'bg-red-600/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                        : (currentPart 
                            ? 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500' 
                            : 'bg-black/60 border-white/10 hover:border-white/30 hover:bg-black/80')
                    }`}
                  >
                    {currentPart ? (
                      <img 
                        src={currentPart.images && currentPart.images.length > 0 ? currentPart.images[0] : (currentPart.image?.startsWith('http') ? currentPart.image : (currentPart.image || `https://picsum.photos/seed/${currentPart.id}/200/200`))} 
                        className="w-full h-full object-cover opacity-90 group-hover/cell:opacity-100 transition-opacity" 
                        alt={currentPart.name}
                      />
                    ) : (
                      <Plus size={16} className={`transition-all ${hovered ? 'text-white scale-110' : 'text-white/20'}`} />
                    )}
                    
                    <div className="absolute -top-4 sm:-top-3 left-0 whitespace-nowrap">
                      <span className={`text-[8px] sm:text-[6px] font-black uppercase tracking-[0.2em] transition-colors ${
                        isSelected ? 'text-red-500' : 'text-zinc-500'
                      }`}>
                        {slot.type}
                      </span>
                    </div>
                  </button>

                  <motion.div 
                    initial={false}
                    animate={{ 
                      opacity: isSelected ? 1 : 0,
                      x: isSelected ? 12 : 0,
                      scale: isSelected ? 1 : 0.95,
                      pointerEvents: isSelected ? 'auto' : 'none'
                    }}
                    className="absolute top-0 left-full z-50"
                  >
                    <ModuleSelectorPopover 
                      slotId={slot.id} 
                      slotType={slot.type}
                      parentId={parentId}
                      onClose={() => setSelectedSlotId(null)} 
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>,
    slot.object
  );
};

const PartModel = ({ 
  part, 
  slot,
  parentId
}: { 
  part: Product; 
  slot: DiscoveredSlot;
  parentId: string;
}) => {
  const { selectedParts, setSelectedSlotId, selectedSlotId } = useConfiguratorStore();
  const fullSlotId = `${parentId}:${slot.id}`;
  
  // Backwards compatibility for all naming conventions
  const rawPath = part.model3D || part.model || (part as any).model_3d_url || (part as any).model_url;
  
  console.log(`[PartModel V1.2] Rendering part "${part.name}" (ID: ${part.id}) for slot "${slot.id}". RawPath:`, rawPath);

  const modelPath = rawPath 
    ? (rawPath.startsWith('http') ? rawPath : `/models/${rawPath}`)
    : null;
  
  if (!modelPath) {
    console.warn(`[PartModel V1.2] No valid 3D path for "${part.name}". Data:`, {
      model3D: part.model3D,
      model: part.model,
      model_3d_url: (part as any).model_3d_url
    });
  }

  const [modelScene, setModelScene] = React.useState<THREE.Group | null>(null);
  const discoveredSlots = useMemo(() => {
    if (!modelScene) return [];
    console.log(`[PartModel V1.2] Model scene ready for "${part.name}". Discovering sub-slots...`);
    return discoverSlots(modelScene);
  }, [modelScene, part.name]);

  console.log(`[PartModel V1.2] Preparing to mount ActualPartModel for "${part.name}". Path: ${modelPath}`);

  return (
    <Socket 
      slot={slot}
      parentId={parentId}
      isSelected={selectedSlotId === fullSlotId}
      onClick={() => setSelectedSlotId(selectedSlotId === fullSlotId ? null : fullSlotId)}
    >
      <ErrorBoundary fallback={<ModelFallback label={part.name} type="part" onSceneLoad={setModelScene} />}>
        <Suspense fallback={<ModelFallback label={part.name} type="part" onSceneLoad={setModelScene} />}>
          <ActualPartModel 
            path={modelPath} 
            socketPoint={part.socketPoint}
            slotType={slot.type}
            partName={part.name}
            onLoad={(scene) => {
              console.log(`[PartModel V1.2] ActualPartModel LOADED for "${part.name}"`);
              setModelScene(scene);
            }}
          />
        </Suspense>
      </ErrorBoundary>
      
      {discoveredSlots.map((s, index) => {
        const partFullId = `${part.id}:${s.id}`;
        const attachedPart = selectedParts[partFullId];
        
        if (attachedPart) {
          return (
            <PartModel 
              key={partFullId} 
              part={attachedPart} 
              slot={s}
              parentId={part.id}
            />
          );
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
const ActualPartModel = ({ 
  path, 
  socketPoint,
  slotType,
  partName,
  onLoad 
}: { 
  path: string | null; 
  socketPoint?: [number, number, number];
  slotType?: string;
  partName: string;
  onLoad: (scene: THREE.Group) => void;
}) => {
  const [scene, setScene] = React.useState<THREE.Group | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!path) return;
    
    console.log(`[ActualPartModel V1.2] Manual Loading started for "${partName}":`, path);
    const loader = new GLTFLoader();
    
    loader.load(
      path,
      (gltf) => {
        console.log(`[ActualPartModel V1.2] Manual Loading SUCCESS for "${partName}"`);
        setScene(gltf.scene);
      },
      (xhr) => {
        // Progress
        // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (err) => {
        console.error(`[ActualPartModel V1.2] Manual Loading ERROR for "${partName}":`, err);
        setError(String(err));
      }
    );
  }, [path, partName]);

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    
    console.log(`[ActualPartModel V1.2] Processing model: ${path} for slot type: ${slotType}`);
    const clone = scene.clone();
    
    // Force visibility on the entire hierarchy
    clone.visible = true;
    
    let mountPoint: THREE.Object3D | null = null;
    clone.traverse((child) => {
      child.visible = true;
      const name = child.name.toLowerCase();
      if (slotType && name === `mod_${slotType.toLowerCase()}`) {
        mountPoint = child;
      } else if (!mountPoint && name.startsWith('mod_')) {
        mountPoint = child;
      }

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach(mat => {
            mat.visible = true;
            if (mat.opacity < 0.01) mat.opacity = 1;
            mat.transparent = mat.opacity < 1;
            mat.depthWrite = true;
            mat.depthTest = true;
            mat.side = THREE.DoubleSide;
          });
        }
        mesh.frustumCulled = false;
      }
    });

    if (mountPoint) {
      clone.position.set(0, 0, 0);
      clone.quaternion.set(0, 0, 0, 1);
      clone.scale.set(1, 1, 1);
      clone.updateMatrix();
      clone.updateMatrixWorld(true);

      const relativeMatrix = mountPoint.matrixWorld.clone();
      const inverseMatrix = new THREE.Matrix4().copy(relativeMatrix).invert();
      clone.applyMatrix4(inverseMatrix);
      (mountPoint as any).isMountPoint = true;
      console.log(`[ActualPartModel V1.2] Matrix Aligned via Manual Loader: ${mountPoint.name}`);
    } else if (socketPoint && Array.isArray(socketPoint)) {
      clone.position.set(-socketPoint[0], -socketPoint[1], -socketPoint[2]);
    } else {
      const box = new THREE.Box3().setFromObject(clone);
      if (!box.isEmpty()) {
        const center = new THREE.Vector3();
        box.getCenter(center);
        clone.position.sub(center);
      }
    }
    
    clone.scale.set(1, 1, 1);
    const FinalBox = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    FinalBox.getSize(size);
    
    console.log(`[ActualPartModel V1.2] Computed Size for "${partName}":`, {
      width: size.x.toFixed(4),
      height: size.y.toFixed(4),
      depth: size.z.toFixed(4),
      totalLength: size.length().toFixed(4)
    });

    if (size.length() < 0.01) {
      console.warn(`[ActualPartModel V1.2] Model is TINY (under 1cm), forcing 100x scale`);
      clone.scale.set(100, 100, 100);
    }
    
    return clone;
  }, [scene, socketPoint, path, slotType, partName]);

  React.useEffect(() => {
    if (clonedScene) {
      onLoad(clonedScene);
    }
  }, [clonedScene, onLoad]);
  
  if (error) return null;
  if (!clonedScene) return null;
  
  return <primitive object={clonedScene} />;
};

const WeaponModel = ({ product }: { product: Product }) => {
  const { selectedParts, setSelectedSlotId, selectedSlotId } = useConfiguratorStore();
  const rawPath = product.model3D || product.model;
  const modelPath = rawPath 
    ? (rawPath.startsWith('http') ? rawPath : `/models/${rawPath}`)
    : null;
  
  const [weaponScene, setWeaponScene] = React.useState<THREE.Group | null>(null);
  const discoveredSlots = useMemo(() => weaponScene ? discoverSlots(weaponScene) : [], [weaponScene]);

  React.useEffect(() => {
    console.log(`[WeaponModel V1.2] EFT Style Loading: ${product.name}`);
  }, [product.id]);

  return (
    <group>
      <ErrorBoundary fallback={<ModelFallback label={product.name} type="weapon" onSceneLoad={setWeaponScene} />}>
        <Suspense fallback={<ModelFallback label={product.name} type="weapon" onSceneLoad={setWeaponScene} />}>
          <ActualWeaponModel path={modelPath} onLoad={(scene) => setWeaponScene(scene)} />
        </Suspense>
      </ErrorBoundary>

      {discoveredSlots.map((s, index) => {
        const fullSlotId = `${product.id}:${s.id}`;
        const attachedPart = selectedParts[fullSlotId];
        
        if (attachedPart) {
          console.log(`[WeaponModel V1.2] Found attached part for slot ${fullSlotId}:`, attachedPart.name);
          return (
            <PartModel 
              key={fullSlotId} 
              part={attachedPart} 
              slot={s}
              parentId={product.id}
            />
          );
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

const ActualWeaponModel = ({ path, onLoad }: { path: string | null, onLoad: (scene: THREE.Group) => void }) => {
  if (!path) return null;
  
  try {
    const { scene } = useGLTF(path);
    
    const clonedScene = useMemo(() => {
      const clone = scene.clone();
      console.log(`[ActualWeaponModel V1.2] Loaded weapon: ${path}`);
      
      // Force scale to 1.0 to ensure consistent world units
      clone.scale.set(1, 1, 1);
      
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return clone;
    }, [scene, path]);

    React.useEffect(() => {
      onLoad(clonedScene);
    }, [clonedScene, onLoad]);

    return <primitive object={clonedScene} />;
  } catch (error) {
    console.error(`[ActualWeaponModel] Failed to load model at ${path}:`, error);
    throw error;
  }
};

export const Configurator3DV12: React.FC = () => {
  const { 
    activeProduct, 
    selectedSlotId, 
    setSelectedSlotId, 
    showMarkers, 
    showHUD, 
    toggleMarkers, 
    toggleHUD,
    toggleFullscreen,
    isFullscreen,
    setAllModules
  } = useConfiguratorStore();

  React.useEffect(() => {
    databaseService.getProducts()
      .then(data => {
        if (data) {
          // Broaden filter: catch anything that isn't a primary weapon
          const modules = data.filter((p: Product) => 
            p.type !== 'weapon' && p.category?.toLowerCase() !== 'weapons'
          );
          setAllModules(modules);
        }
      });
  }, [setAllModules]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') toggleMarkers();
      if (e.key.toLowerCase() === 'h') toggleHUD();
      if (e.key.toLowerCase() === 'f') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMarkers, toggleHUD, toggleFullscreen]);
  
  return (
    <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden group/config">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]} performance={{ min: 0.5 }} onPointerMissed={() => setSelectedSlotId(null)}>
        <PerspectiveCamera makeDefault position={[1.5, 1, 1.5]} fov={35} />
        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            {activeProduct && <WeaponModel product={activeProduct} />}
          </group>
          
          <ContactShadows 
            opacity={0.4} 
            scale={10} 
            blur={2.4} 
            far={4.5} 
            resolution={256} 
            color="#000000" 
          />
          
          <OrbitControls 
            makeDefault 
            enableDamping
            dampingFactor={0.05}
            minDistance={0.5}
            maxDistance={5}
          />
          
          <Environment preset="city" /> {/* Slightly different preset for V1.2 */}
          <ambientLight intensity={0.3} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        </Suspense>
      </Canvas>
      
      {/* HUD Overlays */}
      {showHUD && (
        <>
          <div className="absolute top-20 sm:top-24 left-4 sm:left-8 pointer-events-none z-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-none">
                {activeProduct?.name}
              </h2>
              <div className="px-1.5 sm:px-2 py-0.5 bg-red-600 rounded text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={8} />
                V1.2
              </div>
            </div>
            <p className="text-zinc-500 font-mono text-[10px] sm:text-sm uppercase tracking-widest">
              Platform: {activeProduct?.id}
            </p>
          </div>

          <div className="absolute top-20 sm:top-24 right-4 sm:right-8 z-20 group">
            <button className="w-10 h-10 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-500/50 transition-all shadow-2xl">
              <Lightbulb size={20} />
            </button>
            
            <div className="absolute top-12 right-0 sm:top-0 sm:right-12 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 translate-y-4 sm:translate-y-0 sm:translate-x-4 group-hover:translate-y-0 group-hover:translate-x-0">
              <div className="bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 p-4 rounded-2xl shadow-2xl w-56 sm:w-64">
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                  Navigation Guide
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <MousePointer2 size={14} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">Rotate Model</p>
                      <p className="text-[9px] text-zinc-500 font-mono uppercase">Left Click + Drag</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <Move size={14} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">Pan Camera</p>
                      <p className="text-[9px] text-zinc-500 font-mono uppercase">Right Click + Drag</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <ZoomIn size={14} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">Zoom In/Out</p>
                      <p className="text-[9px] text-zinc-500 font-mono uppercase">Scroll Wheel</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <Mouse size={14} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">Select Slot</p>
                      <p className="text-[9px] text-zinc-500 font-mono uppercase">Click on Socket</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
                    V1.2 features enhanced lighting and faster response times.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[7px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">[M] Markers</span>
                    <span className="text-[7px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">[H] HUD</span>
                    <span className="text-[7px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">[F] Fullscreen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </>
      )}

      <motion.div 
        initial={false}
        animate={{ 
          opacity: showHUD ? 1 : 0
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl z-50 transition-all duration-500 ${showHUD ? 'bottom-40 md:bottom-32' : 'bottom-8'}`}
      >
        <button 
          onClick={toggleMarkers}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            showMarkers ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
          }`}
          title="Toggle Markers [M]"
        >
          {showMarkers ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
        
        <button 
          onClick={toggleHUD}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            showHUD ? 'bg-zinc-800 text-white' : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
          }`}
          title="Toggle Interface [H]"
        >
          <Layout size={18} />
        </button>

        <div className="w-px h-6 bg-zinc-800 mx-1" />

        <button 
          onClick={toggleFullscreen}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isFullscreen ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
          }`}
          title="Toggle Fullscreen [F]"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </motion.div>
    </div>
  );
};
