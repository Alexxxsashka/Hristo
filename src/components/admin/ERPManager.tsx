import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Plus, 
  RefreshCw, 
  Scan, 
  Barcode, 
  Truck, 
  Edit, 
  FileText, 
  X, 
  Minus,
  Wifi,
  WifiOff,
  CheckCircle
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Product } from '../../types';
import { databaseService } from '../../services/databaseService';
import { formatEnum } from '../../utils/format';



export const ERPManager = ({ products, onNotify, onConfirm, onEditProduct, onUpdate }: { 
  products: Product[],
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void,
  onEditProduct: (product: Product) => void,
  onUpdate?: () => void
}) => {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<'inventory' | 'procurement' | 'financials' | 'logs'>('inventory');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '', type: 'distribution' });
  const [newSupplier, setNewSupplier] = useState({ name: '', contactName: '', email: '', phone: '', leadTimeDays: 7, brands: [] as string[] });

  // Quick Stock Entry State
  const [quickCode, setQuickCode] = useState('');
  const [quickQty, setQuickQty] = useState(1);
  const [quickWarehouse, setQuickWarehouse] = useState('');
  const [quickReason, setQuickReason] = useState('Stock Adjustment');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCreatingWarehouse, setIsCreatingWarehouse] = useState(false);
  const [isScannerConnected, setIsScannerConnected] = useState(true);
  const submissionInProgress = useRef(false);

  const loadERPData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [w, s, po, st, l, r] = await Promise.all([
        databaseService.getWarehouses(),
        databaseService.getSuppliers(),
        databaseService.getPurchaseOrders(),
        databaseService.getStock(),
        databaseService.getInventoryLogs(),
        databaseService.getCurrencyRates()
      ]);
      setWarehouses(w || []);
      setSuppliers(s || []);
      setPurchaseOrders(po || []);
      setStock(st || []);
      setLogs(l || []);
      setRates(r || []);
      
      if (w && w.length > 0 && !quickWarehouse) {
        setQuickWarehouse(w[0].id);
      }
    } catch (err) {
      console.error('Failed to load ERP data', err);
    } finally {
      setIsLoading(false);
    }
  }, [quickWarehouse]);

  const handleSeedStock = async () => {
    setIsSeeding(true);
    try {
      await databaseService.seedStockData();
      onNotify('Stock data seeded successfully for all products');
      loadERPData();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to seed stock data', err);
      onNotify('Failed to seed stock data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.name || isCreatingWarehouse || submissionInProgress.current) return;
    
    submissionInProgress.current = true;
    setIsCreatingWarehouse(true);
    try {
      const id = `wh-${Date.now()}`;
      await databaseService.saveWarehouse({ ...newWarehouse, id });
      onNotify(t('warehouse_added_success') || 'Warehouse added successfully');
      setShowWarehouseModal(false);
      setNewWarehouse({ name: '', location: '', type: 'distribution' });
      await loadERPData();
      if (onUpdate) onUpdate();
    } catch (err) {
      onNotify(t('warehouse_added_error') || 'Failed to add warehouse', 'error');
    } finally {
      setIsCreatingWarehouse(false);
      submissionInProgress.current = false;
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;
    try {
      const id = `sup-${Date.now()}`;
      await databaseService.saveSupplier({ ...newSupplier, id });
      onNotify('Supplier added successfully');
      setShowSupplierModal(false);
      setNewSupplier({ name: '', contactName: '', email: '', phone: '', leadTimeDays: 7, brands: [] });
      loadERPData();
      if (onUpdate) onUpdate();
    } catch (err) {
      onNotify('Failed to add supplier', 'error');
    }
  };

  useEffect(() => {
    loadERPData();
  }, [loadERPData]);

  const handleDeleteWarehouse = (id: string) => {
    onConfirm('Are you sure you want to delete this warehouse?', async () => {
      try {
        await databaseService.deleteWarehouse(id);
        onNotify('Warehouse deleted successfully');
        loadERPData();
        if (onUpdate) onUpdate();
      } catch (err) {
        onNotify('Failed to delete warehouse', 'error');
      }
    });
  };

  const handleDeleteSupplier = (id: string) => {
    onConfirm('Are you sure you want to delete this supplier?', async () => {
      try {
        await databaseService.deleteSupplier(id);
        onNotify('Supplier deleted successfully');
        loadERPData();
        if (onUpdate) onUpdate();
      } catch (err) {
        onNotify('Failed to delete supplier', 'error');
      }
    });
  };

  const handleQuickStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode || !quickWarehouse) {
      onNotify('Please enter a code and select a warehouse', 'error');
      return;
    }

    setIsUpdatingStock(true);
    try {
      await databaseService.updateStockByCode(quickCode, quickQty, quickWarehouse, quickReason);
      onNotify(`Stock updated successfully for ${quickCode}`);
      setQuickCode('');
      setQuickQty(1);
      loadERPData(); // Refresh data
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to update stock', err);
      onNotify(`Failed to update stock: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
        <button 
          onClick={() => setSubTab('inventory')}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            subTab === 'inventory' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-white text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          Inventory & Stock
        </button>
        <button 
          onClick={() => setSubTab('procurement')}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            subTab === 'procurement' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-white text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          Procurement
        </button>
        <button 
          onClick={() => setSubTab('financials')}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            subTab === 'financials' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-white text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          Financials
        </button>
        <button 
          onClick={() => setSubTab('logs')}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            subTab === 'logs' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-white text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          Audit Logs
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'inventory' && (
          <motion.div 
            key="inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2 bg-zinc-900 text-white p-8 rounded-3xl shadow-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
                      <Scan size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tighter">{t('quick_stock_entry')}</h4>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{t('scan_sku_barcode') || 'Scan SKU or Barcode to adjust stock'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-all ${
                      isScannerConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${isScannerConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {isScannerConnected ? t('scanner_connected') : t('scanner_disconnected')}
                      </span>
                    </div>
                    <button 
                      onClick={() => setIsScannerConnected(!isScannerConnected)}
                      className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                    >
                      {isScannerConnected ? t('disconnect') || 'Disconnect' : t('connect_scanner')}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleQuickStockSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SKU / Barcode</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={quickCode}
                        onChange={e => setQuickCode(e.target.value)}
                        className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-lg"
                        placeholder="Scan or type code..."
                        autoFocus
                      />
                      <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quantity (+/-)</label>
                    <input 
                      type="number" 
                      value={quickQty}
                      onChange={e => setQuickQty(Number(e.target.value))}
                      className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="submit"
                      disabled={isUpdatingStock}
                      className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUpdatingStock ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus size={20} />
                          Update
                        </>
                      )}
                    </button>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Warehouse</label>
                    <select 
                      value={quickWarehouse}
                      onChange={e => setQuickWarehouse(e.target.value)}
                      className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reason / Note</label>
                    <input 
                      type="text" 
                      value={quickReason}
                      onChange={e => setQuickReason(e.target.value)}
                      className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Stock Arrival, Correction..."
                    />
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black uppercase tracking-tighter text-lg">Recent Activity</h4>
                  <button onClick={loadERPData} className="p-2 hover:bg-zinc-100 rounded-lg transition-all text-zinc-400">
                    <RefreshCw size={16} />
                  </button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[280px] pr-2 custom-scrollbar">
                  {logs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        log.quantityChange > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {log.quantityChange > 0 ? <Plus size={14} /> : <Minus size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-xs text-zinc-900 truncate">{log.productName || log.productId}</span>
                          <span className={`font-black text-xs ${log.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{log.reason}</span>
                          <span className="text-[10px] text-zinc-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-10">
                      <Package size={32} className="mb-2 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black uppercase tracking-tighter text-lg">Warehouses</h4>
                  <button 
                    onClick={() => setShowWarehouseModal(true)}
                    className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {warehouses.map(w => (
                    <div key={w.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm">{w.name}</div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{w.location}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-zinc-200 rounded text-[10px] font-bold uppercase">{w.type}</div>
                        <button 
                          onClick={() => handleDeleteWarehouse(w.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {warehouses.length === 0 && <div className="text-center py-8 text-zinc-400 text-sm">No warehouses defined</div>}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h4 className="font-black uppercase tracking-tighter text-lg mb-6">Stock Overview</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-sm font-bold text-emerald-900">Total Units in Stock</span>
                    <span className="text-xl font-black text-emerald-900">{stock.reduce((acc, curr) => acc + (curr.quantity || 0), 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <span className="text-sm font-bold text-amber-900">Reserved Units</span>
                    <span className="text-xl font-black text-amber-900">{stock.reduce((acc, curr) => acc + (curr.reservedQuantity || 0), 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h4 className="font-black uppercase tracking-tighter text-lg">{t('stock_inventory')}</h4>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSeedStock}
                    disabled={isSeeding}
                    className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {isSeeding ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    {stock.length === 0 ? t('seed_stock_data') : t('sync_reset_stock')}
                  </button>
                  <button className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">
                    Export CSV
                  </button>
                  <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all">
                    Stock Audit
                  </button>
                </div>
              </div>
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-zinc-700">Product</th>
                    <th className="px-6 py-4 font-semibold text-zinc-700">Barcode</th>
                    <th className="px-6 py-4 font-semibold text-zinc-700">Warehouse</th>
                    <th className="px-6 py-4 font-semibold text-zinc-700">Quantity</th>
                    <th className="px-6 py-4 font-semibold text-zinc-700">Status</th>
                    <th className="px-6 py-4 font-semibold text-zinc-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stock.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    const warehouse = warehouses.find(w => w.id === item.warehouseId);
                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-zinc-900">{product?.name || 'Unknown Product'}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-bold text-zinc-500 uppercase tracking-widest">SKU: {product?.sku || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-mono text-zinc-500">
                            <Barcode size={14} className="text-zinc-400" />
                            {product?.barcode || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          <div className="flex items-center gap-2">
                            <Truck size={14} className="text-zinc-400" />
                            {warehouse?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-zinc-900 flex items-center gap-2">
                            {item.quantity}
                            {item.quantity < (product?.minStockLevel || 0) && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Low Stock" />
                            )}
                          </div>
                          {item.reservedQuantity > 0 && (
                            <div className="text-[10px] text-amber-600 font-bold uppercase">({item.reservedQuantity} reserved)</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {formatEnum(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {product && (
                              <button 
                                onClick={() => onEditProduct(product)}
                                className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
                                title="Edit Product"
                              >
                                <Package size={16} />
                              </button>
                            )}
                            <button className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all">
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {stock.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-medium">
                        No stock items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {subTab === 'procurement' && (
          <motion.div 
            key="procurement"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm md:col-span-1">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black uppercase tracking-tighter text-lg">Suppliers</h4>
                  <button 
                    onClick={() => setShowSupplierModal(true)}
                    className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {suppliers.map(s => (
                    <div key={s.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 group relative">
                      <button 
                        onClick={() => handleDeleteSupplier(s.id)}
                        className="absolute top-2 right-2 p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                      <div className="font-bold text-sm">{s.name}</div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{s.email}</div>
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {s.brands?.map((b: string) => (
                          <span key={b} className="px-1.5 py-0.5 bg-zinc-200 rounded text-[8px] font-bold uppercase">{b}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {suppliers.length === 0 && <div className="text-center py-8 text-zinc-400 text-sm">No suppliers defined</div>}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm md:col-span-2">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h4 className="font-black uppercase tracking-tighter text-lg">Purchase Orders</h4>
                  <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all">
                    New PO
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-zinc-700">PO ID</th>
                      <th className="px-6 py-4 font-semibold text-zinc-700">Supplier</th>
                      <th className="px-6 py-4 font-semibold text-zinc-700">Total</th>
                      <th className="px-6 py-4 font-semibold text-zinc-700">Status</th>
                      <th className="px-6 py-4 font-semibold text-zinc-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {purchaseOrders.map(po => {
                      const supplier = suppliers.find(s => s.id === po.supplierId);
                      return (
                        <tr key={po.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-zinc-500">{po.id}</td>
                          <td className="px-6 py-4 text-sm font-bold text-zinc-900">{supplier?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-sm font-medium text-zinc-600">{po.currency} {po.totalCost}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              po.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 
                              po.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-700'
                            }`}>
                              {formatEnum(po.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all">
                              <FileText size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {purchaseOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-medium">
                          No purchase orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === 'financials' && (
          <motion.div 
            key="financials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h4 className="font-black uppercase tracking-tighter text-lg mb-6">Currency Rates</h4>
                <div className="space-y-3">
                  {rates.map(r => (
                    <div key={r.code} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                      <div className="font-bold text-sm">{r.code} / EUR</div>
                      <div className="font-black text-zinc-900">{r.rate}</div>
                    </div>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 font-bold text-[10px] uppercase tracking-widest hover:border-zinc-900 hover:text-zinc-900 transition-all">
                    Update Rates
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-xl md:col-span-2">
                <h4 className="font-black uppercase tracking-tighter text-lg mb-6">Profitability Analysis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-zinc-800 rounded-2xl border border-zinc-700">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Avg. Margin</div>
                    <div className="text-3xl font-black">32.4%</div>
                  </div>
                  <div className="p-6 bg-zinc-800 rounded-2xl border border-zinc-700">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Stock Value (MSRP)</div>
                    <div className="text-3xl font-black">€142,500</div>
                  </div>
                </div>
                <div className="mt-8 p-6 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-emerald-400">Projected Profit</span>
                    <span className="text-2xl font-black text-emerald-400">€46,200</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[65%]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === 'logs' && (
          <motion.div 
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-zinc-100">
              <h4 className="font-black uppercase tracking-tighter text-lg">Inventory Audit Trail</h4>
            </div>
            <div className="divide-y divide-zinc-100">
              {logs.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      log.changeType === 'in' ? 'bg-emerald-100 text-emerald-600' : 
                      log.changeType === 'out' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {log.changeType === 'in' ? <Plus size={20} /> : <Minus size={20} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900">
                        {formatEnum(log.changeType)}: {products.find(p => p.id === log.productId)?.name || 'Unknown'}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        {new Date(log.timestamp).toLocaleString()} • User: {log.userId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black ${log.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                      New: {log.newQuantity}
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <div className="text-center py-12 text-zinc-400 font-medium">No audit logs found.</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showWarehouseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] overflow-y-auto p-4 md:p-8 flex justify-center items-center">
          <div className="min-h-full flex items-center justify-center py-8 w-full max-w-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full overflow-hidden shadow-2xl my-auto"
            >
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-900 text-white">
              <h3 className="text-xl font-black uppercase tracking-tighter">New Warehouse</h3>
              <button onClick={() => setShowWarehouseModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddWarehouse} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Name</label>
                <input 
                  type="text" 
                  value={newWarehouse.name}
                  onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Main Warehouse" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Location</label>
                <input 
                  type="text" 
                  value={newWarehouse.location}
                  onChange={e => setNewWarehouse({...newWarehouse, location: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Address or City"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Type</label>
                <select 
                  value={newWarehouse.type}
                  onChange={e => setNewWarehouse({...newWarehouse, type: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="distribution">Distribution Center</option>
                  <option value="retail">Retail Store</option>
                  <option value="overflow">Overflow Storage</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isCreatingWarehouse}
                className="w-full py-4 bg-zinc-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreatingWarehouse ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Create Warehouse'}
              </button>
            </form>
            </motion.div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] overflow-y-auto p-4 md:p-8 flex justify-center items-center">
          <div className="min-h-full flex items-center justify-center py-8 w-full max-w-lg">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full overflow-hidden shadow-2xl my-auto"
            >
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-900 text-white">
              <h3 className="text-xl font-black uppercase tracking-tighter">New Supplier</h3>
              <button onClick={() => setShowSupplierModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Company Name</label>
                  <input 
                    type="text" 
                    value={newSupplier.name}
                    onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Contact Person</label>
                  <input 
                    type="text" 
                    value={newSupplier.contactName}
                    onChange={e => setNewSupplier({...newSupplier, contactName: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</label>
                  <input 
                    type="email" 
                    value={newSupplier.email}
                    onChange={e => setNewSupplier({...newSupplier, email: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Phone</label>
                  <input 
                    type="text" 
                    value={newSupplier.phone}
                    onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-zinc-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all">
                Create Supplier
              </button>
            </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};
