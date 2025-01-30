import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  email: string;
  department: string;
  year?: string;
  section?: string;
  role: 'student' | 'faculty' | 'admin';
}

export interface Complaint {
  id: string;
  message: string;
  category: string;
  department: string;
  createdAt: Timestamp;
  status: 'pending' | 'inProgress' | 'resolved';
  userId: string;
  isAnonymous: boolean;
  email:string;
  section:string;
  year:string;
}