/*
# Student Management Schema

1. New Tables
- `grades`: Khối (Grade level) - e.g., Khối 10, Khối 11, Khối 12
  - `id` (uuid, primary key)
  - `name` (text, not null) - grade name
  - `created_at` (timestamptz)

- `classes`: Lớp (Class) - e.g., 10A, 10B
  - `id` (uuid, primary key)
  - `grade_id` (uuid, references grades)
  - `name` (text, not null) - class name
  - `password` (text, not null) - password to access this class
  - `created_at` (timestamptz)

- `students`: Học sinh (Student)
  - `id` (uuid, primary key)
  - `class_id` (uuid, references classes)
  - `name` (text, not null) - student name
  - `notes` (text) - notes/remarks
  - `created_at` (timestamptz)

- `attendance`: Điểm danh (Attendance)
  - `id` (uuid, primary key)
  - `class_id` (uuid, references classes)
  - `student_id` (uuid, references students)
  - `date` (date, not null) - attendance date
  - `status` (text, not null) - 'present' or 'absent'
  - `created_at` (timestamptz)

- `scores`: Điểm số (Scores)
  - `id` (uuid, primary key)
  - `class_id` (uuid, references classes)
  - `student_id` (uuid, references students)
  - `subject` (text, not null) - subject name
  - `score` (numeric, not null) - score value
  - `date` (date, not null) - date of the exam/assignment
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all tables.
- Single-tenant app: allow anon and authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  name text NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  score numeric NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grades_select" ON grades;
CREATE POLICY "grades_select" ON grades FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "grades_insert" ON grades;
CREATE POLICY "grades_insert" ON grades FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "grades_update" ON grades;
CREATE POLICY "grades_update" ON grades FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "grades_delete" ON grades;
CREATE POLICY "grades_delete" ON grades FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "classes_select" ON classes;
CREATE POLICY "classes_select" ON classes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "classes_insert" ON classes;
CREATE POLICY "classes_insert" ON classes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "classes_update" ON classes;
CREATE POLICY "classes_update" ON classes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "classes_delete" ON classes;
CREATE POLICY "classes_delete" ON classes FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "students_select" ON students;
CREATE POLICY "students_select" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "students_insert" ON students;
CREATE POLICY "students_insert" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "students_update" ON students;
CREATE POLICY "students_update" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "students_delete" ON students;
CREATE POLICY "students_delete" ON students FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "attendance_select" ON attendance;
CREATE POLICY "attendance_select" ON attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "attendance_insert" ON attendance;
CREATE POLICY "attendance_insert" ON attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "attendance_update" ON attendance;
CREATE POLICY "attendance_update" ON attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "attendance_delete" ON attendance;
CREATE POLICY "attendance_delete" ON attendance FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "scores_select" ON scores;
CREATE POLICY "scores_select" ON scores FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "scores_insert" ON scores;
CREATE POLICY "scores_insert" ON scores FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "scores_update" ON scores;
CREATE POLICY "scores_update" ON scores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "scores_delete" ON scores;
CREATE POLICY "scores_delete" ON scores FOR DELETE TO anon, authenticated USING (true);
