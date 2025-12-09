// ==========================================
// Classes Page - CRUD for Subjects
// ==========================================

import { classesStore, studentsStore } from '../store.js';
import { showToast, showModal, closeModal, showConfirm, escapeHtml, filterBySearch, getSemesterLabel, getCurrentAcademicYear, getCurrentSemester } from '../utils.js';

let currentSearch = '';

export async function renderClasses(container) {
  render();
  
  function render() {
    const allClasses = classesStore.getAll();
    const activeClasses = allClasses.filter(c => !c.isDeleted);
    const deletedClasses = allClasses.filter(c => c.isDeleted);
    
    // Filter by search
    const filteredClasses = filterBySearch(activeClasses, currentSearch, ['name', 'code']);
    
    container.innerHTML = `
      <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="page-title">วิชาเรียน</h1>
          <p class="page-subtitle">จัดการรายวิชาทั้งหมด</p>
        </div>
        <button id="add-class-btn" class="btn-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          เพิ่มวิชา
        </button>
      </div>
      
      <!-- Search -->
      <div class="mb-6">
        <div class="relative max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            type="text" 
            id="search-input" 
            class="input pl-10" 
            placeholder="ค้นหาวิชา..."
            value="${escapeHtml(currentSearch)}"
          >
        </div>
      </div>
      
      <!-- Classes List -->
      ${filteredClasses.length === 0 && !currentSearch ? `
        <div class="card">
          <div class="empty-state py-12">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p class="empty-state-title">ยังไม่มีวิชาเรียน</p>
            <p class="empty-state-description">เริ่มต้นโดยการเพิ่มวิชาแรกของคุณ</p>
          </div>
        </div>
      ` : filteredClasses.length === 0 ? `
        <div class="card">
          <div class="empty-state py-12">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p class="empty-state-title">ไม่พบวิชาที่ค้นหา</p>
            <p class="empty-state-description">ลองค้นหาด้วยคำอื่น</p>
          </div>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filteredClasses.map(cls => {
            const studentCount = studentsStore.getByClass(cls.id).length;
            return `
              <div class="card hover:shadow-lg transition-all duration-200 group">
                <div class="p-5">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                      <h3 class="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        ${escapeHtml(cls.name)}
                      </h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400">${escapeHtml(cls.code)}</p>
                    </div>
                    <div class="flex items-center gap-1">
                      <button class="edit-class-btn p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors" data-id="${cls.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button class="delete-class-btn p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" data-id="${cls.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                      ${studentCount} คน
                    </span>
                    <span>${cls.credits || 3} หน่วยกิต</span>
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <span class="badge-info">${escapeHtml(cls.year)}/${escapeHtml(cls.semester)}</span>
                    <a href="#/attendance" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      เช็คชื่อ →
                    </a>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
      
      <!-- Deleted Classes -->
      ${deletedClasses.length > 0 ? `
        <div class="mt-8">
          <button id="toggle-deleted" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <svg class="w-4 h-4 transition-transform" id="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
            วิชาที่ลบแล้ว (${deletedClasses.length})
          </button>
          <div id="deleted-section" class="hidden mt-4 space-y-2">
            ${deletedClasses.map(cls => `
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl opacity-60">
                <div>
                  <span class="font-medium text-gray-700 dark:text-gray-300">${escapeHtml(cls.name)}</span>
                  <span class="text-sm text-gray-500 ml-2">${escapeHtml(cls.code)}</span>
                </div>
                <div class="flex items-center gap-2">
                  <button class="restore-class-btn btn-sm btn-secondary" data-id="${cls.id}">กู้คืน</button>
                  <button class="hard-delete-btn btn-sm btn-danger" data-id="${cls.id}">ลบถาวร</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
    
    // Event Listeners
    document.getElementById('add-class-btn').addEventListener('click', () => openClassModal());
    
    document.getElementById('search-input').addEventListener('input', (e) => {
      currentSearch = e.target.value;
      render();
    });
    
    document.querySelectorAll('.edit-class-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const cls = classesStore.getById(id);
        if (cls) openClassModal(cls);
      });
    });
    
    document.querySelectorAll('.delete-class-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const cls = classesStore.getById(id);
        showConfirm(`ต้องการลบวิชา "${cls.name}" หรือไม่?`, () => {
          classesStore.delete(id);
          showToast('ลบวิชาแล้ว (สามารถกู้คืนได้)', 'success');
          render();
        });
      });
    });
    
    document.querySelectorAll('.restore-class-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        classesStore.restore(btn.dataset.id);
        showToast('กู้คืนวิชาแล้ว', 'success');
        render();
      });
    });
    
    document.querySelectorAll('.hard-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirm('ลบถาวรจะไม่สามารถกู้คืนได้ ต้องการดำเนินการหรือไม่?', () => {
          classesStore.hardDelete(btn.dataset.id);
          showToast('ลบวิชาถาวรแล้ว', 'success');
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
  
  function openClassModal(cls = null) {
    const isEdit = !!cls;
    const currentYear = getCurrentAcademicYear();
    const currentSemester = getCurrentSemester();
    
    const content = `
      <form id="class-form" class="space-y-4">
        <div>
          <label class="label">รหัสวิชา <span class="text-red-500">*</span></label>
          <input type="text" name="code" class="input" placeholder="เช่น CS101" value="${cls ? escapeHtml(cls.code) : ''}" required>
        </div>
        <div>
          <label class="label">ชื่อวิชา <span class="text-red-500">*</span></label>
          <input type="text" name="name" class="input" placeholder="เช่น การเขียนโปรแกรมเบื้องต้น" value="${cls ? escapeHtml(cls.name) : ''}" required>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="label">ปีการศึกษา</label>
            <input type="number" name="year" class="input" value="${cls ? cls.year : currentYear}" min="2500" max="2600">
          </div>
          <div>
            <label class="label">เทอม</label>
            <select name="semester" class="select">
              <option value="1" ${(cls?.semester || currentSemester) === '1' ? 'selected' : ''}>เทอม 1</option>
              <option value="2" ${(cls?.semester || currentSemester) === '2' ? 'selected' : ''}>เทอม 2</option>
              <option value="3" ${cls?.semester === '3' ? 'selected' : ''}>ฤดูร้อน</option>
            </select>
          </div>
          <div>
            <label class="label">หน่วยกิต</label>
            <input type="number" name="credits" class="input" value="${cls ? cls.credits : 3}" min="1" max="12">
          </div>
        </div>
        <div>
          <label class="label">หมายเหตุ</label>
          <textarea name="note" class="input" rows="2" placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)">${cls?.note ? escapeHtml(cls.note) : ''}</textarea>
        </div>
      </form>
    `;
    
    showModal({
      title: isEdit ? 'แก้ไขวิชา' : 'เพิ่มวิชาใหม่',
      content,
      confirmText: isEdit ? 'บันทึก' : 'เพิ่มวิชา',
      onConfirm: () => {
        const form = document.getElementById('class-form');
        const formData = new FormData(form);
        
        const data = {
          code: formData.get('code').trim(),
          name: formData.get('name').trim(),
          year: formData.get('year'),
          semester: formData.get('semester'),
          credits: parseInt(formData.get('credits')) || 3,
          note: formData.get('note').trim()
        };
        
        // Validation
        if (!data.code || !data.name) {
          showToast('กรุณากรอกข้อมูลที่จำเป็น', 'error');
          return;
        }
        
        try {
          if (isEdit) {
            classesStore.update(cls.id, data);
            showToast('แก้ไขวิชาเรียบร้อย', 'success');
          } else {
            classesStore.create(data);
            showToast('เพิ่มวิชาเรียบร้อย', 'success');
          }
          closeModal();
          render();
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
    });
  }
}
