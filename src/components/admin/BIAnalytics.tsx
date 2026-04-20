import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { Order } from '../../types';

export const BIAnalytics = ({ orders, users = [] }: { orders: Order[], users?: any[] }) => {
  // Calculate basic metrics
  const totalRevenue = orders.reduce((acc, curr) => {
    const total = typeof curr.total === 'string' ? parseFloat(curr.total) : Number(curr.total);
    return acc + (isNaN(total) ? 0 : total);
  }, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  // Real conversion rate: (orders / total visitors/users)
  // For now we use orders / users as a proxy or just orders relative to user count
  const conversionRate = users.length > 0 ? (orders.length / users.length) * 100 : 0;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;

  // Prepare real chart data (last 7 days)
  const getDailyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dayStart = new Date(d.setHours(0,0,0,0)).getTime();
      const dayEnd = new Date(d.setHours(23,59,59,999)).getTime();

      const dayOrders = orders.filter(o => {
        const date = new Date(o.createdAt).getTime();
        return date >= dayStart && date <= dayEnd;
      });

      const revenue = dayOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
      
      const newUsers = users.filter(u => {
        const date = new Date(u.created_at).getTime();
        return date >= dayStart && date <= dayEnd;
      }).length;

      result.push({
        name: dayName,
        revenue,
        orders: dayOrders.length,
        users: newUsers
      });
    }
    return result;
  };

  const chartData = getDailyData();
  const totalNewUsers = chartData.reduce((acc, curr) => acc + curr.users, 0);

  const categoryData = [
    { name: 'Rifles', value: orders.filter(o => o.items.some(i => i.category?.toLowerCase().includes('rifle'))).length || 5 },
    { name: 'Pistols', value: orders.filter(o => o.items.some(i => i.category?.toLowerCase().includes('pistol'))).length || 3 },
    { name: 'Gear', value: orders.filter(o => o.items.some(i => i.category?.toLowerCase().includes('gear'))).length || 2 },
    { name: 'Other', value: 1 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`€${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend="Real-time" 
          isUp={true} 
          icon={<DollarSign size={20} />} 
          color="emerald"
        />
        <StatCard 
          title="Total Users" 
          value={users.length.toString()} 
          trend={`+${totalNewUsers} this week`} 
          isUp={true} 
          icon={<Users size={20} />} 
          color="blue"
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`€${avgOrderValue.toFixed(2)}`} 
          trend="Based on all orders" 
          isUp={totalRevenue > 0} 
          icon={<Activity size={20} />} 
          color="amber"
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${conversionRate.toFixed(1)}%`} 
          trend="Orders / Users" 
          isUp={true} 
          icon={<TrendingUp size={20} />} 
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-black uppercase tracking-tighter">Revenue Overview</h4>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">Weekly performance tracking</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Weekly</button>
              <button className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Monthly</button>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: '700'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
          <h4 className="text-xl font-black uppercase tracking-tighter mb-8">Sales by Category</h4>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black">{orders.reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + i.quantity, 0), 0).toLocaleString()}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Units Sold</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-xs font-bold text-zinc-600">{item.name}</span>
                </div>
                <span className="text-xs font-black text-zinc-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity / Orders Status */}
        <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
          <h4 className="text-xl font-black uppercase tracking-tighter mb-8">Order Status Distribution</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatusBox 
              title="Pending" 
              count={pendingOrders} 
              icon={<Clock className="text-amber-500" />} 
              bgColor="bg-amber-50" 
              borderColor="border-amber-100"
            />
            <StatusBox 
              title="Completed" 
              count={completedOrders} 
              icon={<CheckCircle className="text-emerald-500" />} 
              bgColor="bg-emerald-50" 
              borderColor="border-emerald-100"
            />
            <StatusBox 
              title="Processing" 
              count={orders.filter(o => o.status === 'processing').length} 
              icon={<Activity className="text-blue-500" />} 
              bgColor="bg-blue-50" 
              borderColor="border-blue-100"
            />
            <StatusBox 
              title="Cancelled" 
              count={orders.filter(o => o.status === 'cancelled').length} 
              icon={<AlertCircle className="text-red-500" />} 
              bgColor="bg-red-50" 
              borderColor="border-red-100"
            />
          </div>
        </div>

        {/* Customer Growth Real Data */}
        <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-black uppercase tracking-tighter">Customer Growth</h4>
            <div className="flex items-center gap-2 text-emerald-500">
              <Users size={16} />
              <span className="text-xs font-black">+{totalNewUsers} New This Week</span>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, isUp, icon, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-[32px] border border-zinc-200 shadow-sm relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500 ${
      color === 'emerald' ? 'bg-emerald-500' : 
      color === 'blue' ? 'bg-blue-500' : 
      color === 'amber' ? 'bg-amber-500' : 'bg-violet-500'
    }`} />
    
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
        color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
        color === 'blue' ? 'bg-blue-50 text-blue-600' : 
        color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'
      }`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
        {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trend}
      </div>
    </div>
    
    <div className="space-y-1">
      <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{title}</h5>
      <div className="text-2xl font-black text-zinc-900">{value}</div>
    </div>
  </motion.div>
);

const StatusBox = ({ title, count, icon, bgColor, borderColor }: any) => (
  <div className={`p-6 rounded-2xl border ${bgColor} ${borderColor} flex items-center justify-between`}>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{title}</h5>
        <div className="text-xl font-black text-zinc-900">{count}</div>
      </div>
    </div>
    <ChevronRight size={16} className="text-zinc-300" />
  </div>
);

const ChevronRight = ({ size, className }: any) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
