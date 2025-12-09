// ==========================================
// Students Page - CRUD for Students
// ==========================================

import { studentsStore, classesStore } from '../store.js';
import { showToast, showModal, closeModal, showConfirm, escapeHtml, filterBySearch } from '../utils.js';

let currentSearch = '';
let currentClassFilter = '';

export async function renderStudents(container) {
  render();
  
  function render() {
    const allStudents = studentsStore.getAll();
    const activeStudents = allStudents.filter(s => !s.isDeleted);
    const deletedStudents = allStudents.filter(s => s.isDeleted);
    const classes = classesStore.getActive();
    
    // Filter by search and class
    let filteredStudents = filterBySearch(activeStudents, currentSearch, ['name', 'studentId']);
    if (currentClassFilter) {
      filteredStudents = filteredStudents.filter(s => 
        s.enrolledClasses && s.enrolledClasses.includes(currentClassFilter)
      );
    }
    
    container.innerHTML = `
      <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="page-title">นักเรียน</h1>
          <p class="page-subtitle">จัดการรายชื่อนักเรียนทั้งหมด</p>
        </div>
        <button id="add-student-btn" class="btn-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
          เพิ่มนักเรียน
        </button>
      </div>
      
      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="relative flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            type="text" 
            id="search-input" 
            class="input pl-10" 
            placeholder="ค้นหานักเรียน..."
            value="${escapeHtml(currentSearch)}"
          >
        </div>
        <select id="class-filter" class="select max-w-xs">
          <option value="">ทุกวิชา</option>
          ${classes.map(cls => `
            <option value="${cls.id}" ${currentClassFilter === cls.id ? 'selected' : ''}>
              ${escapeHtml(cls.name)}
            </option>
          `).join('')}
        </select>
      </div>
      
      <!-- Students List -->
      ${filteredStudents.length === 0 && !currentSearch && !currentClassFilter ? `
        <div class="card">
          <div class="empty-state py-12">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <p class="empty-state-title">ยังไม่มีนักเรียน</p>
            <p class="empty-state-description">เริ่มต้นโดยการเพิ่มนักเรียนคนแรก</p>
          </div>
        </div>
      ` : filteredStudents.length === 0 ? `
        <div class="card">
          <div class="empty-state py-12">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p class="empty-state-title">ไม่พบนักเรียนที่ค้นหา</p>
          </div>
        </div>
      ` : `
        <div class="card overflow-hidden">
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>รหัสนักเรียน</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>วิชาที่ลงทะเบียน</th>
                  <th class="text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                ${filteredStudents.map(student => {
                  const enrolledClasses = (student.enrolledClasses || [])
                    .map(id => classesStore.getById(id))
                    .filter(c => c && !c.isDeleted);
                  
                  return `
                    <tr>
                      <td class="font-mono">${escapeHtml(student.studentId)}</td>
                      <td class="font-medium">${escapeHtml(student.name)}</td>
                      <td>
                        ${enrolledClasses.length === 0 ? 
                          '<span class="text-gray-400 text-sm">ยังไม่ได้ลงทะเบียน</span>' :
                          enrolledClasses.map(c => `
                            <span class="badge-info mr-1 mb-1">${escapeHtml(c.name)}</span>
                          `).join('')
                        }
                      </td>
                      <td class="text-right">
                        <div class="flex items-center justify-end gap-1">
                          <button class="enroll-btn p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30" data-id="${student.id}" title="ลงทะเบียนวิชา">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                          </button>
                          <button class="edit-btn p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30" data-id="${student.id}" title="แก้ไข">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          <button class="delete-btn p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" data-id="${student.id}" title="ลบ">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          แสดง ${filteredStudents.length} จาก ${activeStudents.length} คน
        </div>
      `}
      
      <!-- Deleted Students -->
      ${deletedStudents.length > 0 ? `
        <div class="mt-8">
          <button id="toggle-deleted" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <svg class="w-4 h-4 transition-transform" id="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
            นักเรียนที่ลบแล้ว (${deletedStudents.length})
          </button>
          <div id="deleted-section" class="hidden mt-4 space-y-2">
            ${deletedStudents.map(s => `
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl opacity-60">
                <div>
                  <span class="font-mono text-sm mr-2">${escapeHtml(s.studentId)}</span>
                  <span class="font-medium text-gray-700 dark:text-gray-300">${escapeHtml(s.name)}</span>
                </div>
                <div class="flex items-center gap-2">
                  <button class="restore-btn btn-sm btn-secondary" data-id="${s.id}">กู้คืน</button>
                  <button class="hard-delete-btn btn-sm btn-danger" data-id="${s.id}">ลบถาวร</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
    
    // Event Listeners
    document.getElementById('add-student-btn').addEventListener('click', () => openStudentModal());
    
    document.getElementById('search-input').addEventListener('input', (e) => {
      currentSearch = e.target.value;
      render();
    });
    
    document.getElementById('class-filter').addEventListener('change', (e) => {
      currentClassFilter = e.target.value;
      render();
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const student = studentsStore.getById(btn.dataset.id);
        if (student) openStudentModal(student);
      });
    });
    
    document.querySelectorAll('.enroll-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const student = studentsStore.getById(btn.dataset.id);
        if (student) openEnrollModal(student);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const student = studentsStore.getById(btn.dataset.id);
        showConfirm(`ต้องการลบนักเรียน "${student.name}" หรือไม่?`, () => {
          studentsStore.delete(btn.dataset.id);
          showToast('ลบนักเรียนแล้ว', 'success');
          render();
        });
      });
    });
    
    document.querySelectorAll('.restore-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        studentsStore.restore(btn.dataset.id);
        showToast('กู้คืนนักเรียนแล้ว', 'success');
        render();
      });
    });
    
    document.querySelectorAll('.hard-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirm('ลบถาวรจะไม่สามารถกู้คืนได้ ต้องการดำเนินการหรือไม่?', () => {
          studentsStore.hardDelete(btn.dataset.id);
          showToast('ลบนักเรียนถาวรแล้ว', 'success');
          render();
        });
      });
    });
    
    // Toggle deleted section
    const toggleBtn = document.getElementById('toggle-deleted');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const section = document.getElementById('deleted-section');
        const icon = document.getElementById('toggle-icon');
        section.classList.toggle('hidden');
        icon.style.transform = section.classList.contains('hidden') ? '' : 'rotate(180deg)';
      });
    }
  }
  
  function openStudentModal(student = null) {
    const isEdit = !!student;
    
    const content = `
      <form id="student-form" class="space-y-4">
        <div>
          <label class="label">รหัสนักเรียน <span class="text-red-500">*</span></label>
          <input type="text" name="studentId" class="input" placeholder="เช่น 65001" value="${student ? escapeHtml(student.studentId) : ''}" required>
        </div>
        <div>
          <label class="label">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
          <input type="text" name="name" class="input" placeholder="เช่น สมชาย ใจดี" value="${student ? escapeHtml(student.name) : ''}" required>
        </div>
        <div>
          <label class="label">อีเมล</label>
          <input type="email" name="email" class="input" placeholder="email@example.com" value="${student?.email ? escapeHtml(student.email) : ''}">
        </div>
        <div>
          <label class="label">หมายเหตุ</label>
          <textarea name="note" class="input" rows="2">${student?.note ? escapeHtml(student.note) : ''}</textarea>
        </div>
      </form>
    `;
    
    showModal({
      title: isEdit ? 'แก้ไขนักเรียน' : 'เพิ่มนักเรียนใหม่',
      content,
      confirmText: isEdit ? 'บันทึก' : 'เพิ่มนักเรียน',
      onConfirm: () => {
        const form = document.getElementById('student-form');
        const formData = new FormData(form);
        
        const data = {
          studentId: formData.get('studentId').trim(),
          name: formData.get('name').trim(),
          email: formData.get('email').trim(),
          note: formData.get('note').trim()
        };
        
        if (!data.studentId || !data.name) {
          showToast('กรุณากรอกข้อมูลที่จำเป็น', 'error');
          return;
        }
        
        if (isEdit) {
          studentsStore.update(student.id, data);
          showToast('แก้ไขนักเรียนเรียบร้อย', 'success');
        } else {
          studentsStore.create(data);
          showToast('เพิ่มนักเรียนเรียบร้อย', 'success');
        }
        closeModal();
        render();
      }
    });
  }
  
  function openEnrollModal(student) {
    const classes = classesStore.getActive();
    const enrolledIds = student.enrolledClasses || [];
    
    const content = `
      <form id="enroll-form" class="space-y-4">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          เลือกวิชาที่ต้องการลงทะเบียนให้ <strong>${escapeHtml(student.name)}</strong>
        </p>
        ${classes.length === 0 ? `
          <div class="text-center py-4 text-gray-500">
            ยังไม่มีวิชา <a href="#/classes" class="text-primary-600 hover:underline">เพิ่มวิชา</a>
          </div>
        ` : `
          <div class="space-y-2 max-h-64 overflow-y-auto">
            ${classes.map(cls => `
              <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="classes" 
                  value="${cls.id}" 
                  ${enrolledIds.includes(cls.id) ? 'checked' : ''}
                  class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                >
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">${escapeHtml(cls.name)}</p>
                  <p class="text-sm text-gray-500">${escapeHtml(cls.code)} • ${cls.year}/${cls.semester}</p>
                </div>
              </label>
            `).join('')}
          </div>
        `}
      </form>
    `;
    
    showModal({
      title: 'ลงทะเบียนวิชา',
      content,
      confirmText: 'บันทึก',
      onConfirm: () => {
        const form = document.getElementById('enroll-form');
        const checkboxes = form.querySelectorAll('input[name="classes"]:checked');
        const selectedClasses = Array.from(checkboxes).map(cb => cb.value);
        
        studentsStore.update(student.id, { enrolledClasses: selectedClasses });
        showToast('บันทึกการลงทะเบียนแล้ว', 'success');
        closeModal();
        render();
      }
    });
  }
}
