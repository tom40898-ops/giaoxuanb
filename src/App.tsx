import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './lib/supabase';
import type { Grade, ClassItem, Student, Attendance, Score } from './types';
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  BookOpen,
  Plus,
  Trash2,
  ChevronRight,
  Lock,
  X,
  Search,
  CheckCircle,
  XCircle,
  ArrowLeft,
  School,
  BarChart3,
  Edit3,
  Save,
  Calendar,
  Download,
} from 'lucide-react';

type View = 'grades' | 'students' | 'attendance' | 'scores' | 'attendance-list' | 'score-list';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('students');
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [classPassword, setClassPassword] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [pendingClass, setPendingClass] = useState<ClassItem | null>(null);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [newGradeName, setNewGradeName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassPassword, setNewClassPassword] = useState('');
  const [newClassGradeId, setNewClassGradeId] = useState('');

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNotes, setNewStudentNotes] = useState('');

  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({});

  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [attendanceListDate, setAttendanceListDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [scoreSubject, setScoreSubject] = useState('');
  const [scoreDate, setScoreDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [scoreList, setScoreList] = useState<Score[]>([]);
  const [scoreListSubject, setScoreListSubject] = useState('');

  const [loading, setLoading] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentNotes, setEditStudentNotes] = useState('');

  const [studentSuggestions, setStudentSuggestions] = useState<Student[]>([]);
  const [selectedScoreStudent, setSelectedScoreStudent] = useState<string>('');
  const [scoreValue, setScoreValue] = useState('');

  const fetchGrades = useCallback(async () => {
    const { data } = await supabase.from('grades').select('*').order('name');
    if (data) setGrades(data);
  }, []);

  const fetchClasses = useCallback(async () => {
    const { data } = await supabase.from('classes').select('*').order('name');
    if (data) setClasses(data);
  }, []);

  const fetchStudents = useCallback(async (classId: string) => {
    const { data } = await supabase.from('students').select('*').eq('class_id', classId).order('name');
    if (data) setStudents(data);
  }, []);

  useEffect(() => {
    fetchGrades();
    fetchClasses();
  }, [fetchGrades, fetchClasses]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.id);
    }
  }, [selectedClass, fetchStudents]);

  const openClass = (cls: ClassItem) => {
    setPendingClass(cls);
    setClassPassword('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const verifyPassword = () => {
    if (!pendingClass) return;
    if (classPassword === pendingClass.password) {
      setSelectedClass(pendingClass);
      setIsPasswordModalOpen(false);
      setPendingClass(null);
      setClassPassword('');
      setPasswordError('');
    } else {
      setPasswordError('Mật khẩu không đúng!');
    }
  };

  const addGrade = async () => {
    if (!newGradeName.trim()) return;
    setLoading(true);
    await supabase.from('grades').insert({ name: newGradeName.trim() });
    setNewGradeName('');
    await fetchGrades();
    setLoading(false);
  };

  const deleteGrade = async (id: string) => {
    if (!confirm('Xóa khối này? Các lớp và học sinh thuộc khối cũng sẽ bị xóa.')) return;
    setLoading(true);
    await supabase.from('grades').delete().eq('id', id);
    await fetchGrades();
    await fetchClasses();
    setLoading(false);
  };

  const addClass = async () => {
    if (!newClassName.trim() || !newClassGradeId || !newClassPassword.trim()) return;
    setLoading(true);
    await supabase.from('classes').insert({
      name: newClassName.trim(),
      grade_id: newClassGradeId,
      password: newClassPassword.trim(),
    });
    setNewClassName('');
    setNewClassPassword('');
    await fetchClasses();
    setLoading(false);
  };

  const deleteClass = async (id: string) => {
    if (!confirm('Xóa lớp này? Tất cả học sinh và điểm danh cũng sẽ bị xóa.')) return;
    setLoading(true);
    await supabase.from('classes').delete().eq('id', id);
    if (selectedClass?.id === id) setSelectedClass(null);
    await fetchClasses();
    setLoading(false);
  };

  const addStudent = async () => {
    if (!newStudentName.trim() || !selectedClass) return;
    setLoading(true);
    await supabase.from('students').insert({
      name: newStudentName.trim(),
      class_id: selectedClass.id,
      notes: newStudentNotes.trim() || null,
    });
    setNewStudentName('');
    setNewStudentNotes('');
    await fetchStudents(selectedClass.id);
    setLoading(false);
  };

  const deleteStudent = async (id: string) => {
    if (!confirm('Xóa học sinh này?')) return;
    setLoading(true);
    await supabase.from('students').delete().eq('id', id);
    if (selectedClass) await fetchStudents(selectedClass.id);
    setLoading(false);
  };

  const startEditStudent = (student: Student) => {
    setEditingStudent(student.id);
    setEditStudentName(student.name);
    setEditStudentNotes(student.notes || '');
  };

  const saveEditStudent = async () => {
    if (!editingStudent || !editStudentName.trim()) return;
    setLoading(true);
    await supabase.from('students').update({
      name: editStudentName.trim(),
      notes: editStudentNotes.trim() || null,
    }).eq('id', editingStudent);
    setEditingStudent(null);
    if (selectedClass) await fetchStudents(selectedClass.id);
    setLoading(false);
  };

  const loadAttendanceForDate = async (date: string) => {
    if (!selectedClass) return;
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', selectedClass.id)
      .eq('date', date);
    const map: Record<string, 'present' | 'absent'> = {};
    if (data) {
      data.forEach((a) => {
        map[a.student_id] = a.status;
      });
    }
    setAttendanceMap(map);
  };

  useEffect(() => {
    if (currentView === 'attendance' && selectedClass) {
      loadAttendanceForDate(attendanceDate);
    }
  }, [currentView, attendanceDate, selectedClass]);

  const saveAttendance = async () => {
    if (!selectedClass) return;
    setLoading(true);
    const records = students.map((s) => ({
      class_id: selectedClass.id,
      student_id: s.id,
      date: attendanceDate,
      status: attendanceMap[s.id] || 'present',
    }));
    await supabase.from('attendance').delete().eq('class_id', selectedClass.id).eq('date', attendanceDate);
    await supabase.from('attendance').insert(records);
    alert('Đã lưu điểm danh!');
    setLoading(false);
  };

  const loadAttendanceList = async () => {
    if (!selectedClass) return;
    setLoading(true);
    const { data } = await supabase
      .from('attendance')
      .select('*, students(name)')
      .eq('class_id', selectedClass.id)
      .eq('date', attendanceListDate)
      .order('created_at');
    setAttendanceList(data || []);
    setLoading(false);
  };

  const loadScoreList = async () => {
    if (!selectedClass) return;
    setLoading(true);
    let query = supabase
      .from('scores')
      .select('*, students(name)')
      .eq('class_id', selectedClass.id)
      .order('date', { ascending: false });
    if (scoreListSubject.trim()) {
      query = query.eq('subject', scoreListSubject.trim());
    }
    const { data } = await query;
    setScoreList(data || []);
    setLoading(false);
  };

  const saveScore = async () => {
    if (!selectedClass || !scoreSubject.trim() || !scoreDate) return;
    if (!selectedScoreStudent || !scoreValue) return;
    const scoreNum = parseFloat(scoreValue);
    if (isNaN(scoreNum)) return;

    setLoading(true);
    await supabase.from('scores').insert({
      class_id: selectedClass.id,
      student_id: selectedScoreStudent,
      subject: scoreSubject.trim(),
      score: scoreNum,
      date: scoreDate,
    });
    alert('Đã lưu điểm số!');
    setScoreValue('');
    setSelectedScoreStudent('');
    setSearchStudent('');
    setLoading(false);
  };

  const exportStudentsToExcel = () => {
    if (!selectedClass || students.length === 0) return;
    const rows = students.map((s, idx) => ({
      'STT': idx + 1,
      'Họ và tên': s.name,
      'Ghi chú': s.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sach hoc sinh');
    const gradeName = getGradeName(selectedClass.grade_id);
    XLSX.writeFile(wb, `${gradeName}_${selectedClass.name}_hoc_sinh.xlsx`);
  };

  const exportScoresToExcel = () => {
    if (!selectedClass || scoreList.length === 0) return;
    const rows = scoreList.map((sc, idx) => ({
      'STT': idx + 1,
      // @ts-ignore
      'Họ và tên': sc.students?.name || '',
      'Môn học': sc.subject,
      'Điểm': sc.score,
      'Ngày': sc.date,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Diem so');
    const gradeName = getGradeName(selectedClass.grade_id);
    const subjectLabel = scoreListSubject ? `_${scoreListSubject}` : '';
    XLSX.writeFile(wb, `${gradeName}_${selectedClass.name}${subjectLabel}_diem_so.xlsx`);
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const getGradeName = (gradeId: string) => {
    const g = grades.find((g) => g.id === gradeId);
    return g?.name || 'Khối';
  };

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <School className="w-6 h-6 text-emerald-400" />
          <h1 className="text-lg font-bold tracking-tight">Quản lý Học sinh</h1>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <button
          onClick={() => setCurrentView('grades')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
            currentView === 'grades' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          Khối & Lớp
        </button>
        <button
          onClick={() => setCurrentView('students')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
            currentView === 'students' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          Học sinh
        </button>
        <button
          onClick={() => setCurrentView('attendance')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
            currentView === 'attendance' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          Điểm danh
        </button>
        <button
          onClick={() => setCurrentView('attendance-list')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
            currentView === 'attendance-list' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5" />
          DS Điểm danh
        </button>
        <button
          onClick={() => setCurrentView('scores')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
            currentView === 'scores' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          Nhập điểm
        </button>
        <button
          onClick={() => setCurrentView('score-list')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
            currentView === 'score-list' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          DS Điểm số
        </button>
      </nav>
      <div className="p-4 border-t border-slate-700">
        {selectedClass ? (
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">Lớp đang dạy</div>
            <div className="font-semibold text-white mt-1">{selectedClass.name}</div>
            <div className="text-xs text-slate-500 mt-1">{getGradeName(selectedClass.grade_id)}</div>
            <button
              onClick={() => setSelectedClass(null)}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Đổi lớp
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Chưa chọn lớp</div>
        )}
      </div>
    </div>
  );

  const renderClassSelector = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-600" />
          Chọn lớp để quản lý
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => openClass(cls)}
              className="bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg p-4 text-left transition group"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-800 group-hover:text-emerald-700">{cls.name}</div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
              </div>
              <div className="text-sm text-slate-500 mt-1">{getGradeName(cls.grade_id)}</div>
            </button>
          ))}
          {classes.length === 0 && (
            <div className="text-slate-400 text-sm col-span-full text-center py-8">
              Chưa có lớp nào. Vào "Khối & Lớp" để tạo lớp.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderGrades = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Quản lý Khối</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Tên khối (ví dụ: Khối 10)"
            value={newGradeName}
            onChange={(e) => setNewGradeName(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onKeyDown={(e) => e.key === 'Enter' && addGrade()}
          />
          <button
            onClick={addGrade}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>
        <div className="space-y-2">
          {grades.map((g) => (
            <div key={g.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
              <div className="font-medium text-slate-700">{g.name}</div>
              <button
                onClick={() => deleteGrade(g.id)}
                className="text-red-500 hover:text-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {grades.length === 0 && (
            <div className="text-slate-400 text-sm text-center py-4">Chưa có khối nào</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Quản lý Lớp</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <select
            value={newClassGradeId}
            onChange={(e) => setNewClassGradeId(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Chọn khối</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Tên lớp (ví dụ: 10A1)"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            placeholder="Mật khẩu lớp"
            value={newClassPassword}
            onChange={(e) => setNewClassPassword(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onKeyDown={(e) => e.key === 'Enter' && addClass()}
          />
        </div>
        <button
          onClick={addClass}
          disabled={loading}
          className="mb-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Thêm lớp
        </button>
        <div className="space-y-2">
          {classes.map((cls) => (
            <div key={cls.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
              <div>
                <div className="font-medium text-slate-700">{cls.name}</div>
                <div className="text-xs text-slate-400">{getGradeName(cls.grade_id)}</div>
              </div>
              <button
                onClick={() => deleteClass(cls.id)}
                className="text-red-500 hover:text-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="text-slate-400 text-sm text-center py-4">Chưa có lớp nào</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStudents = () => {
    if (!selectedClass) return renderClassSelector();
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Thêm học sinh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="Tên học sinh"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && addStudent()}
            />
            <input
              type="text"
              placeholder="Ghi chú (tùy chọn)"
              value={newStudentNotes}
              onChange={(e) => setNewStudentNotes(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && addStudent()}
            />
          </div>
          <button
            onClick={addStudent}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Thêm học sinh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Danh sách học sinh - {selectedClass.name}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportStudentsToExcel}
                disabled={students.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition text-sm"
              >
                <Download className="w-4 h-4" /> Xuất Excel
              </button>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm học sinh..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Tên</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Ghi chú</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      {editingStudent === s.id ? (
                        <input
                          type="text"
                          value={editStudentName}
                          onChange={(e) => setEditStudentName(e.target.value)}
                          className="px-2 py-1 border border-slate-200 rounded text-sm"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && saveEditStudent()}
                        />
                      ) : (
                        <span className="text-slate-800">{s.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingStudent === s.id ? (
                        <input
                          type="text"
                          value={editStudentNotes}
                          onChange={(e) => setEditStudentNotes(e.target.value)}
                          className="px-2 py-1 border border-slate-200 rounded text-sm"
                          onKeyDown={(e) => e.key === 'Enter' && saveEditStudent()}
                        />
                      ) : (
                        <span className="text-slate-500 text-sm">{s.notes || '-'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingStudent === s.id ? (
                          <button
                            onClick={saveEditStudent}
                            className="text-emerald-600 hover:text-emerald-700 transition"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => startEditStudent(s)}
                            className="text-slate-400 hover:text-slate-600 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteStudent(s.id)}
                          className="text-red-500 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-400 text-sm">
                      {searchStudent ? 'Không tìm thấy học sinh' : 'Chưa có học sinh nào'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    if (!selectedClass) return renderClassSelector();
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Điểm danh - {selectedClass.name}</h2>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <div className="font-medium text-slate-700">{s.name}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAttendanceMap((m) => ({ ...m, [s.id]: 'present' }))}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition flex items-center gap-1 ${
                      attendanceMap[s.id] === 'present' || !attendanceMap[s.id]
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" /> Có mặt
                  </button>
                  <button
                    onClick={() => setAttendanceMap((m) => ({ ...m, [s.id]: 'absent' }))}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition flex items-center gap-1 ${
                      attendanceMap[s.id] === 'absent'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <XCircle className="w-3 h-3" /> Vắng
                  </button>
                </div>
              </div>
            ))}
            {students.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">Chưa có học sinh trong lớp</div>
            )}
          </div>
          {students.length > 0 && (
            <button
              onClick={saveAttendance}
              disabled={loading}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              {loading ? 'Đang lưu...' : 'Lưu điểm danh'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAttendanceList = () => {
    if (!selectedClass) return renderClassSelector();
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-bold text-slate-800">Danh sách điểm danh - {selectedClass.name}</h2>
            <input
              type="date"
              value={attendanceListDate}
              onChange={(e) => setAttendanceListDate(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={loadAttendanceList}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
            >
              Xem
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Tên</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-800">
                      {/* @ts-ignore */}
                      {a.students?.name || 'Học sinh'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                          a.status === 'present'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {a.status === 'present' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Có mặt
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Vắng
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                {attendanceList.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center py-8 text-slate-400 text-sm">
                      Không có dữ liệu điểm danh cho ngày này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderScores = () => {
    if (!selectedClass) return renderClassSelector();
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Nhập điểm số - {selectedClass.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <input
              type="text"
              placeholder="Môn học"
              value={scoreSubject}
              onChange={(e) => setScoreSubject(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="date"
              value={scoreDate}
              onChange={(e) => setScoreDate(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm học sinh..."
                value={searchStudent}
                onChange={(e) => {
                  setSearchStudent(e.target.value);
                  const filtered = students.filter((s) =>
                    s.name.toLowerCase().includes(e.target.value.toLowerCase())
                  );
                  setStudentSuggestions(filtered);
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {studentSuggestions.length > 0 && searchStudent && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {studentSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedScoreStudent(s.id);
                      setSearchStudent(s.name);
                      setStudentSuggestions([]);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="Điểm"
                value={scoreValue}
                onChange={(e) => setScoreValue(e.target.value)}
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={saveScore}
                disabled={loading || !selectedScoreStudent || !scoreValue}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                {loading ? 'Đang lưu...' : 'Lưu điểm'}
              </button>
            </div>
            {selectedScoreStudent && (
              <div className="text-sm text-emerald-600">
                Đang nhập điểm cho: {students.find((s) => s.id === selectedScoreStudent)?.name}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderScoreList = () => {
    if (!selectedClass) return renderClassSelector();
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <h2 className="text-lg font-bold text-slate-800">Danh sách điểm số - {selectedClass.name}</h2>
            <input
              type="text"
              placeholder="Lọc theo môn học..."
              value={scoreListSubject}
              onChange={(e) => setScoreListSubject(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && loadScoreList()}
            />
            <button
              onClick={loadScoreList}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
            >
              Xem
            </button>
            <button
              onClick={exportScoresToExcel}
              disabled={scoreList.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition text-sm"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Tên</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Môn</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Điểm</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {scoreList.map((sc) => (
                  <tr key={sc.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-800">
                      {/* @ts-ignore */}
                      {sc.students?.name || 'Học sinh'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-sm">{sc.subject}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        sc.score >= 8 ? 'text-emerald-600' : sc.score >= 5 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {sc.score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-sm">{sc.date}</td>
                  </tr>
                ))}
                {scoreList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 text-sm">
                      Không có dữ liệu điểm số
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'grades': return renderGrades();
      case 'students': return renderStudents();
      case 'attendance': return renderAttendance();
      case 'attendance-list': return renderAttendanceList();
      case 'scores': return renderScores();
      case 'score-list': return renderScoreList();
      default: return renderStudents();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {renderSidebar()}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Nhập mật khẩu lớp</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <div className="text-sm text-slate-500 mb-1">Lớp</div>
              <div className="font-semibold text-slate-800">{pendingClass?.name}</div>
            </div>
            <input
              type="password"
              placeholder="Mật khẩu"
              value={classPassword}
              onChange={(e) => { setClassPassword(e.target.value); setPasswordError(''); }}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
              autoFocus
            />
            {passwordError && (
              <div className="text-red-500 text-sm mb-2">{passwordError}</div>
            )}
            <button
              onClick={verifyPassword}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition"
            >
              Vào lớp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
