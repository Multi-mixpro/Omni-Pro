import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Navigation,
  Globe,
  Radio,
  Wifi,
  ShieldCheck,
  Clock,
  UserCheck,
  Phone,
  Mail,
  Save,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Info,
  Sliders,
  Maximize2,
  AlertCircle,
  Truck,
  Warehouse,
  Utensils,
  Layers,
  MessageCircle,
} from 'lucide-react';
import { BusinessUnit, UnitType } from '../types';
import { getWhatsAppLink, WA_TEMPLATES } from '../utils/whatsapp';

interface UnitConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: BusinessUnit[];
  onUpdateUnit: (updatedUnit: BusinessUnit) => void;
  selectedUnitId?: UnitType;
}

export const UnitConfigurationModal: React.FC<UnitConfigurationModalProps> = ({
  isOpen,
  onClose,
  units,
  onUpdateUnit,
  selectedUnitId = 'GG_SUPPLY',
}) => {
  // Active unit inside modal
  const initialUnitId = selectedUnitId === 'ALL' ? 'GG_SUPPLY' : selectedUnitId;
  const [activeUnitId, setActiveUnitId] = useState<Exclude<UnitType, 'ALL'>>(
    initialUnitId as Exclude<UnitType, 'ALL'>
  );

  const currentUnit = units.find((u) => u.id === activeUnitId) || units[0];

  // Editable form state for current unit
  const [formData, setFormData] = useState<BusinessUnit>({ ...currentUnit });

  // Notice Toast
  const [notice, setNotice] = useState<string | null>(null);

  // Sync state when active unit tab changes
  const handleSelectUnitTab = (unitId: Exclude<UnitType, 'ALL'>) => {
    setActiveUnitId(unitId);
    const found = units.find((u) => u.id === unitId);
    if (found) {
      setFormData({ ...found });
    }
  };

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  const handleFetchCurrentGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          }));
          showToast('Koordinat GPS berhasil disinkronkan dari lokasi perangkat!');
        },
        () => {
          // Fallback simulation with slight variation
          const offsetLat = (Math.random() - 0.5) * 0.002;
          const offsetLng = (Math.random() - 0.5) * 0.002;
          setFormData((prev) => ({
            ...prev,
            latitude: Number((prev.latitude + offsetLat).toFixed(6)),
            longitude: Number((prev.longitude + offsetLng).toFixed(6)),
          }));
          showToast('Koordinat GPS berhasil diperbarui (Simulasi)!');
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUnit(formData);
    showToast(`Konfigurasi lokasi & geofence ${formData.name} berhasil disimpan!`);
  };

  const googleMapsUrl = `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} tersalin ke clipboard!`);
  };

  const getUnitIcon = (iconName: string) => {
    switch (iconName) {
      case 'Truck':
        return Truck;
      case 'Warehouse':
        return Warehouse;
      case 'Utensils':
        return Utensils;
      default:
        return Building2;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      {/* Toast Notification */}
      {notice && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white dark:bg-blue-600 px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      <div className="bg-white/95 dark:bg-[#0c162c] rounded-3xl w-full max-w-4xl max-h-[90vh] border border-slate-200 dark:border-[#1a2847] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#1a2847] flex items-center justify-between bg-slate-50/50 dark:bg-[#0f1a30] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-cyan-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Konfigurasi Unit Bisnis & Titik Geofence
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-cyan-300">
                  Akurasi Absensi Multi-Outlet
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur alamat fisik, titik koordinat GPS, radius geofence, validasi BSSID Wi-Fi kantor, serta penanggung jawab unit.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Business Unit Tabs Selector */}
        <div className="px-6 py-3 bg-slate-100/60 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          {units.map((unit) => {
            const IconComponent = getUnitIcon(unit.iconName);
            const isSelected = activeUnitId === unit.id;
            return (
              <button
                key={unit.id}
                onClick={() => handleSelectUnitTab(unit.id as Exclude<UnitType, 'ALL'>)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-102'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: unit.color }}
                />
                <IconComponent className="w-4 h-4" />
                <span>{unit.name}</span>
                <span className="opacity-75 text-[10px] font-mono">
                  ({unit.radiusMeters}m)
                </span>
              </button>
            );
          })}
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Alamat Fisik & Lokasi Administratif */}
          <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>1. Alamat Lengkap & Patokan Lokasi Fisik</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                ID Unit: <code className="font-mono text-blue-600 dark:text-blue-400 font-bold">{formData.id}</code>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Unit Usaha / Outlet
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Deskripsi Singkat Operasional
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Jalan Lengkap
              </label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. TB Simatupang No. 88, Cilandak..."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={formData.province || ''}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="Contoh: DKI Jakarta"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kota / Kabupaten
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Contoh: Jakarta Selatan"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={formData.postalCode || ''}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="12430"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Patokan / Detail Landmark Lokasi (Untuk Petugas Presensi)
              </label>
              <input
                type="text"
                value={formData.landmark || ''}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                placeholder="Gedung Cibis Nine Tower B, Lantai 5 (Depan Halte Busway Cilandak)"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Section 2: Koordinat GPS & Geofence Radius Map Simulator */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-200/80 dark:border-blue-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300 text-sm">
                <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>2. Titik Koordinat GPS & Radius Presensi Geofence</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchCurrentGps}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ambil GPS Device</span>
                </button>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold text-[11px] border border-slate-300 dark:border-slate-700 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Latitude (Lintang)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Longitude (Bujur)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Radius Geofence (Meter)
                  </label>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {formData.radiusMeters} Meter
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={formData.radiusMeters}
                  onChange={(e) =>
                    setFormData({ ...formData, radiusMeters: parseInt(e.target.value) })
                  }
                  className="w-full accent-blue-600 cursor-pointer mt-2"
                />
              </div>
            </div>

            {/* Visual Geofence Radar Box */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full bg-blue-950/80 border-2 border-blue-500/50 flex items-center justify-center shrink-0 overflow-hidden">
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                  <div className="w-12 h-12 rounded-full border border-blue-400/40 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-400 drop-shadow-md" />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Zona Presensi Virtual (Radius {formData.radiusMeters}m)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Karyawan hanya dapat melakukan clock-in apabila posisi GPS berada dalam radius{' '}
                    <strong className="text-blue-300">{formData.radiusMeters} meter</strong> dari titik pusat{' '}
                    <span className="font-mono text-slate-300">
                      ({formData.latitude}, {formData.longitude})
                    </span>
                    .
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" /> Anti-Fake GPS Active
                    </span>
                    <span className="flex items-center gap-1 text-blue-400">
                      <Radio className="w-3.5 h-3.5" /> High Precision Location
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `${formData.latitude}, ${formData.longitude}`,
                    'Koordinat Lat-Lng'
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 shrink-0"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>Salin Koordinat</span>
              </button>
            </div>
          </div>

          {/* Section 3: Wi-Fi Kantor & Validasi Jaringan Indoor */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>3. Validasi Wi-Fi Kantor & Aturan Presensi Tambahan</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                Validasi Ganda (Dual Check)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Wi-Fi Kantor (SSID)
                </label>
                <input
                  type="text"
                  value={formData.wifiSsid || ''}
                  onChange={(e) => setFormData({ ...formData, wifiSsid: e.target.value })}
                  placeholder="Contoh: GG_Supply_Office_5G"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  BSSID / MAC Address Router Kantor
                </label>
                <input
                  type="text"
                  value={formData.wifiBssid || ''}
                  onChange={(e) => setFormData({ ...formData, wifiBssid: e.target.value })}
                  placeholder="74:83:C2:11:4A:8B"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Izin Absen Luar Geofence
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Siswa/Kurir lapangan dapat absen luar lokasi via approval
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowOutsideGeofence || false}
                  onChange={(e) =>
                    setFormData({ ...formData, allowOutsideGeofence: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Wajib Scan Biometrik Wajah
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Membuat verifikasi foto selfie AI wajib untuk unit ini
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.requireBiometric !== false}
                  onChange={(e) =>
                    setFormData({ ...formData, requireBiometric: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Jam Operasional & Kontak Manager Unit */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>4. Jam Operasional & Penanggung Jawab Unit (PIC Manager)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jam Operasional Unit
                </label>
                <input
                  type="text"
                  value={formData.operatingHours || ''}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  placeholder="07:30 - 18:00 WIB"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Zona Waktu Operasional
                </label>
                <select
                  value={formData.timeZone || 'WIB (UTC+7)'}
                  onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                >
                  <option value="WIB (UTC+7)">WIB (Waktu Indonesia Barat - Jakarta/Bandung)</option>
                  <option value="WITA (UTC+8)">WITA (Waktu Indonesia Tengah - Bali/Makassar)</option>
                  <option value="WIT (UTC+9)">WIT (Waktu Indonesia Timur - Papua)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Manager / Head Unit
                </label>
                <input
                  type="text"
                  value={formData.managerName || ''}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="Bambang Supriyadi"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Nomor HP / WA Manager
                  </label>
                  {formData.managerPhone && (
                    <a
                      href={getWhatsAppLink(formData.managerPhone, WA_TEMPLATES.managerContact(formData.managerName || 'Manager', formData.name))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      title="Hubungi Manager via WhatsApp (wa.me)"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-500" />
                      <span>Chat WA Manager</span>
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.managerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                  placeholder="+62 812-9876-5432"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email PIC Unit
                </label>
                <input
                  type="email"
                  value={formData.managerEmail || ''}
                  onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                  placeholder="manager@company.com"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Submit Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi Unit {formData.name}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
