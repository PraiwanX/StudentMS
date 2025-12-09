// ==========================================
// Schedule Page - Class Schedule Management
// ==========================================

import { schedulesStore, classesStore, teachersStore, facultiesStore } from '../store.js';
import { showToast, showModal, closeModal, showConfirm, escapeHtml } from '../utils.js';

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
const TIME_SLOTS = [
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' }
];

let selectedFaculty = '';
let selectedYear = 1;

export async function renderSchedule(container) {
  const faculties = facultiesStore.getActive();
  const classes = classesStore.getActive();
  const teachers = teachersStore.getActive();
  
  if (!selectedFaculty && faculties.length > 0) {
    selectedFaculty = faculties[0].id;
  }
  
  render();
  
  function render() {
    const schedules = selectedFaculty ? 
      schedulesStore.getByFacultyYear(selectedFaculty, selectedYear) : 
      schedulesStore.getAll();
    
    container.innerHTML = `
      <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="page-title">📅 ตารางเรียน</h1>
          <p class="page-subtitle">จัดการตารางเรียนตามคณะและชั้นปี</p>
        </div>
        <button id="add-schedule-btn" class="btn-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          เพิ่มคาบเรียน
        </button>
      </div>
      
      <!-- Filters -->
      <div class="card mb-6">
        <div class="p-4">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <label class="label">คณะ</label>
              <select id="faculty-select" class="select">
                ${faculties.length === 0 ? 
                  '<option value="">ไม่มีคณะ (สร้างจากหน้าตั้งค่า)</option>' :
                  faculties.map(f => `
                    <option value="${f.id}" ${selectedFaculty === f.id ? 'selected' : ''}>
                      ${escapeHtml(f.name)}
                    </option>
                  `).join('')
                }
              </select>
            </div>
            <div>
              <label class="label">ชั้นปี</label>
              <select id="year-select" class="select">
                ${[1,2,3,4].map(y => `
                  <option value="${y}" ${selectedYear === y ? 'selected' : ''}>ปี ${y}</option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Schedule Grid -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th class="p-3 bg-gray-100 dark:bg-gray-700 text-left min-w-[80px]">เวลา</th>
                ${DAYS.map(day => `
                  <th class="p-3 bg-gray-100 dark:bg-gray-700 text-center min-w-[140px]">${day}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${TIME_SLOTS.map(slot => `
                <tr class="border-t border-gray-200 dark:border-gray-700">
                  <td class="p-2 bg-gray-50 dark:bg-gray-800 font-medium text-center">
                    ${slot.start}<br><span class="text-xs text-gray-400">${slot.end}</span>
                  </td>
                  ${DAYS.map((day, dayIndex) => {
                    const schedule = schedules.find(s => 
                      s.dayOfWeek === dayIndex && s.startTime === slot.start
                    );
                    const cls = schedule ? classes.find(c => c.id === schedule.classId) : null;
                    const teacher = schedule ? teachers.find(t => t.id === schedule.teacherId) : null;
                    
                    if (schedule && cls) {
                      return `
                        <td class="p-1 border-l border-gray-200 dark:border-gray-700">
                          <div class="p-2 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-lg cursor-pointer schedule-cell group" data-id="${schedule.id}">
                            <div class="font-semibold text-primary-700 dark:text-primary-300">${escapeHtml(cls.code)}</div>
                            <div class="text-xs text-gray-600 dark:text-gray-400 truncate">${escapeHtml(cls.name)}</div>
                            ${teacher ? `<div class="text-xs text-gray-500 mt-1">👤 ${escapeHtml(teacher.name)}</div>` : ''}
                            ${schedule.room ? `<div class="text-xs text-gray-500">📍 ${escapeHtml(schedule.room)}</div>` : ''}
                            <div class="hidden group-hover:flex gap-1 mt-2">
                              <button class="edit-schedule-btn p-1 bg-white dark:bg-gray-800 rounded text-xs" data-id="${schedule.id}">แก้ไข</button>
                              <button class="delete-schedule-btn p-1 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-600" data-id="${schedule.id}">ลบ</button>
                            </div>
                          </div>
                        </td>
                      `;
                    } else {
                      return `
                        <td class="p-1 border-l border-gray-200 dark:border-gray-700">
                          <div class="h-full min-h-[60px] flex items-center justify-center text-gray-300 dark:text-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg add-slot-btn" data-day="${dayIndex}" data-time="${slot.start}">
                            <svg class="w-5 h-5 opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                          </div>
                        </td>
                      `;
                    }
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="mt-4 flex items-center gap-4 text-sm text-gray-500">
        <span>💡 คลิกช่องว่างเพื่อเพิ่มคาบเรียน</span>
        <span>🖱️ Hover เพื่อแก้ไข/ลบ</span>
      </div>
    `;
    
    // Event Listeners
    document.getElementById('faculty-select')?.addEventListener('change', (e) => {
      selectedFaculty = e.target.value;
      render();
    });
    
    document.getElementById('year-select')?.addEventListener('change', (e) => {
      selectedYear = parseInt(e.target.value);
      render();
    });
    
    document.getElementById('add-schedule-btn')?.addEventListener('click', () => openScheduleModal());
    
    document.querySelectorAll('.add-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = parseInt(btn.dataset.day);
        const time = btn.dataset.time;
        openScheduleModal(null, { dayOfWeek: day, startTime: time });
      });
    });
    
    document.querySelectorAll('.edit-schedule-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const schedule = schedulesStore.getById(btn.dataset.id);
        if (schedule) openScheduleModal(schedule);
      });
    });
    
    document.querySelectorAll('.delete-schedule-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showConfirm('ลบคาบเรียนนี้?', () => {
          schedulesStore.delete(btn.dataset.id);
          showToast('ลบคาบเรียนแล้ว', 'success');
          render();
        });
      });
    });
  }
  
  function openScheduleModal(schedule = null, defaults = {}) {
    const isEdit = !!schedule;
    
    const content = `
      <form id="schedule-form" class="space-y-4">
        <div>
          <label class="label">วิชา <span class="text-red-500">*</span></label>
          <select name="classId" class="select" required>
            <option value="">เลือกวิชา</option>
            ${classes.map(cls => `
              <option value="${cls.id}" ${schedule?.classId === cls.id ? 'selected' : ''}>
                ${escapeHtml(cls.name)} (${escapeHtml(cls.code)})
              </option>
            `).join('')}
          </select>
        </div>
        
        <div>
          <label class="label">อาจารย์ผู้สอน</label>
          <select name="teacherId" class="select">
            <option value="">เลือกอาจารย์</option>
            ${teachers.map(t => `
              <option value="${t.id}" ${schedule?.teacherId === t.id ? 'selected' : ''}>
                ${escapeHtml(t.name)}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">วัน <span class="text-red-500">*</span></label>
            <select name="dayOfWeek" class="select" required>
              ${DAYS.map((day, i) => `
                <option value="${i}" ${(schedule?.dayOfWeek ?? defaults.dayOfWeek) === i ? 'selected' : ''}>
                  ${day}
                </option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="label">เวลาเริ่ม <span class="text-red-500">*</span></label>
            <select name="startTime" class="select" required>
              ${TIME_SLOTS.map(slot => `
                <option value="${slot.start}" ${(schedule?.startTime || defaults.startTime) === slot.start ? 'selected' : ''}>
                  ${slot.start}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">ห้องเรียน</label>
            <input type="text" name="room" class="input" value="${schedule?.room || ''}" placeholder="เช่น A301">
          </div>
          <div>
            <label class="label">ชั้นปี</label>
            <select name="yearLevel" class="select">
              ${[1,2,3,4].map(y => `
                <option value="${y}" ${(schedule?.yearLevel || selectedYear) === y ? 'selected' : ''}>ปี ${y}</option>
              `).join('')}
            </select>
          </div>
        </div>
      </form>
    `;
    
    showModal({
      title: isEdit ? 'แก้ไขคาบเรียน' : 'เพิ่มคาบเรียน',
      content,
      confirmText: isEdit ? 'บันทึก' : 'เพิ่ม',
      onConfirm: () => {
        const form = document.getElementById('schedule-form');
        const formData = new FormData(form);
        
        const data = {
          classId: formData.get('classId'),
          teacherId: formData.get('teacherId') || null,
          dayOfWeek: parseInt(formData.get('dayOfWeek')),
          startTime: formData.get('startTime'),
          endTime: getEndTime(formData.get('startTime')),
          room: formData.get('room').trim(),
          facultyId: selectedFaculty,
          yearLevel: parseInt(formData.get('yearLevel'))
        };
        
        if (!data.classId) {
          showToast('กรุณาเลือกวิชา', 'error');
          return;
        }
        
        if (isEdit) {
          schedulesStore.update(schedule.id, data);
          showToast('แก้ไขคาบเรียนแล้ว', 'success');
        } else {
          schedulesStore.create(data);
          showToast('เพิ่มคาบเรียนแล้ว', 'success');
        }
        closeModal();
        render();
      }
    });
  }
  
  function getEndTime(startTime) {
    const slot = TIME_SLOTS.find(s => s.start === startTime);
    return slot ? slot.end : startTime;
  }
}
