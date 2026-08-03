import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { AttendanceRecord, BusinessUnit } from '../types';

export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  unitName: string,
  selectedDate: string
) {
  const data = records.map((r, index) => ({
    'No': index + 1,
    'Kode Karyawan': r.employeeCode,
    'Nama Karyawan': r.employeeName,
    'Unit Usaha': r.unitId.replace('_', ' '),
    'Tanggal': r.date,
    'Jadwal Shift': r.shiftName,
    'Jam Masuk': r.checkInTime || '-',
    'Jam Pulang': r.checkOutTime || '-',
    'Status Kehadiran': r.status,
    'Akurasi Geofencing': `${r.distanceMeters} meter (${r.geofenceStatus})`,
    'Face Match %': r.faceMatchScore ? `${r.faceMatchScore}%` : '-',
    'Lokasi Presensi': r.locationName,
    'Catatan': r.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi Presensi');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 15 }, // Kode
    { wch: 22 }, // Nama
    { wch: 15 }, // Unit
    { wch: 12 }, // Tanggal
    { wch: 22 }, // Shift
    { wch: 12 }, // Jam Masuk
    { wch: 12 }, // Jam Pulang
    { wch: 16 }, // Status
    { wch: 25 }, // Geofence
    { wch: 12 }, // Face match
    { wch: 30 }, // Lokasi
    { wch: 25 }, // Catatan
  ];

  const fileName = `Laporan_Presensi_${unitName.replace(/\s+/g, '_')}_${selectedDate}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportAttendanceToPDF(
  records: AttendanceRecord[],
  unitName: string,
  selectedDate: string,
  businessUnits: BusinessUnit[]
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header styling
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN REKAPITULASI PRESENSI KARYAWAN', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Unit Usaha: ${unitName.toUpperCase()}  |  Tanggal: ${selectedDate}  |  Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 20);

  // Summary Metrics Bar
  const total = records.length;
  const hadir = records.filter(r => r.status === 'HADIR').length;
  const terlambat = records.filter(r => r.status === 'TERLAMBAT').length;
  const sakitIzin = records.filter(r => r.status === 'SAKIT' || r.status === 'IZIN').length;
  const alpha = records.filter(r => r.status === 'ALPHA').length;

  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, 32, 269, 12, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${total} Org  |  Hadir: ${hadir}  |  Terlambat: ${terlambat}  |  Izin/Sakit: ${sakitIzin}  |  Alpha: ${alpha}`, 18, 40);

  // Table Headers
  let startY = 52;
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(14, startY, 269, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  doc.text('NO', 16, startY + 5.5);
  doc.text('KODE', 26, startY + 5.5);
  doc.text('NAMA KARYAWAN', 50, startY + 5.5);
  doc.text('UNIT', 100, startY + 5.5);
  doc.text('SHIFT', 130, startY + 5.5);
  doc.text('MASUK', 170, startY + 5.5);
  doc.text('PULANG', 190, startY + 5.5);
  doc.text('STATUS', 212, startY + 5.5);
  doc.text('GEOFENCE', 235, startY + 5.5);
  doc.text('FACE MATCH', 265, startY + 5.5);

  let currentY = startY + 8;
  doc.setFont('helvetica', 'normal');

  records.forEach((r, idx) => {
    if (currentY > 185) {
      doc.addPage();
      currentY = 20;
    }

    // Row zebra striping
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 269, 7, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);

    doc.text((idx + 1).toString(), 16, currentY + 5);
    doc.text(r.employeeCode, 26, currentY + 5);
    doc.text(r.employeeName.substring(0, 22), 50, currentY + 5);
    doc.text(r.unitId.replace('_', ' '), 100, currentY + 5);
    doc.text(r.shiftName.substring(0, 20), 130, currentY + 5);
    doc.text(r.checkInTime || '-', 170, currentY + 5);
    doc.text(r.checkOutTime || '-', 190, currentY + 5);

    // Status color badge text
    if (r.status === 'HADIR') doc.setTextColor(16, 185, 129); // green
    else if (r.status === 'TERLAMBAT') doc.setTextColor(245, 158, 11); // amber
    else if (r.status === 'SAKIT' || r.status === 'IZIN') doc.setTextColor(59, 130, 246); // blue
    else doc.setTextColor(239, 68, 68); // red

    doc.text(r.status, 212, currentY + 5);

    doc.setTextColor(71, 85, 105);
    doc.text(`${r.distanceMeters}m (${r.geofenceStatus})`, 235, currentY + 5);
    doc.text(r.faceMatchScore ? `${r.faceMatchScore}%` : '-', 265, currentY + 5);

    currentY += 7;
  });

  // Footer Signatures
  currentY += 10;
  if (currentY > 170) {
    doc.addPage();
    currentY = 30;
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Dibuat oleh: Sistem Absensi Biometrik Presensi Multi-Unit', 14, currentY + 15);
  doc.text('Mengetahui: HR & General Manager Operations', 210, currentY + 15);
  doc.text('(________________________)', 210, currentY + 30);

  const fileName = `Laporan_Presensi_${unitName.replace(/\s+/g, '_')}_${selectedDate}.pdf`;
  doc.save(fileName);
}
