// ==========================================
// Attendance Page - Check-in & Statistics
// ==========================================

import { classesStore, studentsStore, attendanceStore } from '../store.js';
import { showToast, formatDate, getToday, getAttendanceStatus, getAttendancePercentageClass, escapeHtml, getDayName } from '../utils.js';

let selectedClass = '';
let selectedDate = getToday();

export async function renderAttendance(container) {
  const classes = classesStore.getActive();
  
  // Set default class if not selected
  if (!selectedClass && classes.length > 0) {
    selectedClass = classes[0].id;
  }
  
  render();
  
  function render() {
    const currentClass = classesStore.getById(selectedClass);
    const students = selectedClass ? studentsStore.getByClass(selectedClass) : [];
    const attendanceRecords = selectedClass ? attendanceStore.getByClassDate(selectedClass, selectedDate) : [];
    const allDates = selectedClass ? attendanceStore.getDatesByClass(selectedClass) : [];
    
    // Create attendance map for quick lookup
    const attendanceMap = {};
    attendanceRecords.forEach(r => {
      attendanceMap[r.studentId] = r.status;
    });
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">เช็คชื่อ</h1>
        <p class="page-subtitle">บันทึกการเข้าเรียนรายวัน</p>
      </div>
      
      <!-- Filters -->
      <div class="card mb-6">
        <div class="p-4">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <label class="label">เลือกวิชา</label>
              <select id="class-select" class="select">
                ${classes.length === 0 ? 
                  '<option value="">ไม่มีวิชา</option>' :
                  classes.map(cls => `
                    <option value="${cls.id}" ${selectedClass === cls.id ? 'selected' : ''}>
                      ${escapeHtml(cls.name)} (${escapeHtml(cls.code)})
                    </option>
                  `).join('')
                }
              </select>
            </div>
            <div>
              <label class="label">วันที่</label>
              <input 
                type="date" 
                id="date-input" 
                class="input" 
                value="${selectedDate}"
                max="${getToday()}"
              >
            </div>
          </div>
        </div>
      </div>
      
      ${!selectedClass || classes.length === 0 ? `
        <div class="card">
          <div class="empty-state py-12">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <p class="empty-state-title">ยังไม่มีวิชา</p>
            <p class="empty-state-description">กรุณา<a href="#/classes" class="text-primary-600 hover:underline">เพิ่มวิชา</a>ก่อน</p>
          </div>
        </div>
      ` : students.length === 0 ? `
        <div class="card">
          <div class="empty-state py-12">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <p class="empty-state-title">ไม่มีนักเรียนในวิชานี้</p>
            <p class="empty-state-description">กรุณา<a href="#/students" class="text-primary-600 hover:underline">ลงทะเบียนนักเรียน</a>ก่อน</p>
          </div>
        </div>
      ` : `
        <!-- Bulk Actions -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <span class="text-sm text-gray-500 dark:text-gray-400">เช็คชื่อทั้งหมด:</span>
          <button class="bulk-btn btn-sm btn-success" data-status="present">มา</button>
          <button class="bulk-btn btn-sm btn-danger" data-status="absent">ขาด</button>
          <button class="bulk-btn btn-sm bg-yellow-500 text-white hover:bg-yellow-600" data-status="late">สาย</button>
          <button class="bulk-btn btn-sm bg-blue-500 text-white hover:bg-blue-600" data-status="leave">ลา</button>
        </div>
        
        <!-- Attendance Table -->
        <div class="card overflow-hidden">
          <div class="card-header flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-white">${escapeHtml(currentClass?.name || '')}</h2>
              <p class="text-sm text-gray-500">${formatDate(selectedDate)} (${getDayName(selectedDate)})</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">นักเรียน ${students.length} คน</p>
            </div>
          </div>
          
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th class="w-12">#</th>
                  <th>รหัส</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th class="text-center">สถานะ</th>
                  <th class="text-center">% รวม</th>
                </tr>
              </thead>
              <tbody>
                ${students.map((student, index) => {
                  const status = attendanceMap[student.id] || '';
                  const stats = attendanceStore.calculatePercentage(student.id, selectedClass);
                  const statusInfo = getAttendanceStatus(status);
                  
                  return `
                    <tr>
                      <td class="text-gray-500">${index + 1}</td>
                      <td class="font-mono text-sm">${escapeHtml(student.studentId)}</td>
                      <td class="font-medium">${escapeHtml(student.name)}</td>
                      <td>
                        <div class="flex items-center justify-center gap-1">
                          <button class="attendance-toggle attendance-btn ${status === 'present' ? 'attendance-present' : 'attendance-none'}" 
                                  data-student="${student.id}" data-status="present" title="มา">
                            ม
                          </button>
                          <button class="attendance-toggle attendance-btn ${status === 'absent' ? 'attendance-absent' : 'attendance-none'}" 
                                  data-student="${student.id}" data-status="absent" title="ขาด">
                            ข
                          </button>
                          <button class="attendance-toggle attendance-btn ${status === 'late' ? 'attendance-late' : 'attendance-none'}" 
                                  data-student="${student.id}" data-status="late" title="สาย">
                            ส
                          </button>
                          <button class="attendance-toggle attendance-btn ${status === 'leave' ? 'attendance-leave' : 'attendance-none'}" 
                                  data-student="${student.id}" data-status="leave" title="ลา">
                            ล
                          </button>
                        </div>
                      </td>
                      <td class="text-center">
                        <span class="${getAttendancePercentageClass(stats.percentage)} font-medium">
                          ${stats.percentage}%
                        </span>
                        <span class="text-xs text-gray-400 block">${stats.present}/${stats.total}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Attendance History -->
        ${allDates.length > 0 ? `
          <div class="mt-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">ประวัติการเช็คชื่อ</h3>
            <div class="flex flex-wrap gap-2">
              ${allDates.slice(0, 14).map(date => {
                const isSelected = date === selectedDate;
                return `
                  <button class="history-date px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isSelected ? 
                      'bg-primary-600 text-white' : 
                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }" data-date="${date}">
                    ${formatDate(date)}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Summary Stats -->
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">สรุปภาพรวม</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${renderSummaryCards(students)}
          </div>
        </div>
      `}
    `;
    
    // Event Listeners
    document.getElementById('class-select')?.addEventListener('change', (e) => {
      selectedClass = e.target.value;
      render();
    });
    
    document.getElementById('date-input')?.addEventListener('change', (e) => {
      selectedDate = e.target.value;
      render();
    });
    
    // Individual attendance toggle
    document.querySelectorAll('.attendance-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const studentId = btn.dataset.student;
        const status = btn.dataset.status;
        
        attendanceStore.set(selectedClass, studentId, selectedDate, status);
        showToast('บันทึกเรียบร้อย', 'success');
        render();
      });
    });
    
    // Bulk attendance
    document.querySelectorAll('.bulk-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const status = btn.dataset.status;
        const studentStatuses = students.map(s => ({ studentId: s.id, status }));
        
        attendanceStore.bulkSet(selectedClass, selectedDate, studentStatuses);
        showToast(`เช็คชื่อทั้งหมดเป็น "${getAttendanceStatus(status).label}" แล้ว`, 'success');
        render();
      });
    });
    
    // History date click
    document.querySelectorAll('.history-date').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedDate = btn.dataset.date;
        document.getElementById('date-input').value = selectedDate;
        render();
      });
    });
  }
  
  function renderSummaryCards(students) {
    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalLeave = 0;
    
    students.forEach(student => {
      const records = attendanceStore.getByStudentClass(student.id, selectedClass);
      records.forEach(r => {
        if (r.status === 'present') totalPresent++;
        else if (r.status === 'absent') totalAbsent++;
        else if (r.status === 'late') totalLate++;
        else if (r.status === 'leave') totalLeave++;
      });
    });
    
    const total = totalPresent + totalAbsent + totalLate + totalLeave;
    
    return `
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <span class="text-green-600 dark:text-green-400 text-lg">✓</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">${totalPresent}</p>
            <p class="text-sm text-gray-500">มาเรียน</p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <span class="text-red-600 dark:text-red-400 text-lg">✗</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">${totalAbsent}</p>
            <p class="text-sm text-gray-500">ขาดเรียน</p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
            <span class="text-yellow-600 dark:text-yellow-400 text-lg">◐</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">${totalLate}</p>
            <p class="text-sm text-gray-500">มาสาย</p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <span class="text-blue-600 dark:text-blue-400 text-lg">○</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">${totalLeave}</p>
            <p class="text-sm text-gray-500">ลา</p>
          </div>
        </div>
      </div>
    `;
  }
}
