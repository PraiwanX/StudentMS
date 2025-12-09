// ==========================================
// Grades Page - Scores & Grade Calculation
// ==========================================

import { classesStore, studentsStore, scoreUnitsStore, scoresStore, attendanceStore, importHelpers } from '../store.js';
import { showToast, showModal, closeModal, showConfirm, escapeHtml, calculateGrade, getGradeClass, getAttendancePercentageClass } from '../utils.js';

let selectedClass = '';

export async function renderGrades(container) {
  const classes = classesStore.getActive();
  
  if (!selectedClass && classes.length > 0) {
    selectedClass = classes[0].id;
  }
  
  render();
  
  function render() {
    const currentClass = classesStore.getById(selectedClass);
    const students = selectedClass ? studentsStore.getByClass(selectedClass) : [];
    const scoreUnits = selectedClass ? scoreUnitsStore.getByClass(selectedClass) : [];
    const totalWeight = scoreUnitsStore.getTotalWeight(selectedClass);
    
    container.innerHTML = `
      <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="page-title">📊 คะแนน/เกรด</h1>
          <p class="page-subtitle">จัดการคะแนนและคำนวณเกรด</p>
        </div>
        ${selectedClass ? `
          <div class="flex gap-2">
            <button id="import-csv-btn" class="btn-secondary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Import CSV
            </button>
            <button id="add-unit-btn" class="btn-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              เพิ่มหน่วยคะแนน
            </button>
          </div>
        ` : ''}
      </div>
      
      <!-- Class Selector -->
      <div class="card mb-6">
        <div class="p-4">
          <label class="label">เลือกวิชา</label>
          <select id="class-select" class="select max-w-md">
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
      </div>
      
      ${!selectedClass || classes.length === 0 ? `
        <div class="card">
          <div class="empty-state py-12">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <p class="empty-state-title">ยังไม่มีวิชา</p>
            <p class="empty-state-description"><a href="#/classes" class="text-primary-600 hover:underline">เพิ่มวิชา</a>ก่อนใส่คะแนน</p>
          </div>
        </div>
      ` : `
        <!-- Weight Warning -->
        ${totalWeight !== 100 ? `
          <div class="mb-4 p-4 rounded-xl ${totalWeight > 100 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 ${totalWeight > 100 ? 'text-red-500' : 'text-yellow-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span class="${totalWeight > 100 ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}">
                น้ำหนักคะแนนรวม ${totalWeight}% ${totalWeight > 100 ? '(เกิน 100%)' : '(ควรรวมเป็น 100%)'}
              </span>
            </div>
          </div>
        ` : ''}
        
        <!-- Score Units -->
        <div class="card mb-6">
          <div class="card-header flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white">หน่วยคะแนน</h2>
            <span class="text-sm text-gray-500">รวม ${totalWeight}%</span>
          </div>
          <div class="card-body">
            ${scoreUnits.length === 0 ? `
              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>ยังไม่มีหน่วยคะแนน</p>
                <p class="text-sm mt-1">เพิ่มหน่วยคะแนน เช่น คะแนนสอบ, งาน, Quiz ฯลฯ</p>
              </div>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${scoreUnits.map(unit => `
                  <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 group">
                    <div class="flex items-start justify-between mb-2">
                      <h4 class="font-medium text-gray-900 dark:text-white">${escapeHtml(unit.name)}</h4>
                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="edit-unit-btn p-1 rounded text-gray-400 hover:text-primary-600" data-id="${unit.id}">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <button class="delete-unit-btn p-1 rounded text-gray-400 hover:text-red-600" data-id="${unit.id}">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-500">
                      <span>เต็ม ${unit.maxScore} คะแนน</span>
                      <span class="badge-info">${unit.weight}%</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
        
        <!-- Scores Table -->
        ${students.length === 0 ? `
          <div class="card">
            <div class="empty-state py-12">
              <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              <p class="empty-state-title">ไม่มีนักเรียนในวิชานี้</p>
              <a href="#/students" class="text-primary-600 hover:underline">ลงทะเบียนนักเรียน</a>
            </div>
          </div>
        ` : scoreUnits.length === 0 ? `
          <div class="card">
            <div class="empty-state py-12">
              <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <p class="empty-state-title">ยังไม่มีหน่วยคะแนน</p>
              <p class="empty-state-description">เพิ่มหน่วยคะแนนก่อนใส่คะแนนนักเรียน</p>
            </div>
          </div>
        ` : `
          <div class="card overflow-hidden">
            <div class="card-header">
              <h2 class="font-semibold text-gray-900 dark:text-white">ตารางคะแนน</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="table min-w-max">
                <thead>
                  <tr>
                    <th class="sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">#</th>
                    <th class="sticky left-8 bg-gray-50 dark:bg-gray-800 z-10">ชื่อ</th>
                    ${scoreUnits.map(unit => `
                      <th class="text-center whitespace-nowrap">
                        ${escapeHtml(unit.name)}<br>
                        <span class="text-xs font-normal text-gray-400">(${unit.maxScore})</span>
                      </th>
                    `).join('')}
                    <th class="text-center">% เข้าเรียน</th>
                    <th class="text-center">รวม %</th>
                    <th class="text-center">เกรด</th>
                  </tr>
                </thead>
                <tbody>
                  ${students.map((student, index) => {
                    const scoreResult = scoresStore.calculateTotal(student.id, selectedClass);
                    const attendanceStats = attendanceStore.calculatePercentage(student.id, selectedClass);
                    const grade = calculateGrade(scoreResult.percentage);
                    
                    return `
                      <tr>
                        <td class="sticky left-0 bg-white dark:bg-gray-800 text-gray-500">${index + 1}</td>
                        <td class="sticky left-8 bg-white dark:bg-gray-800 font-medium whitespace-nowrap">
                          ${escapeHtml(student.name)}
                        </td>
                        ${scoreUnits.map(unit => {
                          const scoreRecords = scoresStore.getByUnit(unit.id);
                          const studentScore = scoreRecords.find(s => s.studentId === student.id);
                          const score = studentScore ? studentScore.score : '';
                          
                          return `
                            <td class="text-center p-1">
                              <input 
                                type="number" 
                                class="score-input w-16 px-2 py-1 text-center rounded border border-gray-200 dark:border-gray-600 
                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                data-student="${student.id}"
                                data-unit="${unit.id}"
                                data-max="${unit.maxScore}"
                                value="${score}"
                                min="0"
                                max="${unit.maxScore}"
                                step="0.5"
                              >
                            </td>
                          `;
                        }).join('')}
                        <td class="text-center">
                          <span class="${getAttendancePercentageClass(attendanceStats.percentage)}">
                            ${attendanceStats.percentage}%
                          </span>
                        </td>
                        <td class="text-center font-medium">${scoreResult.percentage}%</td>
                        <td class="text-center">
                          <span class="text-2xl font-bold ${getGradeClass(grade)}">${grade}</span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Grade Summary -->
          <div class="mt-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">สรุปเกรด</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              ${renderGradeSummary(students)}
            </div>
          </div>
        `}
      `}
    `;
    
    // Event Listeners
    document.getElementById('class-select')?.addEventListener('change', (e) => {
      selectedClass = e.target.value;
      render();
    });
    
    document.getElementById('add-unit-btn')?.addEventListener('click', () => openUnitModal());
    
    document.getElementById('import-csv-btn')?.addEventListener('click', () => openImportModal());
    
    document.querySelectorAll('.edit-unit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const unit = scoreUnitsStore.getById(btn.dataset.id);
        if (unit) openUnitModal(unit);
      });
    });
    
    document.querySelectorAll('.delete-unit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const unit = scoreUnitsStore.getById(btn.dataset.id);
        showConfirm(`ลบหน่วยคะแนน "${unit.name}" จะลบคะแนนทั้งหมดในหน่วยนี้ด้วย`, () => {
          scoreUnitsStore.delete(btn.dataset.id);
          showToast('ลบหน่วยคะแนนแล้ว', 'success');
          render();
        });
      });
    });
    
    // Score input
    document.querySelectorAll('.score-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const studentId = e.target.dataset.student;
        const unitId = e.target.dataset.unit;
        const maxScore = parseFloat(e.target.dataset.max);
        let score = parseFloat(e.target.value) || 0;
        
        // Validate
        if (score < 0) score = 0;
        if (score > maxScore) score = maxScore;
        e.target.value = score;
        
        scoresStore.set(studentId, unitId, score);
        
        // Update totals
        render();
      });
      
      // Auto-select on focus
      input.addEventListener('focus', (e) => e.target.select());
    });
  }
  
  // ==========================================
  // Import CSV Modal
  // ==========================================
  
  function openImportModal() {
    const scoreUnits = scoreUnitsStore.getByClass(selectedClass);
    
    if (scoreUnits.length === 0) {
      showToast('กรุณาเพิ่มหน่วยคะแนนก่อน Import', 'warning');
      return;
    }
    
    const content = `
      <div class="space-y-4">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h4 class="font-medium text-blue-700 dark:text-blue-300 mb-2">📋 รูปแบบไฟล์ CSV</h4>
          <p class="text-sm text-blue-600 dark:text-blue-400">ไฟล์ CSV ต้องมีคอลัมน์:</p>
          <ul class="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside mt-1">
            <li><strong>รหัสนักเรียน</strong> - ต้องตรงกับในระบบ</li>
            <li><strong>คะแนน</strong> - ตัวเลข</li>
          </ul>
        </div>
        
        <div>
          <label class="label">เลือกหน่วยคะแนนที่จะ Import <span class="text-red-500">*</span></label>
          <select id="import-unit" class="select">
            ${scoreUnits.map(unit => `
              <option value="${unit.id}">${escapeHtml(unit.name)} (เต็ม ${unit.maxScore})</option>
            `).join('')}
          </select>
        </div>
        
        <div>
          <label class="label">ไฟล์ CSV <span class="text-red-500">*</span></label>
          <input type="file" id="csv-file" accept=".csv,.txt" class="input">
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">คอลัมน์รหัสนักเรียน</label>
            <input type="text" id="col-student-id" class="input" value="รหัสนักเรียน" placeholder="ชื่อคอลัมน์">
          </div>
          <div>
            <label class="label">คอลัมน์คะแนน</label>
            <input type="text" id="col-score" class="input" value="คะแนน" placeholder="ชื่อคอลัมน์">
          </div>
        </div>
        
        <div id="import-preview" class="hidden">
          <label class="label">Preview</label>
          <div id="preview-content" class="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-sm font-mono"></div>
        </div>
        
        <div id="import-result" class="hidden"></div>
      </div>
    `;
    
    showModal({
      title: '📥 Import คะแนนจาก CSV',
      content,
      confirmText: 'Import',
      onConfirm: () => {
        const fileInput = document.getElementById('csv-file');
        const unitId = document.getElementById('import-unit').value;
        const studentIdCol = document.getElementById('col-student-id').value.trim();
        const scoreCol = document.getElementById('col-score').value.trim();
        
        if (!fileInput.files[0]) {
          showToast('กรุณาเลือกไฟล์', 'error');
          return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const csvContent = e.target.result;
            const parsedData = importHelpers.parseCSV(csvContent);
            
            if (parsedData.length === 0) {
              showToast('ไฟล์ว่างหรือรูปแบบไม่ถูกต้อง', 'error');
              return;
            }
            
            const result = importHelpers.importScores(parsedData, selectedClass, unitId, {
              studentIdColumn: studentIdCol,
              scoreColumn: scoreCol
            });
            
            if (result.imported > 0) {
              showToast(`Import สำเร็จ ${result.imported} รายการ`, 'success');
              closeModal();
              render();
            }
            
            if (result.errors.length > 0) {
              console.warn('Import errors:', result.errors);
              showToast(`มีข้อผิดพลาด ${result.errors.length} รายการ`, 'warning');
            }
            
          } catch (error) {
            console.error('Import error:', error);
            showToast('เกิดข้อผิดพลาดในการ Import', 'error');
          }
        };
        
        reader.readAsText(file);
      }
    });
    
    // Preview file
    setTimeout(() => {
      document.getElementById('csv-file')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
          const lines = ev.target.result.split('\n').slice(0, 5);
          const previewDiv = document.getElementById('import-preview');
          const contentDiv = document.getElementById('preview-content');
          
          if (previewDiv && contentDiv) {
            previewDiv.classList.remove('hidden');
            contentDiv.innerHTML = lines.map(line => escapeHtml(line)).join('<br>');
          }
        };
        reader.readAsText(file);
      });
    }, 100);
  }
  
  function openUnitModal(unit = null) {
    const isEdit = !!unit;
    
    const content = `
      <form id="unit-form" class="space-y-4">
        <div>
          <label class="label">ชื่อหน่วยคะแนน <span class="text-red-500">*</span></label>
          <input type="text" name="name" class="input" placeholder="เช่น สอบกลางภาค, งาน, Quiz" value="${unit ? escapeHtml(unit.name) : ''}" required>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">คะแนนเต็ม <span class="text-red-500">*</span></label>
            <input type="number" name="maxScore" class="input" value="${unit ? unit.maxScore : 100}" min="1" required>
          </div>
          <div>
            <label class="label">น้ำหนัก (%) <span class="text-red-500">*</span></label>
            <input type="number" name="weight" class="input" value="${unit ? unit.weight : 20}" min="1" max="100" required>
          </div>
        </div>
        <div>
          <label class="label">หมายเหตุ</label>
          <textarea name="note" class="input" rows="2">${unit?.note ? escapeHtml(unit.note) : ''}</textarea>
        </div>
      </form>
    `;
    
    showModal({
      title: isEdit ? 'แก้ไขหน่วยคะแนน' : 'เพิ่มหน่วยคะแนน',
      content,
      confirmText: isEdit ? 'บันทึก' : 'เพิ่ม',
      onConfirm: () => {
        const form = document.getElementById('unit-form');
        const formData = new FormData(form);
        
        const data = {
          classId: selectedClass,
          name: formData.get('name').trim(),
          maxScore: parseFloat(formData.get('maxScore')) || 100,
          weight: parseFloat(formData.get('weight')) || 20,
          note: formData.get('note').trim()
        };
        
        if (!data.name) {
          showToast('กรุณากรอกชื่อหน่วยคะแนน', 'error');
          return;
        }
        
        if (isEdit) {
          scoreUnitsStore.update(unit.id, data);
          showToast('แก้ไขหน่วยคะแนนแล้ว', 'success');
        } else {
          scoreUnitsStore.create(data);
          showToast('เพิ่มหน่วยคะแนนแล้ว', 'success');
        }
        closeModal();
        render();
      }
    });
  }
  
  function renderGradeSummary(students) {
    const gradeCounts = { 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0 };
    
    students.forEach(student => {
      const { percentage } = scoresStore.calculateTotal(student.id, selectedClass);
      if (percentage > 0) {
        const grade = calculateGrade(percentage);
        gradeCounts[grade]++;
      }
    });
    
    const grades = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
    
    return grades.map(grade => `
      <div class="card p-3 text-center">
        <span class="text-2xl font-bold ${getGradeClass(grade)}">${grade}</span>
        <p class="text-lg font-semibold text-gray-900 dark:text-white mt-1">${gradeCounts[grade]}</p>
        <p class="text-xs text-gray-500">คน</p>
      </div>
    `).join('');
  }
}
