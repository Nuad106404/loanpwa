import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  FileText, 
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getDashboardStats } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';


// Define types for dashboard data
interface Metric {
  title: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
  trend: 'up' | 'down';
}

interface ChartDataPoint {
  name: string;
  value: number;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  status: string;
  amount: number | string;
  time: string;
}

const DashboardPage: React.FC = () => {
  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      title: 'ผู้ใช้ทั้งหมด',
      value: '0',
      change: '0%',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'สินเชื่อที่ใช้งาน',
      value: '0',
      change: '0%',
      icon: FileText,
      trend: 'up'
    },
    {
      title: 'จำนวนเงินที่เบิกจ่าย',
      value: '$0',
      change: '0%',
      icon: DollarSign,
      trend: 'up'
    },
    {
      title: 'ใบสมัครที่รอดำเนินการ',
      value: '0',
      change: '0%',
      icon: AlertCircle,
      trend: 'up'
    }
  ]);

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [disbursementData, setDisbursementData] = useState<ChartDataPoint[]>([]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'เมื่อสักครู่';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} นาทีที่แล้ว`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ชั่วโมงที่แล้ว`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await getDashboardStats();
        const data = response as { 
          metrics: Metric[], 
          recentActivity: Activity[], 
          chartData: ChartDataPoint[],
          disbursementData: ChartDataPoint[]
        };
        
        // Update metrics while preserving the icon components
        setMetrics(prevMetrics => {
          return data.metrics.map((metric: any, index: number) => {
            // Find the corresponding metric in our initial state to get the icon
            const initialMetric = prevMetrics.find(m => m.title === metric.title) || prevMetrics[index];
            
            return {
              ...metric,
              // Preserve the icon from our initial state
              icon: initialMetric.icon,
              value: typeof metric.value === 'number' && metric.title === 'Total Disbursed' 
                ? formatCurrency(metric.value as number) 
                : metric.value.toString()
            };
          });
        });
        
        // Update recent activity
        setRecentActivity(data.recentActivity.map((activity: Activity) => ({
          ...activity,
          amount: typeof activity.amount === 'number' ? formatCurrency(activity.amount) : activity.amount,
          time: formatRelativeTime(activity.time)
        })));
        
        // Update chart data
        setChartData(data.chartData);
        setDisbursementData(data.disbursementData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">แดชบอร์ด</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-blue-50 rounded-lg">
                <metric.icon className="h-6 w-6 text-blue-600" />
              </div>
              <span className={`text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change}
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-gray-900">{metric.value}</h3>
            <p className="text-gray-600">{metric.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">แนวโน้มใบสมัครสินเชื่อ</h2>
          <div className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading chart data...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#93c5fd" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">การเบิกจ่ายรายเดือน</h2>
          <div className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading chart data...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={disbursementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>



      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold">กิจกรรมล่าสุด</h2>
          <div className="mt-4 divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {activity.status === 'รอการอนุมัติ' && <Clock className="h-5 w-5 text-yellow-500" />}
                    {activity.status === 'อนุมัติ' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {activity.status === 'ไม่อนุมัติ' && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-500">{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{activity.amount}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;