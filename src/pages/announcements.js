// ==========================================
// Announcements Page - Manage Announcements
// ==========================================

import { announcementsStore } from '../store.js';
import { showToast, showModal, closeModal, showConfirm, escapeHtml, formatDate } from '../utils.js';

export async function renderAnnouncements(container) {
  render();
  
  function render() {
    const announcements = announcementsStore.getAll();
    const activeAnnouncements = announcements.filter(a => a.isActive);
    
    container.innerHTML = `
      <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="page-title">📢 ประกาศ</h1>
          <p class="page-subtitle">จัดการประกาศข่าวสาร</p>
        </div>
        <button id="add-announcement-btn" class="btn-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          สร้างประกาศ
        </button>
      </div>
      
      ${announcements.length === 0 ? `
        <div class="card">
          <div class="empty-state py-12">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
            </svg>
            <p class="empty-state-title">ยังไม่มีประกาศ</p>
            <p class="empty-state-description">สร้างประกาศเพื่อแจ้งข่าวสาร</p>
          </div>
        </div>
      ` : `
        <div class="space-y-4">
          ${announcements.map(announcement => `
            <div class="card overflow-hidden ${announcement.isPinned ? 'ring-2 ring-yellow-400' : ''}">
              <div class="flex">
                <!-- Pin Indicator -->
                ${announcement.isPinned ? `
                  <div class="w-2 bg-yellow-400"></div>
                ` : ''}
                
                <div class="flex-1 p-4">
                  <div class="flex items-start gap-4">
                    <!-- Icon -->
                    <div class="w-12 h-12 bg-gradient-to-br ${announcement.type === 'urgent' ? 'from-red-500 to-orange-500' : announcement.type === 'info' ? 'from-blue-500 to-cyan-500' : 'from-primary-500 to-purple-500'} rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      ${announcement.type === 'urgent' ? '🚨' : announcement.type === 'info' ? 'ℹ️' : '📢'}
                    </div>
                    
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <h3 class="font-semibold text-gray-900 dark:text-white">${escapeHtml(announcement.title)}</h3>
                        ${announcement.isPinned ? '<span class="badge-warning text-xs">📌 ปักหมุด</span>' : ''}
                        ${!announcement.isActive ? '<span class="badge-gray text-xs">ซ่อน</span>' : ''}
                      </div>
                      <p class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">${escapeHtml(announcement.content)}</p>
                      <p class="text-xs text-gray-400 mt-2">${formatDate(announcement.createdAt)}</p>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex items-center gap-1">
                      <button class="pin-btn p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${announcement.isPinned ? 'text-yellow-500' : 'text-gray-400'}" data-id="${announcement.id}" title="${announcement.isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'}">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4.5 2A2.5 2.5 0 002 4.5v11a2.5 2.5 0 002.5 2.5h11a2.5 2.5 0 002.5-2.5v-11A2.5 2.5 0 0015.5 2h-11z"/>
                        </svg>
                      </button>
                      <button class="edit-btn p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400" data-id="${announcement.id}" title="แก้ไข">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button class="delete-btn p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600" data-id="${announcement.id}" title="ลบ">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
    
    // Event Listeners
    document.getElementById('add-announcement-btn')?.addEventListener('click', () => openAnnouncementModal());
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const announcement = announcementsStore.getById(btn.dataset.id);
        if (announcement) openAnnouncementModal(announcement);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirm('ลบประกาศนี้?', () => {
          announcementsStore.delete(btn.dataset.id);
          showToast('ลบประกาศแล้ว', 'success');
          render();
        });
      });
    });
    
    document.querySelectorAll('.pin-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const announcement = announcementsStore.getById(btn.dataset.id);
        if (announcement.isPinned) {
          announcementsStore.unpin(btn.dataset.id);
          showToast('เลิกปักหมุดแล้ว', 'success');
        } else {
          announcementsStore.pin(btn.dataset.id);
          showToast('ปักหมุดแล้ว', 'success');
        }
        render();
      });
    });
  }
  
  function openAnnouncementModal(announcement = null) {
    const isEdit = !!announcement;
    
    const content = `
      <form id="announcement-form" class="space-y-4">
        <div>
          <label class="label">หัวข้อ <span class="text-red-500">*</span></label>
          <input type="text" name="title" class="input" value="${announcement ? escapeHtml(announcement.title) : ''}" required placeholder="หัวข้อประกาศ">
        </div>
        
        <div>
          <label class="label">เนื้อหา <span class="text-red-500">*</span></label>
          <textarea name="content" class="input" rows="4" required placeholder="รายละเอียดประกาศ">${announcement ? escapeHtml(announcement.content) : ''}</textarea>
        </div>
        
        <div>
          <label class="label">ประเภท</label>
          <select name="type" class="select">
            <option value="general" ${announcement?.type === 'general' ? 'selected' : ''}>📢 ทั่วไป</option>
            <option value="info" ${announcement?.type === 'info' ? 'selected' : ''}>ℹ️ ข้อมูล</option>
            <option value="urgent" ${announcement?.type === 'urgent' ? 'selected' : ''}>🚨 ด่วน</option>
          </select>
        </div>
        
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isPinned" class="rounded text-primary-600 focus:ring-primary-500" ${announcement?.isPinned ? 'checked' : ''}>
          <span class="text-sm">📌 ปักหมุดประกาศนี้</span>
        </label>
      </form>
    `;
    
    showModal({
      title: isEdit ? 'แก้ไขประกาศ' : 'สร้างประกาศ',
      content,
      confirmText: isEdit ? 'บันทึก' : 'สร้าง',
      onConfirm: () => {
        const form = document.getElementById('announcement-form');
        const formData = new FormData(form);
        
        const data = {
          title: formData.get('title').trim(),
          content: formData.get('content').trim(),
          type: formData.get('type'),
          isPinned: form.querySelector('[name="isPinned"]').checked
        };
        
        if (!data.title || !data.content) {
          showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
          return;
        }
        
        if (isEdit) {
          announcementsStore.update(announcement.id, data);
          showToast('แก้ไขประกาศแล้ว', 'success');
        } else {
          announcementsStore.create(data);
          showToast('สร้างประกาศแล้ว', 'success');
        }
        closeModal();
        render();
      }
    });
  }
}
