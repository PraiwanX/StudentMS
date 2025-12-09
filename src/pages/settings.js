// ==========================================
// Settings Page - Export/Import & Configuration
// ==========================================

import { settingsStore, dataStore } from '../store.js';
import { showToast, showModal, closeModal, showConfirm, escapeHtml } from '../utils.js';

export async function renderSettings(container) {
  const settings = settingsStore.get();
  const gradeScale = settings.gradeScale;
  
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">ตั้งค่า</h1>
      <p class="page-subtitle">จัดการการตั้งค่าระบบ</p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Export/Import -->
      <div class="card">
        <div class="card-header">
          <h2 class="font-semibold text-gray-900 dark:text-white">สำรอง/กู้คืนข้อมูล</h2>
        </div>
        <div class="card-body space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Export ข้อมูลเป็นไฟล์ JSON เพื่อสำรองหรือย้ายไปเครื่องอื่น
          </p>
          
          <div class="flex flex-col sm:flex-row gap-3">
            <button id="export-btn" class="btn-primary flex-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Export ข้อมูล
            </button>
            
            <label class="btn-secondary flex-1 cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Import ข้อมูล
              <input type="file" id="import-input" accept=".json" class="hidden">
            </label>
          </div>
          
          <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div class="text-sm text-yellow-700 dark:text-yellow-300">
                <p class="font-medium">คำเตือน</p>
                <p>การ Import จะ<strong>แทนที่</strong>ข้อมูลทั้งหมดที่มีอยู่</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Grade Scale -->
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 dark:text-white">เกณฑ์เกรด</h2>
          <button id="reset-grade-btn" class="btn-ghost btn-sm">รีเซ็ต</button>
        </div>
        <div class="card-body">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            กำหนดคะแนนขั้นต่ำสำหรับแต่ละเกรด (%)
          </p>
          
          <form id="grade-form" class="space-y-3">
            ${['A', 'B+', 'B', 'C+', 'C', 'D+', 'D'].map(grade => `
              <div class="flex items-center gap-4">
                <span class="w-12 text-lg font-bold ${getGradeColorClass(grade)}">${grade}</span>
                <input 
                  type="number" 
                  name="grade_${grade.replace('+', 'plus')}" 
                  class="input flex-1" 
                  value="${gradeScale[grade]}"
                  min="0" 
                  max="100"
                >
                <span class="text-sm text-gray-500">% ขึ้นไป</span>
              </div>
            `).join('')}
            <div class="flex items-center gap-4">
              <span class="w-12 text-lg font-bold text-red-600 dark:text-red-400">F</span>
              <span class="text-sm text-gray-500">ต่ำกว่า ${gradeScale['D']}%</span>
            </div>
            
            <button type="submit" class="btn-primary w-full mt-4">บันทึกเกณฑ์เกรด</button>
          </form>
        </div>
      </div>
      
      <!-- Clear Data -->
      <div class="card">
        <div class="card-header">
          <h2 class="font-semibold text-gray-900 dark:text-white">ลบข้อมูล</h2>
        </div>
        <div class="card-body space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            ลบข้อมูลทั้งหมดในระบบ (ไม่สามารถกู้คืนได้)
          </p>
          
          <button id="clear-all-btn" class="btn-danger">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            ลบข้อมูลทั้งหมด
          </button>
        </div>
      </div>
      
      <!-- About -->
      <div class="card">
        <div class="card-header">
          <h2 class="font-semibold text-gray-900 dark:text-white">เกี่ยวกับ</h2>
        </div>
        <div class="card-body">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">StudentMS</h3>
              <p class="text-sm text-gray-500">ระบบจัดการนักเรียน v1.0</p>
            </div>
          </div>
          
          <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>✓ เช็คชื่อนักเรียนรายวัน</p>
            <p>✓ คำนวณ % การเข้าเรียน</p>
            <p>✓ จัดการคะแนนและเกรด</p>
            <p>✓ Export/Import ข้อมูล</p>
          </div>
          
          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p class="text-xs text-gray-400">
              ข้อมูลถูกเก็บใน Browser ของคุณ (localStorage)
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Export
  document.getElementById('export-btn').addEventListener('click', () => {
    const data = dataStore.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export ข้อมูลเรียบร้อย', 'success');
  });
  
  // Import
  document.getElementById('import-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        showConfirm('การ Import จะแทนที่ข้อมูลทั้งหมด ต้องการดำเนินการหรือไม่?', () => {
          if (dataStore.importAll(data)) {
            showToast('Import ข้อมูลเรียบร้อย', 'success');
            window.location.reload();
          } else {
            showToast('เกิดข้อผิดพลาดในการ Import', 'error');
          }
        });
      } catch (error) {
        showToast('ไฟล์ไม่ถูกต้อง', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
  
  // Grade form
  document.getElementById('grade-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const newScale = {
      'A': parseInt(formData.get('grade_A')) || 80,
      'B+': parseInt(formData.get('grade_Bplus')) || 75,
      'B': parseInt(formData.get('grade_B')) || 70,
      'C+': parseInt(formData.get('grade_Cplus')) || 65,
      'C': parseInt(formData.get('grade_C')) || 60,
      'D+': parseInt(formData.get('grade_Dplus')) || 55,
      'D': parseInt(formData.get('grade_D')) || 50,
      'F': 0
    };
    
    settingsStore.setGradeScale(newScale);
    showToast('บันทึกเกณฑ์เกรดแล้ว', 'success');
  });
  
  // Reset grade
  document.getElementById('reset-grade-btn').addEventListener('click', () => {
    showConfirm('รีเซ็ตเกณฑ์เกรดเป็นค่าเริ่มต้น?', () => {
      settingsStore.setGradeScale({
        'A': 80, 'B+': 75, 'B': 70, 'C+': 65, 'C': 60, 'D+': 55, 'D': 50, 'F': 0
      });
      showToast('รีเซ็ตเกณฑ์เกรดแล้ว', 'success');
      renderSettings(container);
    });
  });
  
  // Clear all
  document.getElementById('clear-all-btn').addEventListener('click', () => {
    showModal({
      title: 'ยืนยันการลบข้อมูลทั้งหมด',
      content: `
        <div class="text-center py-4">
          <div class="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            การดำเนินการนี้จะลบข้อมูลทั้งหมดรวมถึง:
          </p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>• วิชาทั้งหมด</li>
            <li>• นักเรียนทั้งหมด</li>
            <li>• ประวัติการเช็คชื่อทั้งหมด</li>
            <li>• คะแนนทั้งหมด</li>
          </ul>
          <p class="text-red-600 font-medium mt-4">ไม่สามารถกู้คืนได้!</p>
        </div>
      `,
      confirmText: 'ลบทั้งหมด',
      onConfirm: () => {
        dataStore.clearAll();
        showToast('ลบข้อมูลทั้งหมดแล้ว', 'success');
        closeModal();
        window.location.hash = '#/';
        window.location.reload();
      }
    });
  });
}

function getGradeColorClass(grade) {
  if (grade === 'A') return 'text-green-600 dark:text-green-400';
  if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
  if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
  if (grade.startsWith('D')) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}
