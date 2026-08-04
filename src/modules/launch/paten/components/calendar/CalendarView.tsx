/**
 * Product Launch OS 3.0 - High-Density Implementation Calendar & Milestone View
 * Compact layout with Month Grid, Side-Inspector Detail Panel, Gantt Timeline, Agenda, and Quick Reschedule controls.
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Edit3,
  BarChart2,
  List,
  X,
  Info,
  CalendarCheck2,
} from 'lucide-react';
import { Article, BusinessUnit, TaskItem, ScheduleHealth } from '../../types';
import { isAllBusinessUnits, loadStoredBusinessUnits } from '../../services/businessUnits';

interface CalendarViewProps {
  articles: Article[];
  tasks?: TaskItem[];
  activeBusinessUnit: BusinessUnit | 'Semua';
  onSelectArticle: (articleId: string, initialTab?: string) => void;
  onUpdateArticle: (article: Article) => void;
}

export type CalendarViewMode = 'month' | 'gantt' | 'agenda';

export interface CalendarEvent {
  id: string;
  articleId: string;
  articleCode: string;
  articleName: string;
  stage: string;
  businessUnit: BusinessUnit;
  type: 'sample_target' | 'sample_actual' | 'release_target' | 'release_actual' | 'batch_prod' | 'task';
  typeLabel: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  health?: ScheduleHealth;
  ownerName: string;
  status: string;
  colorClass: string;
  badgeBg: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  articles,
  tasks = [],
  activeBusinessUnit,
  onSelectArticle,
  onUpdateArticle,
}) => {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 1)); // August 2026
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('Semua');
  const [selectedHealth, setSelectedHealth] = useState<string>('Semua');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>(activeBusinessUnit);

  // Selected date for Side Inspector Panel
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return '2026-08-15'; // Default to date with active milestones
  });

  // Event modal for quick view

  // Quick Date Edit Modal
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [newTargetSampleDate, setNewTargetSampleDate] = useState('');
  const [newTargetReleaseDate, setNewTargetReleaseDate] = useState('');

  // Extract month & year
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNamesID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setCurrentDate(new Date());
    setSelectedDateStr(todayStr);
  };

  // Compile all Calendar Events from Articles and Tasks
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    articles.forEach((art) => {
      if (!isAllBusinessUnits(selectedUnitFilter) && art.businessUnit !== selectedUnitFilter) {
        return;
      }

      // Target Sample Date
      if (art.targetSampleDate) {
        events.push({
          id: `sample-target-${art.id}`,
          articleId: art.id,
          articleCode: art.code,
          articleName: art.name,
          stage: art.stage,
          businessUnit: art.businessUnit,
          type: 'sample_target',
          typeLabel: 'Target Sampling',
          title: `Target Sample ${art.code}`,
          date: art.targetSampleDate,
          health: art.scheduleHealth,
          ownerName: art.ownerName,
          status: art.status,
          colorClass: 'text-indigo-800 bg-indigo-50 border-indigo-200',
          badgeBg: 'bg-indigo-600',
        });
      }

      // Actual Sample Date
      if (art.actualSampleDate) {
        events.push({
          id: `sample-actual-${art.id}`,
          articleId: art.id,
          articleCode: art.code,
          articleName: art.name,
          stage: art.stage,
          businessUnit: art.businessUnit,
          type: 'sample_actual',
          typeLabel: 'Sample Selesai',
          title: `Sample Selesai ${art.code}`,
          date: art.actualSampleDate,
          health: 'On Track',
          ownerName: art.ownerName,
          status: art.status,
          colorClass: 'text-blue-800 bg-blue-50 border-blue-200',
          badgeBg: 'bg-blue-600',
        });
      }

      // Target Release Date
      if (art.targetReleaseDate) {
        events.push({
          id: `release-target-${art.id}`,
          articleId: art.id,
          articleCode: art.code,
          articleName: art.name,
          stage: art.stage,
          businessUnit: art.businessUnit,
          type: 'release_target',
          typeLabel: 'Target Launch',
          title: `Target Launch ${art.code}`,
          date: art.targetReleaseDate,
          health: art.scheduleHealth,
          ownerName: art.ownerName,
          status: art.status,
          colorClass: 'text-teal-900 bg-teal-50 border-teal-300',
          badgeBg: 'bg-[#087E79]',
        });
      }

      // Production Batches
      if (art.batches && art.batches.length > 0) {
        art.batches.forEach((b) => {
          events.push({
            id: `batch-start-${art.id}-${b.id}`,
            articleId: art.id,
            articleCode: art.code,
            articleName: art.name,
            stage: art.stage,
            businessUnit: art.businessUnit,
            type: 'batch_prod',
            typeLabel: 'Mulai Batch Prod',
            title: `Mulai ${b.batchCode} (${art.code})`,
            date: b.startDate,
            endDate: b.targetFinishDate,
            health: art.scheduleHealth,
            ownerName: art.ownerName,
            status: b.currentOperation,
            colorClass: 'text-amber-900 bg-amber-50 border-amber-300',
            badgeBg: 'bg-amber-600',
          });

          if (b.targetFinishDate) {
            events.push({
              id: `batch-finish-${art.id}-${b.id}`,
              articleId: art.id,
              articleCode: art.code,
              articleName: art.name,
              stage: art.stage,
              businessUnit: art.businessUnit,
              type: 'batch_prod',
              typeLabel: 'Target Finish Batch',
              title: `Finish ${b.batchCode} (${art.code})`,
              date: b.targetFinishDate,
              health: art.scheduleHealth,
              ownerName: art.ownerName,
              status: b.currentOperation,
              colorClass: 'text-emerald-900 bg-emerald-50 border-emerald-300',
              badgeBg: 'bg-emerald-600',
            });
          }
        });
      }
    });

    tasks.forEach((t) => {
      if (t.dueDate) {
        const matchingArt = articles.find((a) => a.id === t.articleId || a.code === t.articleCode);
        events.push({
          id: `task-${t.id}`,
          articleId: t.articleId || 'art-101',
          articleCode: t.articleCode || 'ART',
          articleName: t.articleTitle || t.title,
          stage: t.stage,
          businessUnit: matchingArt?.businessUnit || 'GUDSKUY',
          type: 'task',
          typeLabel: 'Task Operational',
          title: `Task: ${t.title}`,
          date: t.dueDate,
          health: t.status === 'Blocked' ? 'Blocked' : 'On Track',
          ownerName: t.picName,
          status: t.status,
          colorClass: 'text-purple-900 bg-purple-50 border-purple-200',
          badgeBg: 'bg-purple-600',
        });
      }
    });

    return events;
  }, [articles, tasks, selectedUnitFilter]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      const matchesSearch =
        !searchQuery ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.articleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.articleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedEventType === 'Semua' ||
        (selectedEventType === 'sample' && (ev.type === 'sample_target' || ev.type === 'sample_actual')) ||
        (selectedEventType === 'release' && (ev.type === 'release_target' || ev.type === 'release_actual')) ||
        (selectedEventType === 'production' && ev.type === 'batch_prod') ||
        (selectedEventType === 'task' && ev.type === 'task');

      const matchesHealth =
        selectedHealth === 'Semua' || ev.health === selectedHealth;

      return matchesSearch && matchesType && matchesHealth;
    });
  }, [allEvents, searchQuery, selectedEventType, selectedHealth]);

  // Generate Month Grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        events: filteredEvents.filter((e) => e.date === dateStr),
      });
    }

    // Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateObj = new Date(year, month, dayNum);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: filteredEvents.filter((e) => e.date === dateStr),
      });
    }

    // Remaining cells to fill grid
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const nextDate = new Date(year, month + 1, dayNum);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        events: filteredEvents.filter((e) => e.date === dateStr),
      });
    }

    return days;
  }, [year, month, filteredEvents]);

  // Selected Day's events
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.date === selectedDateStr);
  }, [filteredEvents, selectedDateStr]);

  // Statistics KPI
  const stats = useMemo(() => {
    const currentMonthEvents = filteredEvents.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const overdueCount = currentMonthEvents.filter(
      (e) => e.health === 'Overdue' || e.health === 'At Risk'
    ).length;

    // Milestone yang sudah benar-benar terjadi, bukan sekadar terjadwal.
    const targetCount = currentMonthEvents.filter(
      (e) => e.type === 'sample_target' || e.type === 'release_target',
    ).length;
    const achievedCount = currentMonthEvents.filter(
      (e) => e.type === 'sample_actual' || e.type === 'release_actual',
    ).length;

    return {
      totalThisMonth: currentMonthEvents.length,
      overdueCount,
      sampleTargetsCount: currentMonthEvents.filter((e) => e.type === 'sample_target').length,
      releaseTargetsCount: currentMonthEvents.filter((e) => e.type === 'release_target').length,
      productionCount: currentMonthEvents.filter((e) => e.type === 'batch_prod').length,
      achievedCount,
      /** Rasio milestone tercapai terhadap yang ditargetkan bulan ini. */
      achievementRate: targetCount > 0 ? Math.round((achievedCount / targetCount) * 100) : 0,
      onTrackCount: currentMonthEvents.filter((e) => e.health === 'On Track').length,
    };
  }, [filteredEvents, year, month]);

  const handleSaveReschedule = () => {
    if (!editingArticle) return;

    const updated: Article = {
      ...editingArticle,
      targetSampleDate: newTargetSampleDate || editingArticle.targetSampleDate,
      targetReleaseDate: newTargetReleaseDate || editingArticle.targetReleaseDate,
      lastUpdated: new Date().toISOString(),
    };

    onUpdateArticle(updated);
    setEditingArticle(null);
  };

  return (
    <div className="space-y-3 text-xs text-slate-900 pb-12">
      {/* COMPACT INTEGRATED HEADER & TOOLBAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs space-y-2">
        {/* Top Bar: Month Controls, Compact Stats Pills, View Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Month Nav */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleToday}
                className="px-2 py-0.5 text-[11px] font-extrabold text-slate-700 hover:text-[#087E79] transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <h2 className="text-sm font-extrabold text-slate-900 font-mono tracking-tight mr-2">
              {monthNamesID[month]} {year}
            </h2>

            {/* Compact High-Density KPI Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#087E79] border border-teal-200 text-[10px] font-bold flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                <span>{stats.totalThisMonth} Total Milestone</span>
              </span>

              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{stats.sampleTargetsCount} Target Sample</span>
              </span>

              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{stats.releaseTargetsCount} Target Launch</span>
              </span>

              {stats.productionCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                  <BarChart2 className="w-3 h-3" />
                  <span>{stats.productionCount} Batch Produksi</span>
                </span>
              )}

              {/* Rasio pencapaian: membedakan yang sudah terjadi dari yang baru
                  dijadwalkan — sebelumnya keduanya tampak sama. */}
              <span
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1.5"
                title={`${stats.achievedCount} milestone tercapai dari target bulan ini`}
              >
                <span>Tercapai {stats.achievementRate}%</span>
                <span className="w-10 h-1.5 rounded-full bg-slate-200 overflow-hidden inline-block">
                  <span
                    className={`block h-full rounded-full ${
                      stats.achievementRate >= 75 ? 'bg-emerald-500'
                        : stats.achievementRate >= 40 ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${stats.achievementRate}%` }}
                  />
                </span>
              </span>

              {stats.overdueCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>{stats.overdueCount} Berisiko</span>
                </span>
              )}
            </div>
          </div>

          {/* View Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#087E79] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Grid Calendar</span>
            </button>

            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'gantt'
                  ? 'bg-[#087E79] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Gantt Timeline</span>
            </button>

            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-[#087E79] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <List className="w-3 h-3" />
              <span>Agenda List</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <select
              value={selectedUnitFilter}
              onChange={(e) => setSelectedUnitFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-800 font-bold focus:outline-none focus:border-[#087E79] shrink-0"
            >
              <option value="Semua">Semua Brand / BU</option>
              {loadStoredBusinessUnits().map((bu) => (
                <option key={bu.id} value={bu.name}>
                  {bu.name}
                </option>
              ))}
            </select>

            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-800 font-bold focus:outline-none focus:border-[#087E79] shrink-0"
            >
              <option value="Semua">Semua Kategori Milestone</option>
              <option value="sample">Target Sampling</option>
              <option value="release">Target Release/Launch</option>
              <option value="production">Batch Produksi</option>
              <option value="task">Tasks & Action</option>
            </select>

            <select
              value={selectedHealth}
              onChange={(e) => setSelectedHealth(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-800 font-bold focus:outline-none focus:border-[#087E79] shrink-0"
            >
              <option value="Semua">Semua Health</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="relative shrink-0 w-full sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode/artikel/PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:border-[#087E79]"
            />
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: OPTIMIZED HIGH-DENSITY MONTH GRID + SPLIT INSPECTOR PANEL */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* Calendar Grid Section (8 cols on desktop) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center font-extrabold text-[10px] text-slate-600 py-1.5 uppercase tracking-wider">
              <div>Min</div>
              <div>Sen</div>
              <div>Sel</div>
              <div>Rab</div>
              <div>Kam</div>
              <div>Jum</div>
              <div>Sab</div>
            </div>

            {/* High-density grid cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/50">
              {calendarDays.map((day, idx) => {
                const isSelected = day.dateStr === selectedDateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`min-h-[68px] sm:min-h-[76px] p-1 flex flex-col justify-between transition-all cursor-pointer select-none ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                    } ${
                      isSelected
                        ? 'bg-teal-50/70 ring-2 ring-[#087E79] ring-inset z-10'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono font-extrabold text-[11px] px-1 py-0.2 rounded ${
                          day.isToday
                            ? 'bg-[#087E79] text-white shadow-2xs'
                            : isSelected
                            ? 'text-[#087E79] font-black'
                            : day.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {day.dayNum}
                      </span>

                      {day.events.length > 0 && (
                        <span className="text-[9px] font-mono font-extrabold text-[#087E79] bg-teal-50 px-1 rounded">
                          {day.events.length}
                        </span>
                      )}
                    </div>

                    {/* Compact Events Badges */}
                    <div className="space-y-0.5 overflow-hidden my-0.5">
                      {day.events.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`px-1 py-0.5 rounded text-[9px] font-bold leading-tight truncate flex items-center gap-1 ${ev.colorClass}`}
                          title={`${ev.title} (${ev.articleCode})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.badgeBg}`} />
                          <span className="truncate">{ev.articleCode}: {ev.typeLabel}</span>
                        </div>
                      ))}

                      {day.events.length > 2 && (
                        <div className="text-[8px] font-extrabold text-slate-500 bg-slate-100 px-1 py-0.2 rounded text-center">
                          +{day.events.length - 2} event lagi
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Inspector Panel for Selected Date (4 cols on desktop) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-2xs p-3 space-y-3 sticky top-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-[#087E79]" />
                <h3 className="font-extrabold text-xs text-slate-900 font-mono">
                  Agenda {new Date(selectedDateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {selectedDayEvents.length} Milestone
              </span>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-1">
                <Info className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="font-bold text-xs text-slate-700">Tidak ada agenda pada tanggal ini.</p>
                <p className="text-[10px]">Klik tanggal lain di kalender untuk melihat detail jadwal.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
                {selectedDayEvents.map((ev) => {
                  const targetArt = articles.find((a) => a.id === ev.articleId);

                  return (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-extrabold text-[#087E79] bg-teal-100/60 px-1.5 py-0.2 rounded">
                              {ev.articleCode}
                            </span>
                            <span className="text-[9px] font-extrabold text-slate-600 bg-slate-200 px-1 py-0.2 rounded">
                              {ev.typeLabel}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-900 mt-1">
                            {ev.title}
                          </h4>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            ev.health === 'On Track'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ev.health === 'At Risk'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ev.health || 'On Track'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-slate-400 block">Brand/BU:</span>
                          <span className="font-bold text-slate-800">{ev.businessUnit}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block">PIC / Owner:</span>
                          <span className="font-bold text-slate-800">{ev.ownerName}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block">Tahap Artikel:</span>
                          <span className="font-bold text-slate-800">{ev.stage}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block">Status:</span>
                          <span className="font-bold text-slate-800">{ev.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => onSelectArticle(ev.articleId, 'workspace')}
                          className="flex-1 py-1 px-2 rounded-lg bg-[#087E79] text-white hover:bg-[#066864] text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka Workspace</span>
                        </button>

                        {targetArt && (
                          <button
                            onClick={() => setEditingArticle(targetArt)}
                            className="py-1 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#087E79] text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            title="Reschedule Jadwal"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Target</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: GANTT TIMELINE VIEW */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 space-y-3 overflow-x-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-[#087E79]" />
              <span>Gantt Timeline Peluncuran ({articles.length} Artikel)</span>
            </h3>
          </div>

          <div className="space-y-2 min-w-[650px]">
            {articles.map((art) => (
              <div
                key={art.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-[#087E79] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {art.code}
                    </span>
                    <span className="font-extrabold text-xs text-slate-900">{art.name}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded font-bold">
                      {art.stage}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        art.scheduleHealth === 'On Track'
                          ? 'bg-emerald-100 text-emerald-800'
                          : art.scheduleHealth === 'At Risk'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {art.scheduleHealth}
                    </span>

                    <button
                      onClick={() => setEditingArticle(art)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#087E79] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Jadwal</span>
                    </button>

                    <button
                      onClick={() => onSelectArticle(art.id, 'workspace')}
                      className="px-2.5 py-1 rounded-lg bg-[#087E79] text-white hover:bg-[#066864] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Workspace</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">Target Sample</span>
                    <span className="font-mono font-extrabold text-indigo-700 text-[11px]">
                      {art.targetSampleDate || '-'}
                    </span>
                  </div>

                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">Batch Prod</span>
                    <span className="font-mono font-extrabold text-amber-700 text-[11px]">
                      {art.batches && art.batches[0] ? `${art.batches[0].progressPercent}%` : '0%'}
                    </span>
                  </div>

                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">Target Release</span>
                    <span className="font-mono font-extrabold text-[#087E79] text-[11px]">
                      {art.targetReleaseDate || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: AGENDA LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
          <div className="p-2.5 bg-slate-100/90 font-extrabold text-xs text-slate-800 flex items-center justify-between">
            <span>Kronologi Agenda Milestone ({filteredEvents.length} Items)</span>
          </div>

          {filteredEvents
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((ev) => (
              <div key={ev.id} className="p-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="text-center bg-slate-100 px-2 py-1 rounded-lg min-w-[60px] border border-slate-200">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">
                      {new Date(ev.date).toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                    <span className="text-sm font-extrabold font-mono text-slate-900 block leading-none">
                      {new Date(ev.date).getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${ev.colorClass}`}>
                        {ev.articleCode}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-1 py-0.2 rounded">
                        {ev.typeLabel}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 mt-0.5">{ev.title}</h4>
                    <span className="text-[10px] text-slate-500">PIC: {ev.ownerName}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectArticle(ev.articleId, 'workspace')}
                  className="px-3 py-1 rounded-lg bg-[#087E79] text-white hover:bg-[#066864] text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Workspace</span>
                </button>
              </div>
            ))}
        </div>
      )}

      {/* QUICK RESCHEDULE MODAL */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#087E79]" />
                <span>Ubah Target Jadwal ({editingArticle.code})</span>
              </h3>
              <button
                onClick={() => setEditingArticle(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Target Sample Date
                </label>
                <input
                  type="date"
                  defaultValue={editingArticle.targetSampleDate}
                  onChange={(e) => setNewTargetSampleDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#087E79]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Target Release / Launch Date
                </label>
                <input
                  type="date"
                  defaultValue={editingArticle.targetReleaseDate}
                  onChange={(e) => setNewTargetReleaseDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#087E79]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingArticle(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveReschedule}
                className="px-4 py-1.5 rounded-lg bg-[#087E79] text-white hover:bg-[#066864] text-xs font-bold cursor-pointer shadow-2xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
