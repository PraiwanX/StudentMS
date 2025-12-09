// ==========================================
// QR Scan Page - QR Code Attendance Check-in
// ==========================================

import { qrSessionsStore, studentsStore, attendanceStore, classesStore } from '../store.js';
import { showToast, escapeHtml, getToday } from '../utils.js';

let currentStream = null;
let scannerActive = false;

export async function renderScan(container) {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const sessionCode = params.get('code');
  
  if (sessionCode) {
    // Student scanning QR
    renderStudentScan(container, sessionCode);
  } else {
    // Teacher generating QR
    renderTeacherQR(container);
  }
}

function renderTeacherQR(container) {
  const classes = classesStore.getActive();
  
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📱 QR Code เช็คชื่อ</h1>
      <p class="page-subtitle">สร้าง QR Code ให้นักเรียน Scan เพื่อเช็คชื่อ</p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Generate QR -->
      <div class="card">
        <div class="card-header">
          <h2 class="font-semibold text-gray-900 dark:text-white">สร้าง QR Code</h2>
        </div>
        <div class="card-body space-y-4">
          <div>
            <label class="label">เลือกวิชา</label>
            <select id="class-select" class="select">
              ${classes.length === 0 ? 
                '<option value="">ไม่มีวิชา</option>' :
                classes.map(cls => `
                  <option value="${cls.id}">${escapeHtml(cls.name)} (${escapeHtml(cls.code)})</option>
                `).join('')
              }
            </select>
          </div>
          
          <div>
            <label class="label">หมดอายุใน (นาที)</label>
            <select id="expire-select" class="select">
              <option value="5">5 นาที</option>
              <option value="10" selected>10 นาที</option>
              <option value="15">15 นาที</option>
              <option value="30">30 นาที</option>
              <option value="60">60 นาที</option>
            </select>
          </div>
          
          <button id="generate-qr-btn" class="btn-primary w-full" ${classes.length === 0 ? 'disabled' : ''}>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
            </svg>
            สร้าง QR Code
          </button>
        </div>
      </div>
      
      <!-- QR Display -->
      <div class="card">
        <div class="card-header">
          <h2 class="font-semibold text-gray-900 dark:text-white">QR Code</h2>
        </div>
        <div id="qr-display" class="card-body">
          <div class="text-center py-8 text-gray-400">
            <svg class="w-24 h-24 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
            </svg>
            <p>คลิก "สร้าง QR Code" เพื่อเริ่ม</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Active Sessions -->
    <div class="mt-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session ที่กำลังทำงาน</h3>
      <div id="active-sessions"></div>
    </div>
  `;
  
  updateActiveSessions();
  
  document.getElementById('generate-qr-btn')?.addEventListener('click', () => {
    const classId = document.getElementById('class-select').value;
    const expireMinutes = parseInt(document.getElementById('expire-select').value);
    
    if (!classId) {
      showToast('กรุณาเลือกวิชา', 'error');
      return;
    }
    
    // Create session
    const expiresAt = new Date(Date.now() + expireMinutes * 60000).toISOString();
    const session = qrSessionsStore.create({
      classId,
      date: getToday(),
      expiresAt
    });
    
    // Generate QR URL
    const qrUrl = `${window.location.origin}${window.location.pathname}#/scan?code=${session.sessionCode}`;
    
    // Show QR
    const qrDisplay = document.getElementById('qr-display');
    const cls = classesStore.getById(classId);
    
    qrDisplay.innerHTML = `
      <div class="text-center">
        <div class="bg-white p-4 rounded-xl inline-block mb-4">
          <!-- Simple QR Code using API -->
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}" 
               alt="QR Code" class="w-48 h-48 mx-auto">
        </div>
        <p class="text-lg font-bold text-gray-900 dark:text-white">${escapeHtml(cls.name)}</p>
        <p class="text-2xl font-mono font-bold text-primary-600">${session.sessionCode}</p>
        <p class="text-sm text-gray-500 mt-2">หมดอายุใน ${expireMinutes} นาที</p>
        <p class="text-xs text-gray-400 mt-1">นักเรียน Scan หรือเปิด URL:</p>
        <code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block mt-1 break-all">${qrUrl}</code>
      </div>
    `;
    
    showToast('สร้าง QR Code แล้ว', 'success');
    updateActiveSessions();
  });
  
  function updateActiveSessions() {
    const sessions = qrSessionsStore.getAll().filter(s => 
      s.isActive && new Date() < new Date(s.expiresAt)
    );
    
    const sessionsContainer = document.getElementById('active-sessions');
    
    if (sessions.length === 0) {
      sessionsContainer.innerHTML = '<p class="text-gray-400">ไม่มี session ที่กำลังทำงาน</p>';
      return;
    }
    
    sessionsContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${sessions.map(session => {
          const cls = classesStore.getById(session.classId);
          const remaining = Math.max(0, Math.round((new Date(session.expiresAt) - new Date()) / 60000));
          
          return `
            <div class="card p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-gray-900 dark:text-white">${cls ? escapeHtml(cls.code) : '-'}</span>
                <span class="badge-success">🟢 Active</span>
              </div>
              <div class="text-sm text-gray-500">
                <p>รหัส: <span class="font-mono font-bold">${session.sessionCode}</span></p>
                <p>Scan แล้ว: ${session.scannedStudents.length} คน</p>
                <p>เหลือ: ${remaining} นาที</p>
              </div>
              <button class="deactivate-btn btn-sm btn-danger mt-2" data-id="${session.id}">ปิด Session</button>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    document.querySelectorAll('.deactivate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        qrSessionsStore.deactivate(btn.dataset.id);
        showToast('ปิด Session แล้ว', 'success');
        updateActiveSessions();
      });
    });
  }
}

function renderStudentScan(container, sessionCode) {
  const session = qrSessionsStore.getByCode(sessionCode);
  
  if (!session) {
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">ไม่พบ Session</h2>
          <p class="text-gray-500">QR Code ไม่ถูกต้องหรือหมดอายุแล้ว</p>
        </div>
      </div>
    `;
    return;
  }
  
  if (!session.isActive || new Date() > new Date(session.expiresAt)) {
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Session หมดอายุ</h2>
          <p class="text-gray-500">กรุณาติดต่ออาจารย์เพื่อสร้าง QR ใหม่</p>
        </div>
      </div>
    `;
    return;
  }
  
  const cls = classesStore.getById(session.classId);
  const students = studentsStore.getByClass(session.classId);
  
  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl">
          ✓
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">เช็คชื่อเข้าเรียน</h1>
        <p class="text-gray-500">${cls ? escapeHtml(cls.name) : '-'}</p>
      </div>
      
      <div class="card">
        <div class="card-body space-y-4">
          <div>
            <label class="label">รหัสนักเรียน</label>
            <input type="text" id="student-id-input" class="input text-center text-lg font-mono" placeholder="กรอกรหัสนักเรียน">
          </div>
          
          <button id="checkin-btn" class="btn-success w-full text-lg py-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            เช็คชื่อ
          </button>
        </div>
      </div>
      
      <div id="checkin-result" class="mt-4"></div>
    </div>
  `;
  
  document.getElementById('checkin-btn').addEventListener('click', () => {
    const studentIdInput = document.getElementById('student-id-input').value.trim();
    const resultDiv = document.getElementById('checkin-result');
    
    if (!studentIdInput) {
      showToast('กรุณากรอกรหัสนักเรียน', 'error');
      return;
    }
    
    // Find student
    const student = students.find(s => s.studentId === studentIdInput);
    
    if (!student) {
      resultDiv.innerHTML = `
        <div class="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-center">
          <p class="text-red-700 dark:text-red-300 font-medium">❌ ไม่พบรหัสนักเรียน ${escapeHtml(studentIdInput)}</p>
        </div>
      `;
      return;
    }
    
    // Record scan
    const result = qrSessionsStore.recordScan(session.id, student.id);
    
    if (result.success) {
      // Also record attendance
      attendanceStore.set(session.classId, student.id, session.date, 'present');
      
      resultDiv.innerHTML = `
        <div class="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl text-center">
          <p class="text-green-700 dark:text-green-300 font-medium text-lg">✅ เช็คชื่อสำเร็จ!</p>
          <p class="text-gray-600 dark:text-gray-400">${escapeHtml(student.name)}</p>
        </div>
      `;
      showToast('เช็คชื่อสำเร็จ!', 'success');
    } else {
      resultDiv.innerHTML = `
        <div class="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-center">
          <p class="text-yellow-700 dark:text-yellow-300 font-medium">⚠️ ${result.error === 'Already checked in' ? 'เช็คชื่อไปแล้ว' : result.error}</p>
        </div>
      `;
    }
    
    document.getElementById('student-id-input').value = '';
  });
  
  document.getElementById('student-id-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('checkin-btn').click();
    }
  });
}
