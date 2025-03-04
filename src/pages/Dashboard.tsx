import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { LogOut, Send } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('academic');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('submit');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchComplaints = async () => {
      const complaintsQuery = query(collection(db, 'complaints'), where('userId', '==', user?.uid));
      const querySnapshot = await getDocs(complaintsQuery);
      const fetchedComplaints = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(fetchedComplaints);
    };

    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'complaints'), {
        message,
        category,
        department: user?.department,
        createdAt: new Date(),
        status: 'pending',
        userId: user?.uid,
        isAnonymous,
        email: isAnonymous ? null : user?.email,
        section: user?.section,
        year: user?.year,
      });

      setMessage('');
      toast.success('Complaint submitted successfully');
    } catch (error) {
      toast.error('Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 flex-wrap">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MITS Complaint Box</h1>
            </div>
            <div className="flex items-center mt-2">
              <span className="text-gray-700 mr-4 text-sm min-w-[150px]">
                {user?.email} 
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:hidden mt-[-25px] ml-[20px]"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>


      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row space-x-0 sm:space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('submit')}
            className={`w-full sm:w-auto px-4 py-2 font-medium transition duration-300 ease-in-out border rounded-md ${activeTab === 'submit' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300'}`}
          >
            Submit Complaint
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full sm:w-auto px-4 py-2 font-medium transition duration-300 ease-in-out border rounded-md ${activeTab === 'history' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300'}`}
          >
            Your Complaints
          </button>
        </div>

        {activeTab === 'submit' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Submit a Complaint
                </h3>
                <form onSubmit={handleSubmit} className="mt-5">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-md"
                      >
                        <option value="academic">Academic</option>
                        <option value="facilities">Facilities</option>
                        <option value="harassment">Harassment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                        Your Complaint
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Describe your complaint..."
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        id="anonymous"
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
                        Submit anonymously
                      </label>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-300 ease-in-out"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {loading ? 'Submitting...' : 'Submit Complaint'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="mt-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Your Complaints</h3>
            <ul className="space-y-4">
              {complaints.map(complaint => (
                <li key={complaint.id} className="bg-white shadow rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="flex-1">
                    <span className="font-semibold text-gray-800">{complaint.category}</span>
                    <p className="text-gray-600 text-sm">{complaint.message}</p>
                    {complaint.reply && (
                      <p className="text-gray-500">Reply: {complaint.reply}</p>
                    )}
                  </div>
                  <span className={`mt-2 sm:mt-0 sm:ml-4 px-2 py-1 text-xs font-semibold rounded-full ${complaint.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                    {complaint.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}