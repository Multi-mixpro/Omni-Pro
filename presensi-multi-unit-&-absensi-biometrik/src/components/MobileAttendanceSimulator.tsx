import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Sliders,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  Smartphone,
  Lock,
} from 'lucide-react';
import { Employee, UnitType, AttendanceRecord, AttendanceStatus, BusinessUnit } from '../types';
import { BUSINESS_UNITS, EMPLOYEES } from '../data/mockData';

interface MobileAttendanceSimulatorProps {
  onClockInSuccess: (newRecord: AttendanceRecord) => void;
  selectedUnit: UnitType;
  units?: BusinessUnit[];
}

export const MobileAttendanceSimulator: React.FC<MobileAttendanceSimulatorProps> = ({
  onClockInSuccess,
  selectedUnit,
  units = BUSINESS_UNITS,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(EMPLOYEES[0].id);
  const [simulatedDistance, setSimulatedDistance] = useState<number>(18); // 18 meters
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanCompleted, setScanCompleted] = useState<boolean>(false);
  const [matchScore, setMatchScore] = useState<number>(98.8);
  const [useLiveCamera, setUseLiveCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [clockInDone, setClockInDone] = useState<boolean>(false);
  const [lastCheckInRecord, setLastCheckInRecord] = useState<AttendanceRecord | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedEmployee =
    EMPLOYEES.find((e) => e.id === selectedEmpId) || EMPLOYEES[0];

  const targetUnit =
    units.find((u) => u.id === selectedEmployee.unitId) ||
    units[0] ||
    BUSINESS_UNITS[0];

  const isGeofenceValid = simulatedDistance <= targetUnit.radiusMeters;

  // Toggle Live Webcam
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (useLiveCamera) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'user' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setCameraError(null);
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setCameraError('Izin kamera ditolak / tidak tersedia. Menggunakan fallback simulasi.');
          setUseLiveCamera(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((track) => track.stop());
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useLiveCamera]);

  const handleStartBiometricScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanCompleted(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setScanCompleted(true);
        const score = Number((97.5 + Math.random() * 2.3).toFixed(1));
        setMatchScore(score);
      }
    }, 200);
  };

  const handlePerformClockIn = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const dateString = now.toISOString().split('T')[0];

    // Determine status (Pagi vs Terlambat)
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 15);
    const status: AttendanceStatus = isLate ? 'TERLAMBAT' : 'HADIR';

    const newRecord: AttendanceRecord = {
      id: `ATT_MOB_${Date.now()}`,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      employeeCode: selectedEmployee.employeeCode,
      unitId: selectedEmployee.unitId,
      date: dateString,
      shiftName: 'Shift Presensi Mobile',
      checkInTime: timeString,
      status: isGeofenceValid ? status : 'ALPHA',
      geofenceStatus: isGeofenceValid ? 'VALID' : 'OUT_OF_RANGE',
      distanceMeters: simulatedDistance,
      faceMatchScore: matchScore,
      photoUrl: selectedEmployee.avatar,
      locationName: targetUnit.address,
      notes: isGeofenceValid
        ? 'Presensi Berhasil via Mobile Biometric Face Scan'
        : 'Di luar radius geofencing kantor!',
    };

    onClockInSuccess(newRecord);
    setLastCheckInRecord(newRecord);
    setClockInDone(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Mobile App Simulator
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Biometric Face ID + GPS Geofencing
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Simulasi Presensi Karyawan Mobile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Uji coba proses presensi karyawan dengan verifikasi wajah biometrik dan radius lokasi GPS kantor.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={useLiveCamera}
              onChange={(e) => setUseLiveCamera(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Gunakan Kamera Asli Web</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Test Parameters Controls */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-blue-500" />
            Parameter Pengujian Simulator
          </h3>

          {/* Select Employee */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Karyawan Presensi
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                setClockInDone(false);
                setScanCompleted(false);
              }}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
            >
              {EMPLOYEES.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode}) - {emp.unitId.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Target Office Unit Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Unit Usaha:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {targetUnit.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Titik Geofence:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                {targetUnit.latitude}, {targetUnit.longitude} ({targetUnit.radiusMeters}m)
              </span>
            </div>
            {targetUnit.wifiSsid && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Wi-Fi Validasi:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {targetUnit.wifiSsid}
                </span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
              📍 {targetUnit.address}
              {targetUnit.landmark && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5">
                  Patokan: {targetUnit.landmark}
                </div>
              )}
            </div>
          </div>

          {/* GPS Distance Slider Simulator */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                Simulasi Jarak GPS ke Kantor
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] ${
                  isGeofenceValid
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {simulatedDistance} Meter ({isGeofenceValid ? 'VALID' : 'OUT OF RADIUS'})
              </span>
            </div>

            <input
              type="range"
              min={5}
              max={250}
              value={simulatedDistance}
              onChange={(e) => setSimulatedDistance(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>5m (Di Dalam Kantor)</span>
              <span>100m (Batas Zone)</span>
              <span>250m (Di Luar Radius)</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSimulatedDistance(12)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800"
            >
              ✓ In-Office (12m)
            </button>
            <button
              onClick={() => setSimulatedDistance(180)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-semibold border border-red-200 dark:border-red-800"
            >
              ✕ Out-of-Zone (180m)
            </button>
          </div>
        </div>

        {/* Right Column: Smartphone UI View */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[360px] bg-slate-950 rounded-[40px] p-4 shadow-2xl border-4 border-slate-800 relative text-white">
            {/* Phone Notch & Camera Hole */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full flex items-center justify-center gap-2 z-20">
              <div className="w-2 h-2 rounded-full bg-slate-950" />
              <div className="w-3 h-1 rounded-full bg-slate-800" />
            </div>

            {/* Mobile App Viewport */}
            <div className="bg-slate-900 rounded-[30px] pt-7 pb-6 px-4 space-y-4 overflow-hidden relative min-h-[580px] flex flex-col justify-between">
              {/* App Status Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs">
                    P
                  </div>
                  <span className="text-xs font-bold">Presensi Mobile</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GPS Active
                </span>
              </div>

              {/* Employee Greeting Profile */}
              <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <img
                  src={selectedEmployee.avatar}
                  alt={selectedEmployee.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-blue-500 shadow-xs"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedEmployee.name}</h4>
                  <p className="text-[10px] text-slate-400">
                    {selectedEmployee.role} • {targetUnit.name}
                  </p>
                  <span className="text-[9px] text-blue-400 font-semibold">
                    NIK: {selectedEmployee.employeeCode}
                  </span>
                </div>
              </div>

              {/* Biometric Camera Box / Canvas */}
              <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 flex items-center justify-center">
                {useLiveCamera ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={selectedEmployee.avatar}
                    alt="Facial Scan"
                    className="w-full h-full object-cover opacity-90"
                  />
                )}

                {/* Biometric Face Mesh Animation Overlay */}
                <div className="absolute inset-0 bg-blue-900/10 pointer-events-none flex items-center justify-center">
                  {/* Face Tracking Bounding Box */}
                  <div className="w-36 h-44 rounded-3xl border-2 border-dashed border-emerald-400/80 relative flex items-center justify-center">
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-emerald-400" />

                    {isScanning && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/30 to-transparent animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Status Bar inside Camera */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-xl text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    {scanCompleted ? `${matchScore}% Match` : 'Face Scanner Ready'}
                  </span>
                  <span className="text-slate-300">Biometric v2</span>
                </div>
              </div>

              {/* Geofence GPS Distance Meter Pill */}
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  isGeofenceValid
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-red-950/60 border-red-800 text-red-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-bold">
                      Jarak GPS: {simulatedDistance} meter
                    </div>
                    <div className="text-[10px] opacity-80">
                      {isGeofenceValid
                        ? 'Di dalam radius kantor'
                        : 'Di luar radius geofence (Maks 80m)'}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isGeofenceValid ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                  }`}
                >
                  {isGeofenceValid ? 'VALID' : 'INVALID'}
                </span>
              </div>

              {/* Clock In Action Controls */}
              <div className="space-y-2">
                {!scanCompleted ? (
                  <button
                    onClick={handleStartBiometricScan}
                    disabled={isScanning}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>
                      {isScanning
                        ? `Memindai Wajah (${scanProgress}%)...`
                        : 'Mulai Pindai Biometrik Wajah'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handlePerformClockIn}
                    disabled={clockInDone}
                    className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                      clockInDone
                        ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                        : isGeofenceValid
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {clockInDone
                        ? 'Presensi Hari Ini Selesai'
                        : isGeofenceValid
                        ? 'Konfirmasi Presensi Masuk (Clock In)'
                        : 'Kirim Presensi (Di Luar Radius)'}
                    </span>
                  </button>
                )}
              </div>

              {/* Confirmation Alert Banner */}
              {clockInDone && lastCheckInRecord && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-[11px] text-emerald-200 animate-fadeIn space-y-1">
                  <div className="font-bold flex items-center gap-1 text-emerald-300">
                    <Check className="w-3.5 h-3.5" />
                    Presensi Berhasil Dicatat!
                  </div>
                  <div className="text-slate-300">
                    Waktu: {lastCheckInRecord.checkInTime} WIB | Status: {lastCheckInRecord.status}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Match: {lastCheckInRecord.faceMatchScore}% | Geofence: {lastCheckInRecord.distanceMeters}m
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
