import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { LogOut, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import type { Complaint } from '../types';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState<string>('');
  const [replyVisible, setReplyVisible] = useState<{ [key: string]: boolean }>({});
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'inProgress' | 'resolved'>('all');

  useEffect(() => {
    if (!user || user.role !== 'faculty') return;

    const q = query(
      collection(db, 'complaints'),
      where('department', '==', user.department)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const complaintsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];

      console.log('Fetched complaints:', complaintsData);

      setComplaints(complaintsData.sort((a, b) => 
        new Date(b.createdAt.seconds * 1000).getTime() - new Date(a.createdAt.seconds * 1000).getTime()
      ));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching complaints:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (complaintId: string, status: Complaint['status']) => {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), { status });
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleReply = async (complaintId: string) => {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), { reply });
      toast.success('Reply sent successfully');
      setReply('');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const toggleReply = (complaintId: string) => {
    setReplyVisible(prev => ({ ...prev, [complaintId]: !prev[complaintId] }));
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (selectedStatus === 'all') return true;
    return complaint.status === selectedStatus;
  });

  if (user?.role !== 'faculty') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={() => auth.signOut()}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <span className="hidden sm:inline">Sign out</span>
            <LogOut className="w-4 h-4 sm:hidden" />
          </button>
        </div>
      </header>

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center sm:justify-start space-x-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${selectedStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${selectedStatus === 'pending' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-100'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setSelectedStatus('inProgress')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${selectedStatus === 'inProgress' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-100'}`}
            >
              In Progress
            </button>
            <button
              onClick={() => setSelectedStatus('resolved')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${selectedStatus === 'resolved' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-100'}`}
            >
              Resolved
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="text-center">Loading complaints...</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center text-gray-500">No complaints found</div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <li key={complaint.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 capitalize">
                            {complaint.category}
                          </p>
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {new Date(complaint.createdAt.seconds * 1000).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex space-x-2 mt-2 sm:mt-0">
                          <button
                            onClick={() => updateStatus(complaint.id, 'pending')}
                            className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded ${
                              complaint.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Pending
                          </button>
                          <button
                            onClick={() => updateStatus(complaint.id, 'inProgress')}
                            className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded ${
                              complaint.status === 'inProgress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <AlertCircle className="w-4 h-4 mr-1" />
                            In Progress
                          </button>
                          <button
                            onClick={() => updateStatus(complaint.id, 'resolved')}
                            className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded ${
                              complaint.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Resolved
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-900">{complaint.message}</p>
                        <p className="text-xs text-gray-500">Year: {complaint.year}<br />Section: {complaint.section}</p>
                      </div>
                      {!complaint.isAnonymous && (
                        <div className="mt-0">
                          <p className="text-xs text-gray-500">
                            Submitted by: {complaint.email}
                          </p>
                        </div>
                      )}
                      <button
                          onClick={() => toggleReply(complaint.id)}
                          className="mt-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {replyVisible[complaint.id] ? 'Cancel' : 'Reply'}
                        </button>
                        {replyVisible[complaint.id] && (
                          <>
                            <textarea
                              value={reply}
                              onChange={(e) => setReply(e.target.value)}
                              placeholder="Type your reply here..."
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <button
                              onClick={() => handleReply(complaint.id)}
                              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Send Reply
                            </button>
                          </>
                        )}
                      {complaint.reply && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-900">Reply: {complaint.reply}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}