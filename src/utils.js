// ==========================================
// Utility Functions
// ==========================================

import { settingsStore } from './store.js';

// ==========================================
// Date Utilities
// ==========================================

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateInput(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getThaiMonth(month) {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return months[month];
}

export function getDayName(dateStr) {
  const date = new Date(dateStr);
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  return days[date.getDay()];
}

// ==========================================
// Grade Calculation
// ==========================================

export function calculateGrade(percentage) {
  const gradeScale = settingsStore.getGradeScale();
  
  if (percentage >= gradeScale['A']) return 'A';
  if (percentage >= gradeScale['B+']) return 'B+';
  if (percentage >= gradeScale['B']) return 'B';
  if (percentage >= gradeScale['C+']) return 'C+';
  if (percentage >= gradeScale['C']) return 'C';
  if (percentage >= gradeScale['D+']) return 'D+';
  if (percentage >= gradeScale['D']) return 'D';
  return 'F';
}

export function getGradeClass(grade) {
  if (grade === 'A') return 'grade-a';
  if (grade.startsWith('B')) return 'grade-b';
  if (grade.startsWith('C')) return 'grade-c';
  if (grade.startsWith('D')) return 'grade-d';
  return 'grade-f';
}

export function getGradePoint(grade) {
  const points = {
    'A': 4.0,
    'B+': 3.5,
    'B': 3.0,
    'C+': 2.5,
    'C': 2.0,
    'D+': 1.5,
    'D': 1.0,
    'F': 0.0
  };
  return points[grade] || 0;
}

// ==========================================
// Attendance Utilities
// ==========================================

export function getAttendanceStatus(status) {
  const statuses = {
    'present': { label: 'มา', short: 'ม', class: 'attendance-present', icon: '✓' },
    'absent': { label: 'ขาด', short: 'ข', class: 'attendance-absent', icon: '✗' },
    'late': { label: 'สาย', short: 'ส', class: 'attendance-late', icon: '◐' },
    'leave': { label: 'ลา', short: 'ล', class: 'attendance-leave', icon: '○' }
  };
  return statuses[status] || { label: '-', short: '-', class: 'attendance-none', icon: '-' };
}

export function getAttendancePercentageClass(percentage) {
  if (percentage >= 80) return 'text-green-600 dark:text-green-400';
  if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

// ==========================================
// Validation Utilities
// ==========================================

export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `กรุณากรอก${fieldName}`;
  }
  return null;
}

export function validateNumber(value, fieldName, min = 0, max = Infinity) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return `${fieldName}ต้องเป็นตัวเลข`;
  }
  if (num < min) {
    return `${fieldName}ต้องมากกว่าหรือเท่ากับ ${min}`;
  }
  if (num > max) {
    return `${fieldName}ต้องน้อยกว่าหรือเท่ากับ ${max}`;
  }
  return null;
}

// ==========================================
// DOM Utilities
// ==========================================

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child) {
      element.appendChild(child);
    }
  });
  
  return element;
}

// ==========================================
// Toast Notifications
// ==========================================

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  
  const icons = {
    success: '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
    error: '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
    warning: '<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
    info: '<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };
  
  const toast = createElement('div', {
    className: `toast toast-${type}`
  });
  
  toast.innerHTML = `
    ${icons[type]}
    <span class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(message)}</span>
    <button class="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onclick="this.parentElement.remove()">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==========================================
// Modal
// ==========================================

export function showModal({ title, content, onConfirm, confirmText = 'บันทึก', showCancel = true, size = 'md' }) {
  const container = document.getElementById('modal-container');
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  const modal = createElement('div', {
    className: 'modal-backdrop',
    onclick: (e) => {
      if (e.target === modal) closeModal();
    }
  });
  
  modal.innerHTML = `
    <div class="modal ${sizeClasses[size]}">
      <div class="modal-header">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${escapeHtml(title)}</h3>
        <button id="modal-close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        ${typeof content === 'string' ? content : ''}
      </div>
      <div class="modal-footer">
        ${showCancel ? '<button id="modal-cancel" class="btn-secondary">ยกเลิก</button>' : ''}
        <button id="modal-confirm" class="btn-primary">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;
  
  // If content is an element, append it
  if (typeof content !== 'string') {
    modal.querySelector('.modal-body').appendChild(content);
  }
  
  container.appendChild(modal);
  
  // Event listeners
  modal.querySelector('#modal-close').addEventListener('click', closeModal);
  if (showCancel) {
    modal.querySelector('#modal-cancel').addEventListener('click', closeModal);
  }
  modal.querySelector('#modal-confirm').addEventListener('click', () => {
    if (onConfirm) onConfirm();
  });
  
  // Focus first input if exists
  const firstInput = modal.querySelector('input, select, textarea');
  if (firstInput) firstInput.focus();
  
  return modal;
}

export function closeModal() {
  const container = document.getElementById('modal-container');
  const modal = container.querySelector('.modal-backdrop');
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 200);
  }
}

// ==========================================
// Confirm Dialog
// ==========================================

export function showConfirm(message, onConfirm) {
  showModal({
    title: 'ยืนยันการดำเนินการ',
    content: `<p class="text-gray-600 dark:text-gray-400">${escapeHtml(message)}</p>`,
    confirmText: 'ยืนยัน',
    onConfirm: () => {
      closeModal();
      if (onConfirm) onConfirm();
    }
  });
}

// ==========================================
// Search/Filter
// ==========================================

export function filterBySearch(items, searchTerm, fields) {
  if (!searchTerm) return items;
  const term = searchTerm.toLowerCase();
  return items.filter(item => 
    fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(term);
    })
  );
}

// ==========================================
// Semester Utilities
// ==========================================

export function getSemesterLabel(semester) {
  const semesters = {
    '1': 'เทอม 1',
    '2': 'เทอม 2',
    '3': 'เทอมฤดูร้อน'
  };
  return semesters[semester] || semester;
}

export function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Thai academic year starts around May
  return month >= 4 ? year + 543 : year + 542;
}

export function getCurrentSemester() {
  const now = new Date();
  const month = now.getMonth();
  // Semester 1: May-Sep, Semester 2: Oct-Feb, Summer: Mar-Apr
  if (month >= 4 && month <= 8) return '1';
  if (month >= 9 || month <= 1) return '2';
  return '3';
}
