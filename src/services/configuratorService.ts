import * as THREE from 'three';
import { Product, AttachPoint } from '../types';

/**
 * Compatibility Engine
 */
export class CompatibilityEngine {
  /**
   * Validates if an attachment can be mounted on a parent item
   */
  static canAttach(parent: Product, attachment: Product, slotId: string, rootProduct?: Product): boolean {
    // 1. Check if the parent has the specified slot
    const slot = parent.attachPoints?.find(p => p.id === slotId);
    if (!slot) {
      console.warn(`CompatibilityEngine: Slot ${slotId} not found on ${parent.name}`);
      return false;
    }

    // 2. Check if the attachment is allowed in this slot type or specific slot ID
    if (attachment.allowedSlots) {
      const isAllowedByType = attachment.allowedSlots.includes(slot.slotType);
      const isAllowedById = attachment.allowedSlots.includes(slot.id);
      
      if (!isAllowedByType && !isAllowedById) {
        console.log(`CompatibilityEngine: ${attachment.name} not allowed in slot ${slotId} (type: ${slot.slotType})`);
        return false;
      }
    }

    // 3. Check if parent explicitly allows this category
    if (parent.compatibleModuleCategories && parent.compatibleModuleCategories.length > 0) {
      if (!parent.compatibleModuleCategories.includes(attachment.subcategory || attachment.category)) {
        console.log(`CompatibilityEngine: ${parent.name} does not support category ${attachment.subcategory || attachment.category}`);
        return false;
      }
    }

    // 4. Check specific UID compatibility (Whitelisting)
    const allowedIds = (attachment.compatibleWeapons && attachment.compatibleWeapons.length > 0) ? attachment.compatibleWeapons : 
                       ((parent.compatibleIds && parent.compatibleIds.length > 0) ? parent.compatibleIds : []);
    
    if (allowedIds.length > 0) {
      if (!allowedIds.includes(parent.uid) && !allowedIds.includes(attachment.uid)) {
        console.log(`CompatibilityEngine: ${parent.name} has a whitelist that does not include ${attachment.uid}`);
        return false;
      }
    }

    // 5. Check global weapon compatibility
    if (attachment.compatibleWeapons && attachment.compatibleWeapons.length > 0) {
      const weaponUid = rootProduct?.uid || (parent.type === 'weapon' ? parent.uid : null);
      if (weaponUid && !attachment.compatibleWeapons.includes(weaponUid)) {
        console.log(`CompatibilityEngine: ${attachment.name} is not compatible with weapon ${weaponUid}`);
        return false;
      }
    }

    return true;
  }
}

/**
 * 3D Attachment Logic
 */
export const attachModule = (
  scene: THREE.Group | THREE.Scene,
  parentMesh: THREE.Object3D,
  attachmentProduct: Product,
  slot: AttachPoint,
  attachmentMesh: THREE.Object3D
) => {
  // 1. Find the anchor point in the parent mesh
  // In a professional setup, we look for a specific empty/mesh by name
  let anchor: THREE.Object3D | undefined;
  
  if (slot.meshName) {
    parentMesh.traverse((child) => {
      if (child.name === slot.meshName) {
        anchor = child;
      }
    });
  }

  // Fallback to coordinates if no named mesh anchor is found
  if (!anchor) {
    anchor = new THREE.Object3D();
    anchor.position.set(...slot.position);
    anchor.rotation.set(...slot.rotation);
    parentMesh.add(anchor);
  }

  // 2. Apply module's own socket offset (if any)
  // This ensures the module "sits" correctly on the rail
  if (attachmentProduct.socketPoint) {
    attachmentMesh.position.set(
      -attachmentProduct.socketPoint[0],
      -attachmentProduct.socketPoint[1],
      -attachmentProduct.socketPoint[2]
    );
  } else {
    attachmentMesh.position.set(0, 0, 0);
  }

  // 3. Parent the attachment to the anchor
  anchor.add(attachmentMesh);

  return anchor;
};

/**
 * Sample JSON structure for Rail Mount and Reflex Sight
 */
export const SAMPLE_COMPATIBILITY_DATA = {
  railMount: {
    uid: "mount_picatinny_01",
    name: "Low Profile Rail Mount",
    meshName: "mount_mesh",
    allowedSlots: ["picatinny_top"],
    compatibleIds: ["sight_reflex_01"], // Only allows this specific sight
    attachPoints: [
      {
        id: "optic_mount",
        slotType: "optic",
        position: [0, 0.02, 0],
        rotation: [0, 0, 0],
        meshName: "socket_optic"
      }
    ]
  },
  reflexSight: {
    uid: "sight_reflex_01",
    name: "Reflex Red Dot Sight",
    meshName: "reflex_mesh",
    allowedSlots: ["optic"],
    socketPoint: [0, -0.01, 0] // Sits 1cm below its own origin to clip into rail
  }
};
