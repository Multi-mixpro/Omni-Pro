/**
 * Utility functions for WhatsApp formatting, direct wa.me messaging links, and WhatsApp web/app integration.
 */

// Formats any ID phone number (08xxx, +62xxx, 628xxx) into clean 628xxx digits
export function formatToWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Clean all non-digits
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('0')) {
    digits = '62' + digits.substring(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  return digits;
}

// Generates wa.me link with optional pre-filled message text
export function getWhatsAppLink(phone: string, text?: string): string {
  const formattedPhone = formatToWhatsAppNumber(phone);
  if (!formattedPhone) return '#';

  const baseUrl = `https://wa.me/${formattedPhone}`;
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }
  return baseUrl;
}

// Pre-formatted template messages for Enterprise Presensi
export const WA_TEMPLATES = {
  absenceAlert: (employeeName: string, unitName: string, shiftName: string) =>
    `Halo ${employeeName},\n\nSistem Presensi Multi-Unit (${unitName}) mendeteksi Anda belum melakukan Clock-In untuk ${shiftName} hari ini.\n\nMohon segera konfirmasi status kehadiran Anda melalui Portal Absensi atau hubungi Atasan/HR. Terima kasih.`,

  lateNotice: (employeeName: string, checkInTime: string, shiftName: string) =>
    `Halo ${employeeName},\n\nSistem mencatat presensi Clock-In Anda pada jam ${checkInTime} (${shiftName}). Status: TERLAMBAT.\n\nCatatan ini telah terdaftar di sistem audit absensi enterprise.`,

  clockInSuccess: (employeeName: string, time: string, unitName: string, status: string) =>
    `Presensi Berhasil!\n\nNama: ${employeeName}\nWaktu: ${time}\nUnit: ${unitName}\nStatus: ${status}\n\nTerima kasih telah melakukan presensi tepat waktu.`,

  managerContact: (managerName: string, unitName: string) =>
    `Halo ${managerName} (Manager ${unitName}),\n\nSaya ingin berkonsultasi mengenai jadwal shift dan presensi unit.`,
};
