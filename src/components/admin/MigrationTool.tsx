import React, { useState } from 'react';
import { Database, Plus, Crosshair, Shield, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { databaseService } from '../../services/databaseService';
import { Product, Category } from '../../types';

export const MigrationTool = ({ products, categories, confirmAction, onNotify }: { 
  products: Product[], 
  categories: Category[], 
  confirmAction: (msg: string, onConfirm: () => void) => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const seedDefaultData = async () => {
    if (status === 'loading') return;
    
    // Check if data already exists to avoid duplicates
    if (products.length > 0 || categories.length > 0) {
      confirmAction('Data already exists in the database. Are you sure you want to seed default data again? This may create duplicates.', async () => {
        await performSeeding();
      });
    } else {
      await performSeeding();
    }
  };

  const performSeeding = async () => {
    setStatus('loading');
    setLogs([]);
    setProgress(0);
    addLog('Starting seeding process...');

    try {
      const defaultCategories = [
        { id: 'airsoft_weapons', name: 'Airsoft Weapons', slug: 'airsoft-weapons', parent: null, filters: [
          { id: 'brand', label: 'Brand', type: 'select', options: ['CYMA', 'Specna Arms', 'Tokyo Marui', 'G&G', 'Krytac', 'LCT', 'E&L'] },
          { id: 'velocity_fps', label: 'Velocity (FPS)', type: 'range' },
          { id: 'power_source', label: 'Power Source', type: 'select', options: ['Electric', 'Gas', 'CO2', 'Spring', 'HPA'] },
          { id: 'body_material', label: 'Body Material', type: 'select', options: ['Full Metal', 'Polymer', 'Steel'] }
        ]},
        { id: 'assault_rifles', name: 'Assault Rifles', slug: 'assault-rifles', parent: 'airsoft_weapons' },
        { id: 'pistols', name: 'Pistols', slug: 'pistols', parent: 'airsoft_weapons' },
        { id: 'sniper_rifles', name: 'Sniper Rifles', slug: 'sniper-rifles', parent: 'airsoft_weapons' },
        { id: 'tactical_gear', name: 'Tactical Gear', slug: 'tactical-gear', parent: null, filters: [
          { id: 'color', label: 'Color', type: 'select', options: ['Black', 'Tan', 'Olive', 'Multicam', 'A-TACS'] },
          { id: 'size', label: 'Size', type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL'] }
        ]},
        { id: 'plate_carriers', name: 'Plate Carriers', slug: 'plate-carriers', parent: 'tactical_gear' },
        { id: 'helmets', name: 'Helmets', slug: 'helmets', parent: 'tactical_gear' },
        { id: 'accessories', name: 'Accessories', slug: 'accessories', parent: null },
        { id: 'optics', name: 'Optics', slug: 'optics', parent: 'accessories' },
        { id: 'consumables', name: 'Consumables', slug: 'consumables', parent: null },
        { id: 'bbs', name: 'BBs', slug: 'bbs', parent: 'consumables' },
        { id: 'gas', name: 'Gas & CO2', slug: 'gas-co2', parent: 'consumables' }
      ];

      const defaultProducts = [
        {
          id: 'm4-carbine-pro',
          sku: 'SA-E01-PRO',
          name: 'M4 Carbine Pro',
          description: 'High-performance electric assault rifle with full metal body and reinforced gearbox. Features a quick spring change system and precision inner barrel.',
          type: 'weapon',
          category: 'airsoft_weapons',
          subcategory: 'assault_rifles',
          brand: 'Specna Arms',
          model: 'E01',
          price: 350,
          landingCost: 210,
          msrp: 380,
          currency: 'EUR',
          stock: 10,
          minStockLevel: 5,
          image: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=800',
          model3D: '',
          model3DName: '',
          categoryFilters: { brand: 'Specna Arms', velocity_fps: 400, power_source: 'Electric', body_material: 'Full Metal' },
          tags: ['m4', 'rifle', 'electric', 'specna']
        },
        {
          id: 'ak74-tactical',
          sku: 'LCT-AK74-TAC',
          name: 'AK-74 Tactical',
          description: 'Modernized AK platform with rail systems for optics and accessories. Steel construction for ultimate durability.',
          type: 'weapon',
          category: 'airsoft_weapons',
          subcategory: 'assault_rifles',
          brand: 'LCT',
          model: 'AK74',
          price: 420,
          landingCost: 280,
          msrp: 450,
          currency: 'EUR',
          stock: 8,
          minStockLevel: 3,
          image: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=800',
          model3D: '',
          model3DName: '',
          categoryFilters: { brand: 'LCT', velocity_fps: 410, power_source: 'Electric', body_material: 'Steel' },
          tags: ['ak', 'ak74', 'steel', 'lct']
        }
      ];

      const defaultWarehouses = [
        { id: 'wh-main', name: 'Main Warehouse', location: 'Kyiv, Central St 1', type: 'distribution' },
        { id: 'wh-retail', name: 'Retail Store', location: 'Kyiv, Khreshchatyk 22', type: 'retail' }
      ];

      const defaultSuppliers = [
        { id: 'sup-specna', name: 'Specna Arms Europe', contactName: 'Marek Nowak', email: 'sales@specna.pl', phone: '+48 123 456 789', leadTimeDays: 14, brands: ['Specna Arms'] },
        { id: 'sup-lct', name: 'LCT Airsoft Taiwan', contactName: 'Chen Wei', email: 'export@lctairsoft.com', phone: '+886 2 2233 4455', leadTimeDays: 45, brands: ['LCT'] }
      ];

      const defaultStock = [
        { id: 'st-1', productId: 'm4-carbine-pro', warehouseId: 'wh-main', serialNumber: 'SA-2024-001', status: 'available', quantity: 7, reservedQuantity: 1 },
        { id: 'st-2', productId: 'm4-carbine-pro', warehouseId: 'wh-retail', serialNumber: 'SA-2024-002', status: 'available', quantity: 3, reservedQuantity: 0 },
        { id: 'st-3', productId: 'ak74-tactical', warehouseId: 'wh-main', serialNumber: 'LCT-AK-998', status: 'available', quantity: 8, reservedQuantity: 2 }
      ];

      const defaultRates = [
        { code: 'USD', rate: 1.08 },
        { code: 'PLN', rate: 4.32 },
        { code: 'UAH', rate: 42.50 }
      ];

      const defaultBlogPosts = [
        {
          id: 'welcome-to-hristo',
          title: 'Welcome to Hristo Airsoft',
          excerpt: 'Discover the best airsoft gear and community in the region.',
          content: 'We are excited to launch our new online store and ERP system to better serve the airsoft community...',
          author: 'Admin',
          date: new Date().toISOString(),
          image: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=800',
          tags: ['news', 'welcome'],
          published: true
        },
        {
          id: 'm4-vs-ak',
          title: 'M4 vs AK: The Eternal Debate',
          excerpt: 'Which platform is right for you? We break down the pros and cons.',
          content: 'The debate between M4 and AK platforms has been ongoing since the dawn of airsoft...',
          author: 'Expert',
          date: new Date().toISOString(),
          image: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=800',
          tags: ['guide', 'rifles'],
          published: true
        }
      ];

      const defaultMessages = [
        {
          id: 'msg-1',
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Wholesale Inquiry',
          message: 'I am interested in ordering 50 units of the M4 Carbine Pro. Do you offer bulk discounts?',
          timestamp: new Date().toISOString(),
          read: false
        }
      ];

      const total = defaultCategories.length + defaultProducts.length + defaultWarehouses.length + defaultSuppliers.length + defaultStock.length + defaultRates.length + defaultBlogPosts.length + defaultMessages.length;
      let current = 0;

      addLog('Seeding categories...');
      for (const cat of defaultCategories) {
        await databaseService.saveCategory(cat as any);
        current++;
        setProgress(Math.round((current / total) * 100));
        addLog(`Added category: ${cat.name}`);
      }

      addLog('Seeding products...');
      for (const prod of defaultProducts) {
        await databaseService.saveProduct(prod as any);
        current++;
        setProgress(Math.round((current / total) * 100));
        addLog(`Added product: ${prod.name}`);
      }

      addLog('Seeding warehouses...');
      for (const wh of defaultWarehouses) {
        await databaseService.saveWarehouse(wh as any);
        current++;
        setProgress(Math.round((current / total) * 100));
        addLog(`Added warehouse: ${wh.name}`);
      }

      addLog('Seeding suppliers...');
      for (const sup of defaultSuppliers) {
        await databaseService.saveSupplier(sup as any);
        current++;
        setProgress(Math.round((current / total) * 100));
        addLog(`Added supplier: ${sup.name}`);
      }

      addLog('Seeding stock...');
      for (const st of defaultStock) {
        await databaseService.saveStockItem(st as any);
        current++;
        setProgress(Math.round((current / total) * 100));
        addLog(`Added stock item for product ${st.productId}`);
      }

      addLog('Seeding blog posts...');
      for (const post of defaultBlogPosts) {
        await databaseService.saveBlogPost(post as any);
        current++;
        setProgress(Math.round((current / total) * 100));
        addLog(`Added blog post: ${post.title}`);
      }

      addLog('Seeding messages...');
      for (const msg of defaultMessages) {
        await databaseService.saveMessage(msg as any);
        current++;
        setProgress(Math.round((current / total) * 100));
        addLog(`Added message from: ${msg.name}`);
      }

      addLog('Seeding completed successfully!');
      setStatus('success');
      onNotify('Database seeded successfully');
      window.location.reload();
    } catch (err) {
      addLog(`Seeding failed: ${err instanceof Error ? err.message : String(err)}`);
      setStatus('error');
    }
  };

  const seedConfiguratorTestData = async () => {
    setStatus('loading');
    setLogs([]);
    setProgress(0);
    addLog('Starting configurator test data seeding...');

    try {
      const testCategories = [
        { id: 'weapons', name: 'Weapons', slug: 'weapons', parent: null },
        { id: 'modules', name: 'Modules', slug: 'modules', parent: null },
        { id: 'red_dots', name: 'Red Dot Sights', slug: 'red-dots', parent: 'modules', slots: ['optic'] },
        { id: 'scopes', name: 'Scopes', slug: 'scopes', parent: 'modules', slots: ['optic'] },
        { id: 'suppressors', name: 'Suppressors', slug: 'suppressors', parent: 'modules', slots: ['muzzle'] },
        { id: 'magazines', name: 'Magazines', slug: 'magazines', parent: 'modules', slots: ['magazine'] },
        { id: 'stocks', name: 'Stocks', slug: 'stocks', parent: 'modules', slots: ['stock'] },
        { id: 'grips', name: 'Pistol Grips', slug: 'grips', parent: 'modules', slots: ['pistol_grip'] },
        { id: 'lasers', name: 'Lasers', slug: 'lasers', parent: 'modules', slots: ['laser'] }
      ];

      const testProducts = [
        {
          id: 'm4a1-test',
          uid: 'm4a1-test-uid',
          name: 'M4A1 Test Rifle',
          description: 'A test assault rifle for 3D configurator testing. Uses a Box as a placeholder model.',
          type: 'weapon',
          category: 'weapons',
          subcategory: 'assault_rifles',
          brand: 'TestBrand',
          model: 'M4A1',
          price: 500,
          stock: 99,
          has3D: true,
          image: 'https://picsum.photos/seed/m4a1/800/600',
          model3D: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb',
          model3DName: 'Box.glb',
          slots: ['optic', 'muzzle', 'magazine', 'stock', 'pistol_grip'],
          compatibleModuleCategories: ['red_dots', 'scopes', 'suppressors', 'magazines', 'stocks', 'grips'],
          tags: ['test', 'm4a1', 'rifle']
        },
        {
          id: 'glock17-test',
          uid: 'glock17-test-uid',
          name: 'Glock 17 Test Pistol',
          description: 'A test pistol for 3D configurator testing. Uses a Box as a placeholder model.',
          type: 'weapon',
          category: 'weapons',
          subcategory: 'pistols',
          brand: 'TestBrand',
          model: 'Glock 17',
          price: 250,
          stock: 99,
          has3D: true,
          image: 'https://picsum.photos/seed/glock17/800/600',
          model3D: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb',
          model3DName: 'Box.glb',
          slots: ['optic', 'muzzle', 'magazine', 'laser'],
          compatibleModuleCategories: ['red_dots', 'suppressors', 'magazines', 'lasers'],
          tags: ['test', 'glock', 'pistol']
        },
        {
          id: 'eotech-test',
          uid: 'eotech-test-uid',
          name: 'EOTech Holographic Sight',
          description: 'High-precision holographic sight. Uses a Box as a placeholder model.',
          type: 'module',
          category: 'modules',
          subcategory: 'red_dots',
          brand: 'EOTech',
          model: 'EXPS3',
          price: 150,
          stock: 99,
          has3D: true,
          image: 'https://picsum.photos/seed/eotech/800/600',
          model3D: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb',
          model3DName: 'Box.glb',
          allowedSlots: ['optic'],
          tags: ['test', 'optic', 'eotech']
        },
        {
          id: 'acog-test',
          uid: 'acog-test-uid',
          name: 'ACOG 4x Scope',
          description: 'Fixed 4x magnification scope. Uses a Cylinder as a placeholder model.',
          type: 'module',
          category: 'modules',
          subcategory: 'scopes',
          brand: 'Trijicon',
          model: 'ACOG',
          price: 200,
          stock: 99,
          has3D: true,
          image: 'https://picsum.photos/seed/acog/800/600',
          model3D: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Cylinder/glTF-Binary/Cylinder.glb',
          model3DName: 'Cylinder.glb',
          allowedSlots: ['optic'],
          tags: ['test', 'optic', 'acog']
        },
        {
          id: 'suppressor-test',
          uid: 'suppressor-test-uid',
          name: 'Tactical Suppressor',
          description: 'Reduces muzzle flash and sound signature. Uses a Cylinder as a placeholder model.',
          type: 'module',
          category: 'modules',
          subcategory: 'suppressors',
          brand: 'Surefire',
          model: 'SOCOM',
          price: 120,
          stock: 99,
          has3D: true,
          image: 'https://picsum.photos/seed/suppressor/800/600',
          model3D: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Cylinder/glTF-Binary/Cylinder.glb',
          model3DName: 'Cylinder.glb',
          allowedSlots: ['muzzle'],
          tags: ['test', 'muzzle', 'suppressor']
        },
        {
          id: 'pmag-test',
          uid: 'pmag-test-uid',
          name: 'PMAG 30rd Magazine',
          description: 'Polymer high-capacity magazine. Uses a Box as a placeholder model.',
          type: 'module',
          category: 'modules',
          subcategory: 'magazines',
          brand: 'Magpul',
          model: 'PMAG',
          price: 30,
          stock: 99,
          has3D: true,
          image: 'https://picsum.photos/seed/pmag/800/600',
          model3D: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb',
          model3DName: 'Box.glb',
          allowedSlots: ['magazine'],
          tags: ['test', 'magazine', 'pmag']
        },
        {
          id: 'ctr-stock-test',
          uid: 'ctr-stock-test-uid',
          name: 'CTR Stock',
          description: 'Adjustable stock for improved ergonomics. Uses a Box as a placeholder model.',
          type: 'module',
          category: 'modules',
          subcategory: 'stocks',
          brand: 'Magpul',
          model: 'CTR',
          price: 80,
          stock: 99,
          has3D: true,
          image: 'https://picsum.photos/seed/stock/800/600',
          model3D: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb',
          model3DName: 'Box.glb',
          allowedSlots: ['stock'],
          tags: ['test', 'stock', 'ctr']
        },
        {
          id: 'moe-grip-test',
          uid: 'moe-grip-test-uid',
          name: 'MOE Pistol Grip',
          description: 'Ergonomic pistol grip. Uses a Cylinder as a placeholder model.',
          type: 'module',
          category: 'modules',
          subcategory: 'grips',
          brand: 'Magpul',
          model: 'MOE',
          price: 25,
          stock: 99,
          has3D: true,
          image: 'https://picsum.photos/seed/grip/800/600',
          model3D: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Cylinder/glTF-Binary/Cylinder.glb',
          model3DName: 'Cylinder.glb',
          allowedSlots: ['pistol_grip'],
          tags: ['test', 'grip', 'moe']
        }
      ];

      const total = testCategories.length + testProducts.length;
      let current = 0;

      addLog('Seeding test categories...');
      for (const cat of testCategories) {
        await databaseService.saveCategory(cat as any);
        current++;
        setProgress(Math.round((current / total) * 100));
        addLog(`Added test category: ${cat.name}`);
      }

      addLog('Seeding test products...');
      for (const prod of testProducts) {
        await databaseService.saveProduct(prod as any);
        current++;
        setProgress(Math.round((current / total) * 100));
        addLog(`Added test product: ${prod.name}`);
      }

      addLog('Test data seeding completed successfully!');
      setStatus('success');
    } catch (err) {
      addLog(`Test data seeding failed: ${err instanceof Error ? err.message : String(err)}`);
      setStatus('error');
    }
  };

  const runMigration = async () => {
    console.log('Run Migration clicked');
    setStatus('loading');
    setLogs([]);
    setProgress(0);
    addLog('Starting migration process...');

    try {
      // 1. Fetch local data from server
      addLog('Fetching local data from server...');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/migration/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch local data');
      const data = await response.json();
      addLog(`Data fetched successfully: ${Object.keys(data).length} collections found.`);

      const collections = [
        { name: 'categories', data: data.categories },
        { name: 'products', data: data.products },
        { name: 'blog_posts', data: data.blog_posts },
        { name: 'contact_messages', data: data.contact_messages },
        { name: 'policies', data: data.policies },
        { name: 'users', data: data.users }
      ];

      let totalItems = collections.reduce((acc, c) => acc + (c.data?.length || 0), 0);
      let processedItems = 0;

      for (const collection of collections) {
        if (!collection.data || collection.data.length === 0) {
          addLog(`Skipping empty collection: ${collection.name}`);
          continue;
        }

        addLog(`Migrating collection: ${collection.name} (${collection.data.length} items)...`);
        
        for (const item of collection.data) {
          try {
            // Use appropriate service method based on collection
            switch (collection.name) {
              case 'categories':
                await databaseService.saveCategory(item);
                break;
              case 'products':
                await databaseService.saveProduct(item);
                break;
              case 'blog_posts':
                await databaseService.saveBlogPost(item);
                break;
              case 'contact_messages':
                await databaseService.saveMessage(item);
                break;
              case 'policies':
                await databaseService.savePolicy(item);
                break;
              case 'users':
                // For users, we might need a special handling if we want to migrate auth too
                // For now, just save the profile
                await databaseService.saveUserProfile(item.id, item);
                break;
            }
            processedItems++;
            setProgress(Math.round((processedItems / totalItems) * 100));
          } catch (err) {
            addLog(`Error migrating item ${item.id} in ${collection.name}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        addLog(`Finished collection: ${collection.name}`);
      }

      addLog('Migration completed successfully!');
      setStatus('success');
    } catch (err) {
      addLog(`Migration failed: ${err instanceof Error ? err.message : String(err)}`);
      setStatus('error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
          <Database size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900 uppercase tracking-tighter">Data Migration Tool</h3>
          <p className="text-sm text-zinc-500">Move your local JSON data to the Cloud Firestore database.</p>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 mb-8">
        <h4 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <Shield size={16} className="text-zinc-400" />
          Important Information
        </h4>
        <ul className="space-y-3 text-sm text-zinc-600">
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-1.5 shrink-0" />
            This tool will read all data from the local server files and upload them to Firestore.
          </li>
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-1.5 shrink-0" />
            Existing documents with the same IDs in Firestore will be updated.
          </li>
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-1.5 shrink-0" />
            Make sure your Firestore Security Rules allow these operations.
          </li>
        </ul>
      </div>

      {status === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={runMigration}
            className="py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 flex items-center justify-center gap-3"
          >
            <Database size={20} />
            Migrate Local Files
          </button>
          <button 
            onClick={seedDefaultData}
            className="py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-3"
          >
            <Plus size={20} />
            Seed Default Data
          </button>
          <button 
            onClick={seedConfiguratorTestData}
            className="py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3"
          >
            <Crosshair size={20} />
            Seed Configurator Test Data
          </button>
        </div>
      )}

      {status !== 'idle' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-zinc-400">
              <span>Migration Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-zinc-900"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 font-mono text-xs text-zinc-400 h-64 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={log.includes('Error') || log.includes('failed') ? 'text-red-400' : log.includes('successfully') ? 'text-green-400' : ''}>
                {log}
              </div>
            ))}
            {status === 'loading' && (
              <div className="flex items-center gap-2 text-white animate-pulse">
                <div className="w-1 h-1 bg-white rounded-full" />
                Processing...
              </div>
            )}
          </div>

          {status === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 font-bold">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                <Shield size={16} />
              </div>
              Migration completed successfully! You can now use the Cloud database.
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-bold">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                <X size={16} />
              </div>
              Migration failed. Check the logs above for details.
            </div>
          )}

          {status !== 'loading' && (
            <button 
              onClick={() => setStatus('idle')}
              className="w-full py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-all"
            >
              Reset Tool
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};
