// ==========================================
// Dashboard Page with Charts & Announcements
// ==========================================

import { classesStore, studentsStore, attendanceStore, scoresStore, announcementsStore, facultiesStore } from '../store.js';
import { calculateGrade, formatDate, escapeHtml, getToday } from '../utils.js';

export async function renderDashboard(container) {
  const classes = classesStore.getActive();
  const students = studentsStore.getActive();
  const attendanceRecords = attendanceStore.getAll();
  const announcements = announcementsStore.getActive().slice(0, 3);
  const faculties = facultiesStore.getActive();
  
  // Calculate stats
  const totalClasses = classes.length;
  const totalStudents = students.length;
  
  // Calculate today's attendance
  const today = getToday();
  const todayAttendance = attendanceRecords.filter(r => r.date === today);
  const todayPresent = todayAttendance.filter(r => r.status === 'present' || r.status === 'late').length;
  const todayTotal = todayAttendance.length;
  const todayPercentage = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;
  
  // Calculate average grade
  let totalGradePoints = 0;
  let gradedStudents = 0;
  
  classes.forEach(cls => {
    const classStudents = studentsStore.getByClass(cls.id);
    classStudents.forEach(student => {
      const { percentage } = scoresStore.calculateTotal(student.id, cls.id);
      if (percentage > 0) {
        const grade = calculateGrade(percentage);
        const gradePoints = { 'A': 4, 'B+': 3.5, 'B': 3, 'C+': 2.5, 'C': 2, 'D+': 1.5, 'D': 1, 'F': 0 };
        totalGradePoints += gradePoints[grade] || 0;
        gradedStudents++;
      }
    });
  });
  
  const avgGPA = gradedStudents > 0 ? (totalGradePoints / gradedStudents).toFixed(2) : '-';
  
  // Calculate attendance by class for chart
  const classAttendanceData = classes.slice(0, 6).map(cls => {
    const classStudents = studentsStore.getByClass(cls.id);
    let totalPresent = 0;
    let totalRecords = 0;
    
    classStudents.forEach(student => {
      const records = attendanceRecords.filter(r => r.classId === cls.id && r.studentId === student.id);
      totalRecords += records.length;
      totalPresent += records.filter(r => r.status === 'present' || r.status === 'late').length;
    });
    
    const percentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    return { name: cls.code, percentage };
  });
  
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🏠 หน้าหลัก</h1>
      <p class="page-subtitle">ภาพรวมระบบจัดการนักเรียน</p>
    </div>
    
    <!-- Announcements Banner -->
    ${announcements.length > 0 ? `
      <div class="mb-6">
        ${announcements.filter(a => a.isPinned || a.type === 'urgent').slice(0, 1).map(a => `
          <div class="p-4 rounded-xl ${a.type === 'urgent' ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-200 dark:border-red-800' : 'bg-gradient-to-r from-primary-500/10 to-purple-500/10 border border-primary-200 dark:border-primary-800'}">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${a.type === 'urgent' ? '🚨' : '📢'}</span>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">${escapeHtml(a.title)}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">${escapeHtml(a.content)}</p>
              </div>
              <a href="#/announcements" class="text-sm text-primary-600 hover:underline">ดูทั้งหมด</a>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- Classes -->
      <div class="stat-card blue">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">วิชาทั้งหมด</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">${totalClasses}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl">
            📚
          </div>
        </div>
        <a href="#/classes" class="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 mt-4 hover:underline">
          ดูทั้งหมด →
        </a>
      </div>
      
      <!-- Students -->
      <div class="stat-card green">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">นักเรียนทั้งหมด</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">${totalStudents}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl">
            👨‍🎓
          </div>
        </div>
        <a href="#/students" class="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 mt-4 hover:underline">
          ดูทั้งหมด →
        </a>
      </div>
      
      <!-- Today Attendance -->
      <div class="stat-card purple">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">มาเรียนวันนี้</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">${todayPercentage}%</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-2xl">
            ✅
          </div>
        </div>
        <a href="#/attendance" class="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 mt-4 hover:underline">
          เช็คชื่อวันนี้ →
        </a>
      </div>
      
      <!-- Average GPA -->
      <div class="stat-card orange">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">เกรดเฉลี่ย</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">${avgGPA}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-2xl">
            📊
          </div>
        </div>
        <a href="#/grades" class="inline-flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 mt-4 hover:underline">
          ดูคะแนน →
        </a>
      </div>
    </div>
    
    <!-- Attendance Chart & Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Attendance Chart -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">📊 อัตราการมาเรียนรายวิชา</h2>
        </div>
        <div class="card-body">
          ${classAttendanceData.length === 0 ? `
            <div class="text-center py-8 text-gray-400">
              <p>ยังไม่มีข้อมูลการเช็คชื่อ</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${classAttendanceData.map(data => `
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${escapeHtml(data.name)}</span>
                    <span class="text-sm font-bold ${data.percentage >= 80 ? 'text-green-600' : data.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}">${data.percentage}%</span>
                  </div>
                  <div class="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500 ${data.percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : data.percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-pink-500'}" 
                         style="width: ${data.percentage}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">⚡ การดำเนินการด่วน</h2>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2 gap-4">
            <a href="#/attendance" class="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 hover:shadow-lg transition-all">
              <span class="text-3xl">📋</span>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">เช็คชื่อวันนี้</span>
            </a>
            
            <a href="#/scan" class="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-lg transition-all">
              <span class="text-3xl">📱</span>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">QR เช็คชื่อ</span>
            </a>
            
            <a href="#/grades" class="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 hover:shadow-lg transition-all">
              <span class="text-3xl">✏️</span>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">ใส่คะแนน</span>
            </a>
            
            <a href="#/schedule" class="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:shadow-lg transition-all">
              <span class="text-3xl">📅</span>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">ตารางเรียน</span>
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Classes Overview & Recent Announcements -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Classes Overview -->
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">📚 วิชาเรียน</h2>
          ${classes.length > 0 ? `<a href="#/classes" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">ดูทั้งหมด</a>` : ''}
        </div>
        <div class="card-body">
          ${classes.length === 0 ? `
            <div class="empty-state py-8">
              <p class="text-gray-400 mb-4">ยังไม่มีวิชาเรียน</p>
              <a href="#/classes" class="btn-primary btn-sm">เพิ่มวิชาแรก</a>
            </div>
          ` : `
            <div class="space-y-3">
              ${classes.slice(0, 5).map(cls => {
                const studentCount = studentsStore.getByClass(cls.id).length;
                return `
                  <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">${escapeHtml(cls.name)}</p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">${escapeHtml(cls.code)} • ${studentCount} คน</p>
                    </div>
                    <span class="badge-info">${cls.year}/${cls.semester}</span>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
      
      <!-- Recent Announcements -->
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">📢 ประกาศล่าสุด</h2>
          <a href="#/announcements" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">ดูทั้งหมด</a>
        </div>
        <div class="card-body">
          ${announcements.length === 0 ? `
            <div class="empty-state py-8">
              <p class="text-gray-400 mb-4">ยังไม่มีประกาศ</p>
              <a href="#/announcements" class="btn-primary btn-sm">สร้างประกาศแรก</a>
            </div>
          ` : `
            <div class="space-y-3">
              ${announcements.map(a => `
                <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div class="flex items-start gap-2">
                    <span>${a.type === 'urgent' ? '🚨' : a.type === 'info' ? 'ℹ️' : '📢'}</span>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-gray-900 dark:text-white truncate">${escapeHtml(a.title)}</p>
                      <p class="text-sm text-gray-500 line-clamp-2">${escapeHtml(a.content)}</p>
                      <p class="text-xs text-gray-400 mt-1">${formatDate(a.createdAt)}</p>
                    </div>
                    ${a.isPinned ? '<span class="text-yellow-500">📌</span>' : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}
