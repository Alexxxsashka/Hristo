import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ChevronRight, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye, 
  FileText, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  CreditCard, 
  Wallet,
  X 
} from 'lucide-react';
import { Order } from '../../types';
import { databaseService } from '../../services/databaseService';
import { formatEnum } from '../../utils/format';
import { generateOrdersReport, generateSingleOrderInvoice, exportOrdersToCSV } from '../../utils/reportGenerator';
import { ReportModal } from './ReportModal';



export const OrderManager = ({ orders, onNotify, onConfirm, onUpdate, externalFilter, externalSearch }: { 
  orders: Order[],
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void,
  onUpdate: () => void,
  externalFilter?: string,
  externalSearch?: string
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const filteredOrders = orders.filter(order => {
    // Equivalent to BindingSource.Filter
    const activeStatus = externalFilter && externalFilter !== 'all' ? externalFilter : statusFilter;
    const matchesStatus = activeStatus === 'all' || order.status === activeStatus;

    // Equivalent to BindingSource.Find: search by indexed order ID
    if (externalSearch) {
       return order.id.toLowerCase() === externalSearch.toLowerCase() ||
              order.id.toLowerCase().includes(externalSearch.toLowerCase());
    }

    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping?.email?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      order.shipping?.fullName?.toLowerCase()?.includes(searchQuery.toLowerCase());
      
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    onConfirm(`Are you sure you want to update the status of order #${orderId} to ${newStatus}?`, async () => {
      try {
        await databaseService.updateOrderStatus(orderId, newStatus, undefined, 'Admin');
        onNotify(`Order status updated to ${newStatus}`);
        onUpdate(); // Refresh the main orders list automatically
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } catch (err) {
        onNotify('Failed to update order status', 'error');
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'awaiting_payment': return 'bg-zinc-100 text-zinc-500 border-zinc-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'processing': return <Package size={14} />;
      case 'shipped': return <Truck size={14} />;
      case 'delivered': return <CheckCircle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search orders, email, or customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-12 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 appearance-none font-bold text-xs uppercase tracking-widest"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-zinc-900/20"
          >
            <FileText size={16} />
            Generate Report (PDF)
          </button>
          <button 
            onClick={() => exportOrdersToCSV(filteredOrders)}
            className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-500">Order ID</th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-500">Customer</th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-500">Date</th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-500">Total</th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-500">Status</th>
              <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold text-zinc-400">#{order.id.slice(-8).toUpperCase()}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-zinc-900">{order.shipping?.fullName || 'N/A'}</div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{order.shipping?.email || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-zinc-600">{new Date(order.createdAt).toLocaleDateString()}</div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-black text-zinc-900">€{order.total.toFixed(2)}</div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{order.items.length} items</div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {formatEnum(order.status)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => generateSingleOrderInvoice(order)}
                      className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all" 
                      title="Print Local Invoice"
                    >
                      <FileText size={18} />
                    </button>
                    {order.payment?.method === 'stripe' && order.payment?.transactionId && (
                      <button 
                        onClick={() => window.open(`https://dashboard.stripe.com/payments/${order.payment.transactionId}`, '_blank')}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" 
                        title="View Stripe Payment"
                      >
                        <CreditCard size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(order.id);
                        onNotify('Order ID copied to clipboard');
                      }}
                      className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all"
                      title="Copy Order ID"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <ShoppingBag size={48} className="mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-xs">No orders found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-900 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Order Details</h3>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">#{selectedOrder.id.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-3 hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Items Section */}
                    <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
                      <h4 className="font-black uppercase tracking-widest text-xs text-zinc-400 mb-6 flex items-center gap-2">
                        <Package size={16} />
                        Order Items ({selectedOrder.items.length})
                      </h4>
                      <div className="space-y-4">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                            <div className="w-20 h-20 bg-zinc-100 rounded-xl overflow-hidden shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                  <Package size={24} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-black text-zinc-900 truncate">{item.name}</h5>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Qty: {item.quantity}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">SKU: {item.sku || 'N/A'}</span>
                              </div>
                              {item.configuration && typeof item.configuration === 'object' && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {Object.entries(item.configuration).map(([key, val]) => (
                                    <span key={key} className="px-2 py-0.5 bg-zinc-100 rounded text-[8px] font-bold uppercase text-zinc-500">
                                      {key}: {String(val)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-black text-zinc-900">€{(item.price * item.quantity).toFixed(2)}</div>
                              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">€{item.price.toFixed(2)} ea</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Timeline / Status Update */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200">
                      <h4 className="font-black uppercase tracking-widest text-xs text-zinc-400 mb-6 flex items-center gap-2">
                        <Clock size={16} />
                        Order Status Management
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(selectedOrder.id, status as Order['status'])}
                            className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                              selectedOrder.status === status 
                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg' 
                                : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200'
                            }`}
                          >
                            {formatEnum(status)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm">
                      <h4 className="font-black uppercase tracking-widest text-xs text-zinc-400 mb-6 flex items-center gap-2">
                        <User size={16} />
                        Customer Information
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-500">
                            <User size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-sm">{selectedOrder.shipping?.fullName || 'Guest'}</div>
                            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Customer ID: {selectedOrder.userId || 'Guest'}</div>
                          </div>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-zinc-50">
                          <div className="flex items-center gap-3 text-zinc-600">
                            <Mail size={16} className="text-zinc-400" />
                            <span className="text-xs font-medium">{selectedOrder.shipping?.email || 'No email provided'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-zinc-600">
                            <Phone size={16} className="text-zinc-400" />
                            <span className="text-xs font-medium">{selectedOrder.shipping?.phone || 'No phone provided'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm">
                      <h4 className="font-black uppercase tracking-widest text-xs text-zinc-400 mb-6 flex items-center gap-2">
                        <MapPin size={16} />
                        Shipping Address
                      </h4>
                      {selectedOrder.shipping ? (
                        <div className="text-sm text-zinc-600 space-y-1">
                          <p className="font-bold text-zinc-900">{selectedOrder.shipping.fullName}</p>
                          <p>{selectedOrder.shipping.address}</p>
                          <p>{selectedOrder.shipping.city}, {selectedOrder.shipping.postalCode}</p>
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-400 italic">No shipping information available</div>
                      )}
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-xl">
                      <h4 className="font-black uppercase tracking-widest text-[10px] text-zinc-500 mb-6 flex items-center gap-2">
                        <CreditCard size={16} />
                        Payment Summary
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          <span>Subtotal</span>
                          <span className="text-white">€{(selectedOrder.total - (selectedOrder.shippingCost || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          <span>Shipping</span>
                          <span className="text-white">€{(selectedOrder.shippingCost || 0).toFixed(2)}</span>
                        </div>
                        <div className="pt-4 border-t border-zinc-800 flex justify-between items-end">
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Total Amount</span>
                          <span className="text-3xl font-black text-emerald-400">€{selectedOrder.total.toFixed(2)}</span>
                        </div>
                        <div className="mt-6 flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-xl border border-zinc-700">
                          {selectedOrder.payment?.method === 'stripe' ? <CreditCard size={14} className="text-emerald-500" /> : <Wallet size={14} className="text-amber-500" />}
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {selectedOrder.payment?.status === 'paid' ? 'Verified Payment' : 'Payment Outstanding'}
                            {' via ' + (selectedOrder.payment?.method === 'cod' ? 'Cash on Delivery' : (selectedOrder.payment?.method?.toUpperCase() || 'UNKNOWN'))}
                          </span>
                          <div className={`ml-auto w-2 h-2 rounded-full ${selectedOrder.payment?.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500 pulse'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Ordered on {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => generateSingleOrderInvoice(selectedOrder)}
                    className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all"
                  >
                    Download Invoice
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                    disabled={selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered'}
                    className="px-8 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-50"
                  >
                    Mark as Shipped
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Sales & Revenue Report"
        onGenerate={(start, end) => {
          const filteredByDate = orders.filter(o => {
            const date = new Date(o.createdAt);
            return date >= start && date <= end;
          });
          generateOrdersReport(filteredByDate, { 
            status: statusFilter, 
            search: searchQuery,
            dateRange: { start, end }
          });
          onNotify(`Report generated for ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
        }}
      />
    </div>
  );
};
