export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  branch?: string;
  year?: string;
  section?: string;
  college_id?: string;
}

export interface Activity {
  id: string;
  student_id: string;
  title: string;
  category: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  file_name: string;
  file_data?: string;
  extracted_text: string;
  description?: string;
  created_at: string;
  student_name?: string;
  branch?: string;
  year?: string;
}

export interface Stats {
  total_students: number;
  pending_reviews: number;
  verified_activities: number;
}
