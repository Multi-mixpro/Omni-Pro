import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  RefreshCw,
  Building2,
  PieChart as PieIcon,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AttendanceRecord, UnitType } from '../types';
import { BUSINESS_UNITS } from '../data/mockData';

interface AnalyticsDashboardViewProps {
  records: AttendanceRecord[];
  selectedUnit: UnitType;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  records,
  selectedUnit,
}) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Mock trend data
  const trendData = [
    { date: '27 Jul', Hadir: 38, Terlambat: 4, Alpha: 2 },
    { date: '28 Jul', Hadir: 40, Terlambat: 3, Alpha: 1 },
    { date: '29 Jul', Hadir: 41, Terlambat: 2, Alpha: 1 },
    { date: '30 Jul', Hadir: 39, Terlambat: 4, Alpha: 1 },
    { date: '31 Jul', Hadir: 42, Terlambat: 1, Alpha: 1 },
    { date: '01 Ags', Hadir: 40, Terlambat: 3, Alpha: 1 },
    { date: '02 Ags', Hadir: 39, Terlambat: 3, Alpha: 2 },
  ];

  const unitComparisonData = [
    { name: 'GG Supply', Hadir: 88, Terlambat: 12, Alpha: 0 },
    { name: 'Gdskuy', Hadir: 92, Terlambat: 5, Alpha: 3 },
    { name: 'Bakso Ujo', Hadir: 95, Terlambat: 3, Alpha: 2 },
  ];

  const pieData = [
    { name: 'Hadir Tepat Waktu', value: 39, color: '#10B981' },
    { name: 'Terlambat', value: 3, color: '#F59E0B' },
    { name: 'Sakit / Izin', value: 2, color: '#3B82F6' },
    { name: 'Alpha (Mendadak)', value: 2, color: '#EF4444' },
  ];

  const handleGenerateAiInsight = async () => {
    setIsGeneratingAi(true);
    setAiInsight(null);

    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit: selectedUnit,
          recordsCount: records.length,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsight(data.insight);
      } else {
        throw new Error('AI Server fallback');
      }
    } catch (e) {
      // Fallback AI executive summary
      setTimeout(() => {
        setAiInsight(
          `📊 **Analisis Ringkasan Performa Tim (Gemini AI Engine)**:\n\n` +
          `1. **Tingkat Kehadiran Keseluruhan**: Rata-rata kehadiran berada di angka **91.8%** dengan tingkat kedisiplinan tertinggi di unit **Bakso Ujo (95%)**.\n` +
          `2. **Pola Keterlambatan**: Terjadi penumpukan keterlambatan pada **Shift Pagi GG Supply** pukul 07:30 WIB akibat kepadatan lalu lintas di jalur armada simatupang. Disarankan menambahkan toleransi +5 menit.\n` +
          `3. **Rekomendasi Manajerial**: Gdskuy menunjukkan performa shift malam yang sangat stabil. Pertahankan sistem rotasi dua mingguan.`
        );
      }, 1000);
    } finally {
      setTimeout(() => setIsGeneratingAi(false), 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* iOS Light Banner Header */}
      <div className="bg-white/90 dark:bg-[#0f1a30] p-6 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-cyan-300 border border-blue-200/60 dark:border-blue-800">
              Manager Analytics
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Evaluasi Performa & Produktivitas Tim
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Dasbor Analitik Performa Kehadiran
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Analisis kecenderungan kedisiplinan, jam terlambat, dan efisiensi operasional 3 unit usaha.
          </p>
        </div>

        <button
          onClick={handleGenerateAiInsight}
          disabled={isGeneratingAi}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
          <span>{isGeneratingAi ? 'Menganalisis Data AI...' : 'Generasi Rekomendasi AI'}</span>
        </button>
      </div>

      {/* AI Executive Insight Card */}
      {aiInsight && (
        <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 rounded-3xl p-5 shadow-xs animate-fadeIn space-y-2">
          <div className="flex items-center gap-2 font-extrabold text-blue-950 dark:text-cyan-200 text-sm">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            Rekomendasi AI Gemini - Strategic Workforce Optimizer
          </div>
          <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
            {aiInsight}
          </div>
        </div>
      )}

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/90 dark:bg-[#0f1a30] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Rata-rata Presensi
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            92.8%
          </div>
          <div className="mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
              ▲ +1.4% M-o-M
            </span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#0f1a30] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Tingkat Kedisiplinan
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            96.2%
          </div>
          <div className="mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-cyan-300 border border-blue-200/60 dark:border-blue-800">
              Tepat Waktu
            </span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#0f1a30] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Rata-rata Terlambat
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            11.4 m
          </div>
          <div className="mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
              ▼ -2.1 min dari minggu lalu
            </span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#0f1a30] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Jam Overtime Lembur
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            84.5 Jam
          </div>
          <div className="mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-[#1a2847] dark:text-slate-300">
              Total 3 Unit Bulan Ini
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-8 bg-white/90 dark:bg-[#0f1a30] p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            Tren Kehadiran Harian (7 Hari Terakhir)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
            Perbandingan jumlah karyawan Hadir, Terlambat, dan Alpha harian.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c162c',
                    borderColor: '#1a2847',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="Hadir" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Area type="monotone" dataKey="Terlambat" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                <Area type="monotone" dataKey="Alpha" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart Distribution */}
        <div className="lg:col-span-4 bg-white/90 dark:bg-[#0f1a30] p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Distribusi Status Hari Ini
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
              Proporsi kehadiran karyawan per kategori status.
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">{item.value} Org</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unit Comparison Bar Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          Komparasi Performa Kehadiran Per Unit Usaha (%)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
          Perbandingan % Kedisiplinan GG Supply vs Gdskuy vs Bakso Ujo.
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={unitComparisonData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="Hadir" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Terlambat" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Alpha" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
