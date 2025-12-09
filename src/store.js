// ==========================================
// Store - LocalStorage CRUD Operations
// ==========================================

const STORAGE_KEYS = {
  CLASSES: 'sms_classes',
  STUDENTS: 'sms_students',
  ATTENDANCE: 'sms_attendance',
  SCORE_UNITS: 'sms_score_units',
  SCORES: 'sms_scores',
  SETTINGS: 'sms_settings',
  // Phase 2
  FACULTIES: 'sms_faculties',
  TEACHERS: 'sms_teachers',
  SCHEDULES: 'sms_schedules',
  ANNOUNCEMENTS: 'sms_announcements',
  QR_SESSIONS: 'sms_qr_sessions'
};

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'dark',
  gradeScale: {
    'A': 80,
    'B+': 75,
    'B': 70,
    'C+': 65,
    'C': 60,
    'D+': 55,
    'D': 50,
    'F': 0
  }
};

// ==========================================
// Generic CRUD Functions
// ==========================================

function getAll(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return [];
  }
}

function saveAll(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      alert('พื้นที่จัดเก็บเต็ม! กรุณา Export ข้อมูลและลบข้อมูลเก่า');
    }
    console.error(`Error saving ${key}:`, error);
    return false;
  }
}

function getById(key, id) {
  const items = getAll(key);
  return items.find(item => item.id === id);
}

function create(key, item) {
  const items = getAll(key);
  const newItem = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  items.push(newItem);
  saveAll(key, items);
  return newItem;
}

function update(key, id, updates) {
  const items = getAll(key);
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveAll(key, items);
    return items[index];
  }
  return null;
}

function remove(key, id) {
  const items = getAll(key);
  const filtered = items.filter(item => item.id !== id);
  saveAll(key, filtered);
  return filtered.length < items.length;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==========================================
// Classes CRUD
// ==========================================

export const classesStore = {
  getAll: () => getAll(STORAGE_KEYS.CLASSES),
  getById: (id) => getById(STORAGE_KEYS.CLASSES, id),
  
  create: (classData) => {
    // Validate unique code per year/semester
    const existing = getAll(STORAGE_KEYS.CLASSES);
    const duplicate = existing.find(c => 
      c.code === classData.code && 
      c.year === classData.year && 
      c.semester === classData.semester &&
      !c.isDeleted
    );
    if (duplicate) {
      throw new Error('รหัสวิชานี้มีอยู่แล้วในเทอม/ปีนี้');
    }
    return create(STORAGE_KEYS.CLASSES, { ...classData, isDeleted: false });
  },
  
  update: (id, updates) => update(STORAGE_KEYS.CLASSES, id, updates),
  
  delete: (id) => {
    // Soft delete
    return update(STORAGE_KEYS.CLASSES, id, { isDeleted: true });
  },
  
  restore: (id) => update(STORAGE_KEYS.CLASSES, id, { isDeleted: false }),
  
  hardDelete: (id) => remove(STORAGE_KEYS.CLASSES, id),
  
  getActive: () => getAll(STORAGE_KEYS.CLASSES).filter(c => !c.isDeleted)
};

// ==========================================
// Students CRUD
// ==========================================

export const studentsStore = {
  getAll: () => getAll(STORAGE_KEYS.STUDENTS),
  getById: (id) => getById(STORAGE_KEYS.STUDENTS, id),
  
  create: (studentData) => {
    return create(STORAGE_KEYS.STUDENTS, { 
      ...studentData, 
      enrolledClasses: studentData.enrolledClasses || [],
      isDeleted: false 
    });
  },
  
  update: (id, updates) => update(STORAGE_KEYS.STUDENTS, id, updates),
  
  delete: (id) => update(STORAGE_KEYS.STUDENTS, id, { isDeleted: true }),
  
  restore: (id) => update(STORAGE_KEYS.STUDENTS, id, { isDeleted: false }),
  
  hardDelete: (id) => remove(STORAGE_KEYS.STUDENTS, id),
  
  getActive: () => getAll(STORAGE_KEYS.STUDENTS).filter(s => !s.isDeleted),
  
  getByClass: (classId) => {
    const students = getAll(STORAGE_KEYS.STUDENTS).filter(s => !s.isDeleted);
    return students.filter(s => s.enrolledClasses && s.enrolledClasses.includes(classId));
  },
  
  enrollClass: (studentId, classId) => {
    const student = getById(STORAGE_KEYS.STUDENTS, studentId);
    if (student) {
      const enrolledClasses = student.enrolledClasses || [];
      if (!enrolledClasses.includes(classId)) {
        enrolledClasses.push(classId);
        return update(STORAGE_KEYS.STUDENTS, studentId, { enrolledClasses });
      }
    }
    return null;
  },
  
  unenrollClass: (studentId, classId) => {
    const student = getById(STORAGE_KEYS.STUDENTS, studentId);
    if (student) {
      const enrolledClasses = (student.enrolledClasses || []).filter(id => id !== classId);
      return update(STORAGE_KEYS.STUDENTS, studentId, { enrolledClasses });
    }
    return null;
  }
};

// ==========================================
// Attendance CRUD
// ==========================================

export const attendanceStore = {
  getAll: () => getAll(STORAGE_KEYS.ATTENDANCE),
  
  // Get attendance for a specific class and date
  getByClassDate: (classId, date) => {
    const records = getAll(STORAGE_KEYS.ATTENDANCE);
    return records.filter(r => r.classId === classId && r.date === date);
  },
  
  // Get attendance for a specific student in a class
  getByStudentClass: (studentId, classId) => {
    const records = getAll(STORAGE_KEYS.ATTENDANCE);
    return records.filter(r => r.studentId === studentId && r.classId === classId);
  },
  
  // Get all dates with attendance for a class
  getDatesByClass: (classId) => {
    const records = getAll(STORAGE_KEYS.ATTENDANCE);
    const dates = [...new Set(records.filter(r => r.classId === classId).map(r => r.date))];
    return dates.sort((a, b) => new Date(b) - new Date(a));
  },
  
  // Set attendance (create or update)
  set: (classId, studentId, date, status) => {
    const records = getAll(STORAGE_KEYS.ATTENDANCE);
    const existingIndex = records.findIndex(r => 
      r.classId === classId && r.studentId === studentId && r.date === date
    );
    
    if (existingIndex !== -1) {
      records[existingIndex] = {
        ...records[existingIndex],
        status,
        updatedAt: new Date().toISOString()
      };
    } else {
      records.push({
        id: generateId(),
        classId,
        studentId,
        date,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    saveAll(STORAGE_KEYS.ATTENDANCE, records);
    return true;
  },
  
  // Bulk set attendance for all students in a class
  bulkSet: (classId, date, studentStatuses) => {
    const records = getAll(STORAGE_KEYS.ATTENDANCE);
    
    studentStatuses.forEach(({ studentId, status }) => {
      const existingIndex = records.findIndex(r => 
        r.classId === classId && r.studentId === studentId && r.date === date
      );
      
      if (existingIndex !== -1) {
        records[existingIndex] = {
          ...records[existingIndex],
          status,
          updatedAt: new Date().toISOString()
        };
      } else {
        records.push({
          id: generateId(),
          classId,
          studentId,
          date,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    saveAll(STORAGE_KEYS.ATTENDANCE, records);
    return true;
  },
  
  // Calculate attendance percentage for a student in a class
  calculatePercentage: (studentId, classId) => {
    const records = getAll(STORAGE_KEYS.ATTENDANCE).filter(r => 
      r.studentId === studentId && r.classId === classId
    );
    
    if (records.length === 0) return { percentage: 0, present: 0, total: 0 };
    
    const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
    const percentage = (presentCount / records.length) * 100;
    
    return {
      percentage: Math.round(percentage * 10) / 10,
      present: presentCount,
      total: records.length
    };
  }
};

// ==========================================
// Score Units CRUD
// ==========================================

export const scoreUnitsStore = {
  getAll: () => getAll(STORAGE_KEYS.SCORE_UNITS),
  getById: (id) => getById(STORAGE_KEYS.SCORE_UNITS, id),
  
  getByClass: (classId) => {
    return getAll(STORAGE_KEYS.SCORE_UNITS).filter(u => u.classId === classId);
  },
  
  create: (unitData) => {
    return create(STORAGE_KEYS.SCORE_UNITS, unitData);
  },
  
  update: (id, updates) => update(STORAGE_KEYS.SCORE_UNITS, id, updates),
  
  delete: (id) => {
    // Also delete related scores
    const scores = getAll(STORAGE_KEYS.SCORES);
    const filtered = scores.filter(s => s.unitId !== id);
    saveAll(STORAGE_KEYS.SCORES, filtered);
    return remove(STORAGE_KEYS.SCORE_UNITS, id);
  },
  
  // Check if total weight exceeds 100%
  getTotalWeight: (classId) => {
    const units = getAll(STORAGE_KEYS.SCORE_UNITS).filter(u => u.classId === classId);
    return units.reduce((sum, u) => sum + (parseFloat(u.weight) || 0), 0);
  }
};

// ==========================================
// Scores CRUD
// ==========================================

export const scoresStore = {
  getAll: () => getAll(STORAGE_KEYS.SCORES),
  
  getByStudentClass: (studentId, classId) => {
    const units = scoreUnitsStore.getByClass(classId);
    const unitIds = units.map(u => u.id);
    return getAll(STORAGE_KEYS.SCORES).filter(s => 
      s.studentId === studentId && unitIds.includes(s.unitId)
    );
  },
  
  getByUnit: (unitId) => {
    return getAll(STORAGE_KEYS.SCORES).filter(s => s.unitId === unitId);
  },
  
  // Set score (create or update)
  set: (studentId, unitId, score) => {
    const records = getAll(STORAGE_KEYS.SCORES);
    const existingIndex = records.findIndex(r => 
      r.studentId === studentId && r.unitId === unitId
    );
    
    if (existingIndex !== -1) {
      records[existingIndex] = {
        ...records[existingIndex],
        score: parseFloat(score) || 0,
        updatedAt: new Date().toISOString()
      };
    } else {
      records.push({
        id: generateId(),
        studentId,
        unitId,
        score: parseFloat(score) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    saveAll(STORAGE_KEYS.SCORES, records);
    return true;
  },
  
  // Calculate total percentage for a student in a class
  calculateTotal: (studentId, classId) => {
    const units = scoreUnitsStore.getByClass(classId);
    const scores = getAll(STORAGE_KEYS.SCORES).filter(s => s.studentId === studentId);
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    units.forEach(unit => {
      const scoreRecord = scores.find(s => s.unitId === unit.id);
      if (scoreRecord && unit.maxScore > 0) {
        const percentage = (scoreRecord.score / unit.maxScore) * 100;
        totalWeightedScore += percentage * (unit.weight / 100);
        totalWeight += unit.weight;
      }
    });
    
    return {
      percentage: Math.round(totalWeightedScore * 10) / 10,
      totalWeight
    };
  }
};

// ==========================================
// Settings
// ==========================================

export const settingsStore = {
  get: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  
  set: (settings) => {
    try {
      const current = settingsStore.get();
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
      return true;
    } catch {
      return false;
    }
  },
  
  getGradeScale: () => {
    return settingsStore.get().gradeScale;
  },
  
  setGradeScale: (gradeScale) => {
    return settingsStore.set({ gradeScale });
  }
};

// ==========================================
// Export/Import
// ==========================================

export const dataStore = {
  exportAll: () => {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        classes: getAll(STORAGE_KEYS.CLASSES),
        students: getAll(STORAGE_KEYS.STUDENTS),
        attendance: getAll(STORAGE_KEYS.ATTENDANCE),
        scoreUnits: getAll(STORAGE_KEYS.SCORE_UNITS),
        scores: getAll(STORAGE_KEYS.SCORES),
        settings: settingsStore.get()
      }
    };
  },
  
  importAll: (jsonData) => {
    try {
      const { data } = jsonData;
      if (data.classes) saveAll(STORAGE_KEYS.CLASSES, data.classes);
      if (data.students) saveAll(STORAGE_KEYS.STUDENTS, data.students);
      if (data.attendance) saveAll(STORAGE_KEYS.ATTENDANCE, data.attendance);
      if (data.scoreUnits) saveAll(STORAGE_KEYS.SCORE_UNITS, data.scoreUnits);
      if (data.scores) saveAll(STORAGE_KEYS.SCORES, data.scores);
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      // Phase 2
      if (data.faculties) saveAll(STORAGE_KEYS.FACULTIES, data.faculties);
      if (data.teachers) saveAll(STORAGE_KEYS.TEACHERS, data.teachers);
      if (data.schedules) saveAll(STORAGE_KEYS.SCHEDULES, data.schedules);
      if (data.announcements) saveAll(STORAGE_KEYS.ANNOUNCEMENTS, data.announcements);
      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  },
  
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

// ==========================================
// PHASE 2: Faculties CRUD
// ==========================================

export const facultiesStore = {
  getAll: () => getAll(STORAGE_KEYS.FACULTIES),
  getById: (id) => getById(STORAGE_KEYS.FACULTIES, id),
  
  create: (facultyData) => {
    return create(STORAGE_KEYS.FACULTIES, { ...facultyData, isDeleted: false });
  },
  
  update: (id, updates) => update(STORAGE_KEYS.FACULTIES, id, updates),
  
  delete: (id) => update(STORAGE_KEYS.FACULTIES, id, { isDeleted: true }),
  
  getActive: () => getAll(STORAGE_KEYS.FACULTIES).filter(f => !f.isDeleted)
};

// ==========================================
// PHASE 2: Teachers CRUD
// ==========================================

export const teachersStore = {
  getAll: () => getAll(STORAGE_KEYS.TEACHERS),
  getById: (id) => getById(STORAGE_KEYS.TEACHERS, id),
  
  create: (teacherData) => {
    return create(STORAGE_KEYS.TEACHERS, { 
      ...teacherData, 
      assignedClasses: teacherData.assignedClasses || [],
      isDeleted: false 
    });
  },
  
  update: (id, updates) => update(STORAGE_KEYS.TEACHERS, id, updates),
  
  delete: (id) => update(STORAGE_KEYS.TEACHERS, id, { isDeleted: true }),
  
  getActive: () => getAll(STORAGE_KEYS.TEACHERS).filter(t => !t.isDeleted),
  
  getByClass: (classId) => {
    return getAll(STORAGE_KEYS.TEACHERS).filter(t => 
      !t.isDeleted && t.assignedClasses && t.assignedClasses.includes(classId)
    );
  },
  
  assignClass: (teacherId, classId) => {
    const teacher = getById(STORAGE_KEYS.TEACHERS, teacherId);
    if (teacher) {
      const assignedClasses = teacher.assignedClasses || [];
      if (!assignedClasses.includes(classId)) {
        assignedClasses.push(classId);
        return update(STORAGE_KEYS.TEACHERS, teacherId, { assignedClasses });
      }
    }
    return null;
  }
};

// ==========================================
// PHASE 2: Schedules CRUD
// ==========================================

export const schedulesStore = {
  getAll: () => getAll(STORAGE_KEYS.SCHEDULES),
  getById: (id) => getById(STORAGE_KEYS.SCHEDULES, id),
  
  create: (scheduleData) => {
    // scheduleData: { classId, teacherId, dayOfWeek, startTime, endTime, room, facultyId, yearLevel }
    return create(STORAGE_KEYS.SCHEDULES, scheduleData);
  },
  
  update: (id, updates) => update(STORAGE_KEYS.SCHEDULES, id, updates),
  
  delete: (id) => remove(STORAGE_KEYS.SCHEDULES, id),
  
  getByClass: (classId) => {
    return getAll(STORAGE_KEYS.SCHEDULES).filter(s => s.classId === classId);
  },
  
  getByTeacher: (teacherId) => {
    return getAll(STORAGE_KEYS.SCHEDULES).filter(s => s.teacherId === teacherId);
  },
  
  getByFacultyYear: (facultyId, yearLevel) => {
    return getAll(STORAGE_KEYS.SCHEDULES).filter(s => 
      s.facultyId === facultyId && s.yearLevel === yearLevel
    );
  },
  
  getByDay: (dayOfWeek) => {
    return getAll(STORAGE_KEYS.SCHEDULES).filter(s => s.dayOfWeek === dayOfWeek);
  }
};

// ==========================================
// PHASE 2: Announcements CRUD
// ==========================================

export const announcementsStore = {
  getAll: () => getAll(STORAGE_KEYS.ANNOUNCEMENTS),
  getById: (id) => getById(STORAGE_KEYS.ANNOUNCEMENTS, id),
  
  create: (announcementData) => {
    return create(STORAGE_KEYS.ANNOUNCEMENTS, { 
      ...announcementData, 
      isActive: true,
      isPinned: announcementData.isPinned || false
    });
  },
  
  update: (id, updates) => update(STORAGE_KEYS.ANNOUNCEMENTS, id, updates),
  
  delete: (id) => remove(STORAGE_KEYS.ANNOUNCEMENTS, id),
  
  getActive: () => {
    return getAll(STORAGE_KEYS.ANNOUNCEMENTS)
      .filter(a => a.isActive)
      .sort((a, b) => {
        // Pinned first, then by date
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  },
  
  pin: (id) => update(STORAGE_KEYS.ANNOUNCEMENTS, id, { isPinned: true }),
  
  unpin: (id) => update(STORAGE_KEYS.ANNOUNCEMENTS, id, { isPinned: false })
};

// ==========================================
// PHASE 2: QR Sessions for Attendance
// ==========================================

export const qrSessionsStore = {
  getAll: () => getAll(STORAGE_KEYS.QR_SESSIONS),
  getById: (id) => getById(STORAGE_KEYS.QR_SESSIONS, id),
  
  create: (sessionData) => {
    // sessionData: { classId, date, expiresAt }
    const session = create(STORAGE_KEYS.QR_SESSIONS, {
      ...sessionData,
      sessionCode: generateSessionCode(),
      scannedStudents: [],
      isActive: true
    });
    return session;
  },
  
  // Record student scan
  recordScan: (sessionId, studentId) => {
    const sessions = getAll(STORAGE_KEYS.QR_SESSIONS);
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      const session = sessions[sessionIndex];
      
      // Check if session is still active
      if (!session.isActive) return { success: false, error: 'Session expired' };
      if (new Date() > new Date(session.expiresAt)) {
        sessions[sessionIndex].isActive = false;
        saveAll(STORAGE_KEYS.QR_SESSIONS, sessions);
        return { success: false, error: 'Session expired' };
      }
      
      // Check if already scanned
      if (session.scannedStudents.includes(studentId)) {
        return { success: false, error: 'Already checked in' };
      }
      
      // Record scan
      sessions[sessionIndex].scannedStudents.push(studentId);
      saveAll(STORAGE_KEYS.QR_SESSIONS, sessions);
      
      return { success: true, session: sessions[sessionIndex] };
    }
    
    return { success: false, error: 'Session not found' };
  },
  
  getByCode: (sessionCode) => {
    return getAll(STORAGE_KEYS.QR_SESSIONS).find(s => s.sessionCode === sessionCode);
  },
  
  deactivate: (id) => update(STORAGE_KEYS.QR_SESSIONS, id, { isActive: false }),
  
  getActiveByClass: (classId) => {
    return getAll(STORAGE_KEYS.QR_SESSIONS).find(s => 
      s.classId === classId && s.isActive && new Date() < new Date(s.expiresAt)
    );
  }
};

function generateSessionCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ==========================================
// PHASE 2: Excel/CSV Import Helpers
// ==========================================

export const importHelpers = {
  // Parse CSV string to array of objects
  parseCSV: (csvString) => {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
    
    return data;
  },
  
  // Import scores from parsed data
  // columnMap: { studentIdColumn: 'รหัสนักเรียน', scoreColumn: 'คะแนน' }
  importScores: (parsedData, classId, unitId, columnMap) => {
    const students = studentsStore.getByClass(classId);
    let imported = 0;
    let errors = [];
    
    parsedData.forEach((row, index) => {
      const studentId = row[columnMap.studentIdColumn];
      const score = parseFloat(row[columnMap.scoreColumn]);
      
      if (!studentId) {
        errors.push(`Row ${index + 2}: Missing student ID`);
        return;
      }
      
      const student = students.find(s => s.studentId === studentId);
      if (!student) {
        errors.push(`Row ${index + 2}: Student ${studentId} not found`);
        return;
      }
      
      if (isNaN(score)) {
        errors.push(`Row ${index + 2}: Invalid score`);
        return;
      }
      
      scoresStore.set(student.id, unitId, score);
      imported++;
    });
    
    return { imported, errors };
  },
  
  // ==========================================
  // FUTURE: Google Sheets Real-time Sync
  // Uncomment and configure when server is ready
  // ==========================================
  
  // syncFromGoogleSheets: async (sheetUrl, apiKey) => {
  //   // TODO: Implement when backend is available
  //   // 1. Call backend API with sheetUrl
  //   // 2. Backend fetches data using Google Sheets API
  //   // 3. Return parsed data
  //   // 
  //   // Example:
  //   // const response = await fetch('/api/sheets/sync', {
  //   //   method: 'POST',
  //   //   headers: { 'Content-Type': 'application/json' },
  //   //   body: JSON.stringify({ sheetUrl, apiKey })
  //   // });
  //   // return await response.json();
  //   
  //   console.log('Google Sheets sync requires backend server');
  //   return { success: false, error: 'Backend required for real-time sync' };
  // },
  
  // setupRealtimeSync: (sheetUrl, intervalMs = 30000) => {
  //   // TODO: Implement WebSocket or polling when server is ready
  //   // setInterval(async () => {
  //   //   const data = await importHelpers.syncFromGoogleSheets(sheetUrl);
  //   //   if (data.success) {
  //   //     // Update local data
  //   //   }
  //   // }, intervalMs);
  //   
  //   console.log('Real-time sync requires backend server');
  // }
};
