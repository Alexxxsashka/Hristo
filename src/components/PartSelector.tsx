import React from 'react';
import { useConfiguratorStore } from '../store/configuratorStore';
import { Product } from '../types';
import { Plus, X, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { databaseService } from '../services/databaseService';

export const PartSelector: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => {
  const { activeProduct, selectedParts, addPart, removePart, checkCompatibility, selectedSlotId, setSelectedSlotId } = useConfiguratorStore();
  const [allModules, setAllModules] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hoveredPart, setHoveredPart] = React.useState<Product | null>(null);
  const { t } = useTranslation();

  const getStatChange = (part: Product) => {
    if (!part.characteristics) return null;
    const changes: Record<string, number> = {};
    part.characteristics.forEach(c => {
      const val = parseInt(c.value);
      if (!isNaN(val)) {
        const label = c.label.toLowerCase();
        if (label.includes('damage')) changes.damage = val;
        if (label.includes('accuracy')) changes.accuracy = val;
        if (label.includes('range')) changes.range = val;
        if (label.includes('fire rate')) changes.fireRate = val;
        if (label.includes('mobility')) changes.mobility = val;
        if (label.includes('control')) changes.control = val;
      }
    });
    return Object.keys(changes).length > 0 ? changes : null;
  };
  
  React.useEffect(() => {
    databaseService.getProducts()
      .then(data => {
        if (data) {
          // Include both 'module' and 'part' types
          const modules = data.filter((p: Product) => p.type === 'module' || p.type === 'part');
          setAllModules(modules);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!activeProduct) return null;

  // Filter modules compatible with the currently selected slot
  const compatibleModules = allModules.filter(m => {
    if (!selectedSlotId) return true; // Show all if no slot selected
    const [parentId, rawSlotType] = selectedSlotId.split(':');
    const slotType = rawSlotType.toLowerCase().replace(/^(slot_|mod_)/, '');
    
    const category = m.category?.toLowerCase() || m.type?.toLowerCase();
    const fitsInSlot = m.attachmentSlot?.toLowerCase() === slotType;
    const allowedInSlots = m.allowedSlots?.some(s => s.toLowerCase() === slotType);
    
    const typeMatch = category === slotType || fitsInSlot || allowedInSlots;
    
    // Check weapon compatibility if specified (Whitelisting)
    const allowedWeapons = (m.compatibleWeapons && m.compatibleWeapons.length > 0) ? m.compatibleWeapons :
                          ((m.compatibleIds && m.compatibleIds.length > 0) ? m.compatibleIds : []);

    const weaponMatch = allowedWeapons.length === 0 || 
      allowedWeapons.includes(parentId) || 
      (activeProduct && (
        allowedWeapons.includes(activeProduct.id) || 
        allowedWeapons.includes(activeProduct.uid) || 
        allowedWeapons.includes(activeProduct.name)
      ));
    
    return typeMatch && weaponMatch;
  });

  // Group modules by category
  const categories = Array.from(new Set(compatibleModules.map(p => p.category)));

  return (
    <div className={`h-full flex flex-col bg-zinc-950 ${isMobile ? '' : 'border-l border-zinc-800 w-full'} overflow-hidden`}>
      <div className="p-4 md:p-6 border-b border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base md:text-lg font-bold text-white uppercase tracking-wider">{t('modifications')}</h3>
          {selectedSlotId && (
            <button 
              onClick={() => setSelectedSlotId(null)}
              className="text-[9px] md:text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-1"
            >
              <X size={12} />
              {t('clear_selection')}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 custom-scrollbar">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-zinc-900/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-zinc-600 text-xs uppercase tracking-widest font-mono">{t('no_compatible_modules_found')}</p>
          </div>
        ) : (
          <>
            {!selectedSlotId && (
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl mb-6">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold leading-relaxed">
                  <span className="text-red-500 mr-1">●</span>
                  {t('showing_all_modules')}
                </p>
              </div>
            )}
            
            {categories.map(category => (
              <div key={category} className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-red-600 rounded-full" />
                  {category}
                </h4>
                
                <div className="space-y-2">
                  {compatibleModules
                    .filter(p => p.category === category)
                    .map(part => {
                      const isSelected = selectedSlotId ? selectedParts[selectedSlotId]?.id === part.id : false;
                      const isOccupiedByOther = selectedSlotId ? (selectedParts[selectedSlotId] && !isSelected) : false;
                      
                      const [parentId, rawSlotType] = selectedSlotId ? selectedSlotId.split(':') : [null, null];
                      const slotType = rawSlotType ? rawSlotType.toLowerCase().replace(/^(slot_|mod_)/, '') : null;
                      
                      const category = part.category?.toLowerCase() || part.type?.toLowerCase();
                      const fitsInSlot = slotType ? part.attachmentSlot?.toLowerCase() === slotType : false;
                      const allowedInSlots = slotType ? part.allowedSlots?.some(s => s.toLowerCase() === slotType) : false;
                      
                      const isCompatible = slotType ? (category === slotType || fitsInSlot || allowedInSlots) : true;
                      
                      // Check weapon compatibility if specified
                      const weaponMatch = !part.compatibleWeapons || part.compatibleWeapons.length === 0 || 
                        (parentId ? part.compatibleWeapons.includes(parentId) : true) ||
                        (activeProduct && (
                          part.compatibleWeapons.includes(activeProduct.id) || 
                          part.compatibleWeapons.includes(activeProduct.uid) || 
                          part.compatibleWeapons.includes(activeProduct.name)
                        ));
                      
                      const finalCompatible = isCompatible && weaponMatch;
                      
                      return (
                        <motion.div 
                          key={part.id}
                          whileHover={{ x: 4 }}
                          onMouseEnter={() => setHoveredPart(part)}
                          onMouseLeave={() => setHoveredPart(null)}
                          className={`group p-3 rounded-lg border transition-all duration-200 cursor-pointer relative ${
                            isSelected 
                              ? 'bg-red-600/10 border-red-600/50' 
                              : !finalCompatible && !isSelected
                                ? 'bg-red-50/5 border-red-900/20 opacity-60'
                                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                          }`}
                          onClick={() => {
                            if (!selectedSlotId) {
                              console.warn("Please select a socket on the 3D model first.");
                              return;
                            }
                            
                            if (isSelected) {
                              removePart(selectedSlotId);
                            } else if (finalCompatible) {
                              addPart(part, selectedSlotId);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-bold ${isSelected ? 'text-red-500' : 'text-zinc-200'}`}>
                                  {part.name}
                                </p>
                                {isSelected && <CheckCircle2 size={12} className="text-red-600" />}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-[10px] text-zinc-500 font-mono">
                                  +€{part.price}
                                </p>
                                
                                {/* Stat Changes */}
                                {getStatChange(part) && (
                                  <div className="flex gap-1.5">
                                    {Object.entries(getStatChange(part)!).map(([stat, val]) => (
                                      <div key={stat} className="flex items-center gap-0.5">
                                        <div className={`w-1 h-1 rounded-full ${val > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        <span className={`text-[8px] font-bold ${val > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                          {val > 0 ? '+' : ''}{val}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white">
                                  <X size={14} />
                                </div>
                              ) : (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                  !finalCompatible 
                                    ? 'bg-zinc-900 text-zinc-700' 
                                    : isOccupiedByOther 
                                      ? 'bg-amber-500/20 text-amber-500' 
                                      : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                                }`}>
                                  {!finalCompatible ? <X size={14} /> : isOccupiedByOther ? <Plus size={14} /> : <Plus size={14} />}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isOccupiedByOther && (
                            <p className="text-[10px] text-amber-500/70 mt-2 uppercase font-bold tracking-tighter">
                              {t('replaces_current_part')}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
