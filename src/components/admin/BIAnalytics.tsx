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
    <div className="space-y-8 pb-12">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between bg-[var(--bg-secondary)] p-4 rounded-[28px] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center gap-4 ml-2">
          <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-color)]">
            <Activity size={20} />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tighter text-[var(--text-primary)]">Intelligence Core</h2>
        </div>
        <div className="flex p-1 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
          {(['weekly', 'monthly'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                timeRange === r 
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-lg border border-[var(--border-color)]' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Gross Revenue" 
          value={`€${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend="Real-time" 
          isUp={true} 
          icon={<DollarSign size={20} />} 
          color="emerald"
        />
        <StatCard 
          title="Active Users" 
          value={users.length.toString()} 
          trend={`+${totalNewUsersInPeriod} this period`} 
          isUp={true} 
          icon={<Users size={20} />} 
          color="blue"
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`€${avgOrderValue.toFixed(2)}`} 
          trend="Per Transaction" 
          isUp={true} 
          icon={<ShoppingBag size={20} />} 
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
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] rounded-[32px] border border-[var(--border-color)] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Revenue Stream</h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-60">Visualizing fiscal performance</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Live Feed
              </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ab1017" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ab1017" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ab1017" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-[var(--bg-secondary)] rounded-[32px] border border-[var(--border-color)] p-8 shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)] mb-8">Inventory Mix</h3>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-[var(--text-primary)]">
                {orders.reduce((acc, o) => acc + (o.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0), 0)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Total Units</span>
            </div>
          </div>
          <div className="space-y-4 mt-8">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest opacity-60">{item.name}</span>
                </div>
                <span className="text-sm font-black text-[var(--text-primary)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Customer Growth */}
        <div className="bg-[var(--bg-secondary)] rounded-[32px] border border-[var(--border-color)] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">User Velocity</h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-60">Acquisition rate tracking</p>
            </div>
            <div className="flex items-center gap-2 text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <Users size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">+{totalNewUsersInPeriod} New</span>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-tertiary)', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="bg-[var(--bg-secondary)] rounded-[32px] border border-[var(--border-color)] p-8 shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)] mb-8">Operational Flow</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatusBox 
              title="Pending" 
              count={pendingOrders} 
              icon={<Clock size={20} className="text-amber-500" />} 
              color="amber"
            />
            <StatusBox 
              title="Completed" 
              count={completedOrders} 
              icon={<CheckCircle size={20} className="text-emerald-500" />} 
              color="emerald"
            />
            <div className="col-span-2 p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-color)]">
                  <Activity size={20} />
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Success Rate</h5>
                  <div className="text-xl font-black text-[var(--text-primary)]">{((completedOrders / (orders.length || 1)) * 100).toFixed(1)}%</div>
                </div>
              </div>
              <TrendingUp size={20} className="text-emerald-500 opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, isUp, icon, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-[var(--bg-secondary)] p-8 rounded-[32px] border border-[var(--border-color)] shadow-sm relative overflow-hidden group transition-all"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 ${
      color === 'emerald' ? 'bg-emerald-500' : 
      color === 'blue' ? 'bg-blue-500' : 
      color === 'amber' ? 'bg-amber-500' : 'bg-violet-500'
    }`} />
    
    <div className="flex items-center justify-between mb-6">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--bg-tertiary)] border border-[var(--border-color)] ${
        color === 'emerald' ? 'text-emerald-500' : 
        color === 'blue' ? 'text-blue-500' : 
        color === 'amber' ? 'text-amber-500' : 'text-violet-500'
      }`}>
        {icon}
      </div>
      <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
        isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
      }`}>
        {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trend}
      </div>
    </div>
    
    <div className="space-y-1">
      <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">{title}</h5>
      <div className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">{value}</div>
    </div>
  </motion.div>
);

const StatusBox = ({ title, count, icon, color }: any) => (
  <div className="p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between group hover:border-[var(--text-primary)] transition-all">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center shadow-sm border border-[var(--border-color)]">
        {icon}
      </div>
      <div>
        <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">{title}</h5>
        <div className="text-xl font-black text-[var(--text-primary)]">{count}</div>
      </div>
    </div>
  </div>
);
