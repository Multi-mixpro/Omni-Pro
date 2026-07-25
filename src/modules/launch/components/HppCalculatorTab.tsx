import React, { useState } from 'react';
import { HppItem } from '../domain/stageTypes';
import {
  calculateDirectCost,
  calculateRejectCost,
  calculateOverheadCost,
  calculateHppTotal,
  calculateSuggestedSellingPrice,
} from '../domain/hppCalculator';
import { Calculator, Plus, Trash2, CheckCircle2, Lock } from 'lucide-react';

interface HppCalculatorProps {
  workOrderId: string;
  isReadOnly?: boolean;
}

export const HppCalculatorTab: React.FC<HppCalculatorProps> = ({ isReadOnly = false }) => {
  const [items, setItems] = useState<HppItem[]>([
    {
      category: 'FABRIC',
      item_name: 'Cotton Combed 30s',
      qty: 1.2,
      unit: 'meter',
      unit_cost: 45000,
      total_cost: 54000,
    },
    {
      category: 'SEWING',
      item_name: 'Ongkos CMT Jahit',
      qty: 1,
      unit: 'pcs',
      unit_cost: 25000,
      total_cost: 25000,
    },
    {
      category: 'ACCESSORY',
      item_name: 'Kancing Resin & Label',
      qty: 1,
      unit: 'set',
      unit_cost: 10000,
      total_cost: 10000,
    },
  ]);

  const [rejectPct, setRejectPct] = useState<number>(3);
  const [overheadPct, setOverheadPct] = useState<number>(15);
  const [targetMarginPct, setTargetMarginPct] = useState<number>(35);
  const [isFinalized, setIsFinalized] = useState<boolean>(false);

  // Math Calculations
  const directCostTotal = calculateDirectCost(items);
  const rejectCostTotal = calculateRejectCost(directCostTotal, rejectPct);
  const overheadCostTotal = calculateOverheadCost(directCostTotal, rejectCostTotal, overheadPct);
  const hppTotal = calculateHppTotal(directCostTotal, rejectCostTotal, overheadCostTotal);
  const suggestedSellingPrice = calculateSuggestedSellingPrice(hppTotal, targetMarginPct);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        category: 'FABRIC',
        item_name: '',
        qty: 1,
        unit: 'pcs',
        unit_cost: 0,
        total_cost: 0,
      },
    ]);
  };

  const handleItemChange = (index: number, field: keyof HppItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'qty' || field === 'unit_cost') {
      item.total_cost = (Number(item.qty) || 0) * (Number(item.unit_cost) || 0);
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-white">Kalkulasi HPP & Harga Jual Artikel</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  isFinalized
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {isFinalized ? 'FINAL (LOCKED)' : 'VERSIONS: DRAFT'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kalkulasi otomatis Direct Cost, Reject %, Overhead %, dan Margin Harga Jual
            </p>
          </div>
        </div>

        {!isFinalized && !isReadOnly && (
          <button
            onClick={() => setIsFinalized(true)}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalisasi HPP</span>
          </button>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Kategori</th>
                <th className="p-3">Item Komponen</th>
                <th className="p-3 w-20">Qty</th>
                <th className="p-3 w-24">Satuan</th>
                <th className="p-3 text-right">Harga/Satuan (Rp)</th>
                <th className="p-3 text-right">Total Cost (Rp)</th>
                {!isFinalized && !isReadOnly && <th className="p-3 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <select
                      disabled={isFinalized || isReadOnly}
                      value={item.category}
                      onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="FABRIC">Fabric / Kain Utama</option>
                      <option value="LINING">Lining / Furing</option>
                      <option value="ACCESSORY">Aksesori / Kancing</option>
                      <option value="CUTTING">Cutting / Potong</option>
                      <option value="SEWING">Sewing / CMT Jahit</option>
                      <option value="PRINTING">Printing / Sablon</option>
                      <option value="EMBROIDERY">Embroidery / Bordir</option>
                      <option value="LABEL">Label / Hangtag</option>
                      <option value="PACKAGING">Packaging / Plastik</option>
                      <option value="FINISHING">Finishing / Buang Benang</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      disabled={isFinalized || isReadOnly}
                      value={item.item_name}
                      onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                      placeholder="Nama komponen..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      disabled={isFinalized || isReadOnly}
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      disabled={isFinalized || isReadOnly}
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      disabled={isFinalized || isReadOnly}
                      value={item.unit_cost}
                      onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 text-right focus:outline-none"
                    />
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-100">
                    Rp {item.total_cost.toLocaleString('id-ID')}
                  </td>
                  {!isFinalized && !isReadOnly && (
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isFinalized && !isReadOnly && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-start">
            <button
              onClick={handleAddItem}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Komponen HPP</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary Math Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-4 text-xs">
          <h4 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2">
            Persentase Overhead & Reject
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Direct Cost:</span>
            <span className="font-mono font-bold text-slate-200">
              Rp {directCostTotal.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Estimasi Reject (%):</span>
              <input
                type="number"
                disabled={isFinalized || isReadOnly}
                value={rejectPct}
                onChange={(e) => setRejectPct(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-800 rounded p-1 text-center font-bold text-blue-400"
              />
            </div>
            <span className="font-mono text-slate-400">
              + Rp {rejectCostTotal.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Overhead Operasional (%):</span>
              <input
                type="number"
                disabled={isFinalized || isReadOnly}
                value={overheadPct}
                onChange={(e) => setOverheadPct(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-800 rounded p-1 text-center font-bold text-purple-400"
              />
            </div>
            <span className="font-mono text-slate-400">
              + Rp {overheadCostTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="space-y-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-300 font-semibold">HPP TOTAL ARTIKEL</span>
              <span className="font-mono text-lg font-bold text-emerald-400">
                Rp {Math.round(hppTotal).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Target Margin (%):</span>
                <input
                  type="number"
                  disabled={isFinalized || isReadOnly}
                  value={targetMarginPct}
                  onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded p-1 text-center font-bold text-amber-400"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Rekomendasi Harga Jual</p>
              <p className="text-xl font-bold text-blue-400 font-mono">
                Rp {Math.round(suggestedSellingPrice).toLocaleString('id-ID')}
              </p>
            </div>
            {isFinalized && (
              <span className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Terunci</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
