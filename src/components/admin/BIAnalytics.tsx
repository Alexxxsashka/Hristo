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
  const [timeRange, setTimeRange] = React.useState<'weekly' | 'monthly'>('weekly');

  // Calculate basic metrics
  const { totalRevenue, avgOrderValue, conversionRate, pendingOrders, completedOrders } = React.useMemo(() => {
    const revenue = orders.reduce((acc, curr) => {
      const total = typeof curr.total === 'string' ? parseFloat(curr.total) : Number(curr.total);
      return acc + (isNaN(total) ? 0 : total);
    }, 0);
    
    return {
      totalRevenue: revenue,
      avgOrderValue: orders.length > 0 ? revenue / orders.length : 0,
      conversionRate: users.length > 0 ? (orders.length / users.length) * 100 : 0,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'delivered').length
    };
  }, [orders, users]);

  // Prepare real chart data
  const chartData = React.useMemo(() => {
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

    const getMonthlyData = () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const result = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = months[d.getMonth()];
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

        const monthOrders = orders.filter(o => {
          const date = new Date(o.createdAt).getTime();
          return date >= monthStart && date <= monthEnd;
        });

        const revenue = monthOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        
        const newUsers = users.filter(u => {
          const date = new Date(u.created_at).getTime();
          return date >= monthStart && date <= monthEnd;
        }).length;

        result.push({
          name: monthName,
          revenue,
          orders: monthOrders.length,
          users: newUsers
        });
      }
      return result;
    };

    return timeRange === 'weekly' ? getDailyData() : getMonthlyData();
  }, [orders, users, timeRange]);

  const totalNewUsersInPeriod = React.useMemo(() => 
    chartData.reduce((acc, curr) => acc + curr.users, 0)
  , [chartData]);

  // Calculate category distribution
  const categoryData = React.useMemo(() => {
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
    const counts = orders.reduce((acc, order) => {
      order.items?.forEach(item => {
        const cat = (item.category || '').toLowerCase();
        const name = (item.name || '').toLowerCase();
        const qty = Number(item.quantity) || 0;
        
        const isRifle = cat.includes('rifle') || cat.includes('pušk') || cat.includes('aeg') || cat.includes('sniper') || name.includes('rifle') || name.includes('puška');
        const isPistol = cat.includes('pistol') || cat.includes('pištolj') || name.includes('pistol') || name.includes('pištolj');
        const isGear = cat.includes('gear') || cat.includes('oprema') || cat.includes('accessory') || cat.includes('optic') || cat.includes('mag') || cat.includes('part') || cat.includes('protection') || cat.includes('uniform') || cat.includes('ammo') || cat.includes('gas') || cat.includes('battery') || name.includes('gear') || name.includes('oprema');

        if (isRifle) acc.rifles += qty;
        else if (isPistol) acc.pistols += qty;
        else if (isGear) acc.gear += qty;
        else acc.other += qty;
      });
      return acc;
    }, { rifles: 0, pistols: 0, gear: 0, other: 0 });

    return [
      { name: 'Rifles', value: counts.rifles, color: COLORS[0] },
      { name: 'Pistols', value: counts.pistols, color: COLORS[1] },
      { name: 'Gear', value: counts.gear, color: COLORS[2] },
      { name: 'Other', value: counts.other, color: COLORS[3] },
    ].filter(item => item.value > 0);
  }, [orders]);

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
          trend={`+${totalNewUsersInPeriod} this ${timeRange === 'weekly' ? 'week' : '6 months'}`} 
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
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">
                {timeRange === 'weekly' ? 'Weekly' : 'Monthly'} performance tracking
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setTimeRange('weekly')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeRange === 'weekly' 
                    ? 'bg-zinc-900 text-white shadow-lg' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setTimeRange('monthly')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeRange === 'monthly' 
                    ? 'bg-zinc-900 text-white shadow-lg' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height={350} minHeight={350}>
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
            <ResponsiveContainer width="100%" height={300} minHeight={300}>
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black">{orders.reduce((acc, o) => acc + (o.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0), 0).toLocaleString()}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Units Sold</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-zinc-600">{item.name}</span>
                </div>
                <span className="text-xs font-black text-zinc-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer Growth Real Data */}
        <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-black uppercase tracking-tighter">Customer Growth</h4>
            <div className="flex items-center gap-2 text-emerald-500">
              <Users size={16} />
              <span className="text-xs font-black">+{totalNewUsersInPeriod} New This {timeRange === 'weekly' ? 'Week' : 'Period'}</span>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
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
