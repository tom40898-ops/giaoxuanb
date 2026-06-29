export interface Grade {
  id: string;
  name: string;
  created_at: string;
}

export interface ClassItem {
  id: string;
  grade_id: string;
  name: string;
  password: string;
  created_at: string;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent';
  created_at: string;
}

export interface Score {
  id: string;
  class_id: string;
  student_id: string;
  subject: string;
  score: number;
  date: string;
  created_at: string;
}
