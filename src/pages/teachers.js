// ==========================================
// Teachers Page - Manage Teachers & Schedule
// ==========================================

import { teachersStore, classesStore, schedulesStore } from '../store.js';
import { showToast, showModal, closeModal, showConfirm, escapeHtml } from '../utils.js';

export async function renderTeachers(container) {
  render();
  
  function render() {
    const teachers = teachersStore.getActive();
    const classes = classesStore.getActive();
    
    container.innerHTML = `
      <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="page-title">👨‍🏫 อาจารย์</h1>
          <p class="page-subtitle">จัดการอาจารย์และตารางสอน</p>
        </div>
        <button id="add-teacher-btn" class="btn-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          เพิ่มอาจารย์
        </button>
      </div>
      
      ${teachers.length === 0 ? `
        <div class="card">
          <div class="empty-state py-12">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <p class="empty-state-title">ยังไม่มีอาจารย์</p>
            <p class="empty-state-description">เพิ่มอาจารย์เพื่อจัดการตารางสอน</p>
          </div>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${teachers.map(teacher => {
            const assignedClasses = (teacher.assignedClasses || [])
              .map(cid => classes.find(c => c.id === cid))
              .filter(Boolean);
            const schedules = schedulesStore.getByTeacher(teacher.id);
            
            return `
              <div class="card overflow-hidden group">
                <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-primary-500/10 to-purple-500/10">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      ${escapeHtml(teacher.name.charAt(0))}
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-gray-900 dark:text-white truncate">${escapeHtml(teacher.name)}</h3>
                      <p class="text-sm text-gray-500 truncate">${escapeHtml(teacher.email || '-')}</p>
                    </div>
                  </div>
                </div>
                
                <div class="p-4 space-y-3">
                  <div class="flex items-center gap-2 text-sm text-gray-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    ${escapeHtml(teacher.phone || '-')}
                  </div>
                  
                  <div>
                    <p class="text-xs text-gray-400 mb-1">วิชาที่สอน (${assignedClasses.length})</p>
                    <div class="flex flex-wrap gap-1">
                      ${assignedClasses.length > 0 ? 
                        assignedClasses.slice(0, 3).map(c => `
                          <span class="badge-info text-xs">${escapeHtml(c.code)}</span>
                        `).join('') + (assignedClasses.length > 3 ? `<span class="badge-gray text-xs">+${assignedClasses.length - 3}</span>` : '')
                        : '<span class="text-xs text-gray-400">-</span>'
                      }
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span class="text-xs text-gray-400">คาบสอน ${schedules.length} คาบ/สัปดาห์</span>
                    <div class="flex gap-1">
                      <button class="view-schedule-btn p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" data-id="${teacher.id}" title="ดูตาราง">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </button>
                      <button class="edit-teacher-btn p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" data-id="${teacher.id}" title="แก้ไข">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button class="delete-teacher-btn p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600" data-id="${teacher.id}" title="ลบ">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
    
    // Event Listeners
    document.getElementById('add-teacher-btn')?.addEventListener('click', () => openTeacherModal());
    
    document.querySelectorAll('.edit-teacher-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const teacher = teachersStore.getById(btn.dataset.id);
        if (teacher) openTeacherModal(teacher);
      });
    });
    
    document.querySelectorAll('.delete-teacher-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const teacher = teachersStore.getById(btn.dataset.id);
        showConfirm(`ลบอาจารย์ "${teacher.name}"?`, () => {
          teachersStore.delete(btn.dataset.id);
          showToast('ลบอาจารย์แล้ว', 'success');
          render();
        });
      });
    });
    
    document.querySelectorAll('.view-schedule-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const teacher = teachersStore.getById(btn.dataset.id);
        if (teacher) showTeacherScheduleModal(teacher);
      });
    });
  }
  
  function openTeacherModal(teacher = null) {
    const isEdit = !!teacher;
    const classes = classesStore.getActive();
    
    const content = `
      <form id="teacher-form" class="space-y-4">
        <div>
          <label class="label">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
          <input type="text" name="name" class="input" value="${teacher ? escapeHtml(teacher.name) : ''}" required>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">อีเมล</label>
            <input type="email" name="email" class="input" value="${teacher?.email || ''}">
          </div>
          <div>
            <label class="label">เบอร์โทร</label>
            <input type="tel" name="phone" class="input" value="${teacher?.phone || ''}">
          </div>
        </div>
        <div>
          <label class="label">วิชาที่สอน</label>
          <div class="max-h-40 overflow-y-auto space-y-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            ${classes.map(cls => `
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="classes" value="${cls.id}" 
                  ${(teacher?.assignedClasses || []).includes(cls.id) ? 'checked' : ''}
                  class="rounded text-primary-600 focus:ring-primary-500">
                <span class="text-sm">${escapeHtml(cls.name)} (${escapeHtml(cls.code)})</span>
              </label>
            `).join('')}
            ${classes.length === 0 ? '<p class="text-sm text-gray-500">ไม่มีวิชา</p>' : ''}
          </div>
        </div>
      </form>
    `;
    
    showModal({
      title: isEdit ? 'แก้ไขอาจารย์' : 'เพิ่มอาจารย์',
      content,
      confirmText: isEdit ? 'บันทึก' : 'เพิ่ม',
      onConfirm: () => {
        const form = document.getElementById('teacher-form');
        const formData = new FormData(form);
        
        const assignedClasses = [];
        form.querySelectorAll('input[name="classes"]:checked').forEach(cb => {
          assignedClasses.push(cb.value);
        });
        
        const data = {
          name: formData.get('name').trim(),
          email: formData.get('email').trim(),
          phone: formData.get('phone').trim(),
          assignedClasses
        };
        
        if (!data.name) {
          showToast('กรุณากรอกชื่อ', 'error');
          return;
        }
        
        if (isEdit) {
          teachersStore.update(teacher.id, data);
          showToast('แก้ไขอาจารย์แล้ว', 'success');
        } else {
          teachersStore.create(data);
          showToast('เพิ่มอาจารย์แล้ว', 'success');
        }
        closeModal();
        render();
      }
    });
  }
  
  function showTeacherScheduleModal(teacher) {
    const schedules = schedulesStore.getByTeacher(teacher.id);
    const classes = classesStore.getActive();
    
    const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    
    const content = `
      <div class="space-y-4">
        <p class="text-sm text-gray-500">ตารางสอนของ ${escapeHtml(teacher.name)}</p>
        
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr>
                <th class="p-2 bg-gray-100 dark:bg-gray-700">เวลา</th>
                ${days.map(d => `<th class="p-2 bg-gray-100 dark:bg-gray-700">${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${timeSlots.map(time => `
                <tr>
                  <td class="p-2 text-center font-medium bg-gray-50 dark:bg-gray-800">${time}</td>
                  ${days.map((day, dayIndex) => {
                    const schedule = schedules.find(s => 
                      s.dayOfWeek === dayIndex && s.startTime === time
                    );
                    const cls = schedule ? classes.find(c => c.id === schedule.classId) : null;
                    
                    return `
                      <td class="p-1 border border-gray-200 dark:border-gray-600">
                        ${schedule && cls ? `
                          <div class="p-1 bg-primary-100 dark:bg-primary-900/30 rounded text-center">
                            <div class="font-medium text-primary-700 dark:text-primary-300">${escapeHtml(cls.code)}</div>
                            <div class="text-gray-500">${schedule.room || '-'}</div>
                          </div>
                        ` : ''}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${schedules.length === 0 ? '<p class="text-center text-gray-400 py-4">ไม่มีตารางสอน</p>' : ''}
      </div>
    `;
    
    showModal({
      title: `📅 ตารางสอน`,
      content,
      confirmText: 'ปิด',
      showCancel: false,
      onConfirm: () => closeModal()
    });
  }
}
