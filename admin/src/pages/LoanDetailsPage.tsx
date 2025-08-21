import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  User,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send
} from 'lucide-react';
import { format } from 'date-fns';

interface LoanDetails {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  purpose: string;
  status: 'รอการอนุมัติ' | 'อนุมัติแล้ว' | 'ปฏิเสธ' | 'เสร็จสิ้น';
  term: number;
  interestRate: number;
  monthlyPayment: number;
  totalPayable: number;
  applicationDate: string;
  lastUpdated: string;
  documents: {
    id: string;
    name: string;
    type: string;
    uploadDate: string;
  }[];
  notes: {
    id: string;
    author: string;
    content: string;
    timestamp: string;
  }[];
}

const LoanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'notes'>('details');

  // Mock data - In a real app, this would come from an API
  const loanDetails: LoanDetails = {
    id: 'L1',
    userId: 'U1',
    userName: 'John Doe',
    amount: 10000,
    purpose: 'Business Expansion',
    status: 'รอการอนุมัติ',
    term: 12,
    interestRate: 2.90,
    monthlyPayment: 879.23,
    totalPayable: 10550.76,
    applicationDate: '2024-03-01T10:30:00Z',
    lastUpdated: '2024-03-01T10:30:00Z',
    documents: [
      {
        id: 'D1',
        name: 'ID Card.pdf',
        type: 'Identity Document',
        uploadDate: '2024-03-01T10:25:00Z'
      },
      {
        id: 'D2',
        name: 'Bank Statement.pdf',
        type: 'Financial Document',
        uploadDate: '2024-03-01T10:28:00Z'
      }
    ],
    notes: [
      {
        id: 'N1',
        author: 'Admin',
        content: 'Application received and under review',
        timestamp: '2024-03-01T10:35:00Z'
      },
      {
        id: 'N2',
        author: 'System',
        content: 'Document verification completed',
        timestamp: '2024-03-01T11:00:00Z'
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'อนุมัติแล้ว':
        return 'bg-green-100 text-green-800';
      case 'ปฏิเสธ':
        return 'bg-red-100 text-red-800';
      case 'รอการอนุมัติ':
        return 'bg-yellow-100 text-yellow-800';
      case 'เสร็จสิ้น':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'อนุมัติแล้ว':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'ปฏิเสธ':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'รอการอนุมัติ':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'เสร็จสิ้น':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    // In a real app, this would make an API call
    setNewNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/loans" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Loan Application Details</h1>
        </div>
        <div className="flex items-center space-x-4">
          {loanDetails.status === 'รอการอนุมัติ' && (
            <>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Approve
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(['details', 'documents', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <Link 
                      to={`/users/${loanDetails.userId}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800"
                    >
                      {loanDetails.userName}
                    </Link>
                    <p className="text-sm text-gray-500">
                      Applied on {format(new Date(loanDetails.applicationDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(loanDetails.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loanDetails.status)}`}>
                    {loanDetails.status.charAt(0).toUpperCase() + loanDetails.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount Requested</span>
                        <span className="font-medium">${loanDetails.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Purpose</span>
                        <span className="font-medium">{loanDetails.purpose}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Term</span>
                        <span className="font-medium">{loanDetails.term} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Interest Rate</span>
                        <span className="font-medium">{loanDetails.interestRate}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Monthly Payment</span>
                        <span className="font-medium">${loanDetails.monthlyPayment.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Payable</span>
                        <span className="font-medium">${loanDetails.totalPayable.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Interest</span>
                        <span className="font-medium">
                          ${(loanDetails.totalPayable - loanDetails.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {[
                        {
                          title: 'Application Submitted',
                          date: loanDetails.applicationDate,
                          icon: FileText,
                          iconBackground: 'bg-blue-500'
                        },
                        {
                          title: 'Document Verification',
                          date: loanDetails.lastUpdated,
                          icon: CheckCircle2,
                          iconBackground: 'bg-green-500'
                        }
                      ].map((event, index) => (
                        <li key={index}>
                          <div className="relative pb-8">
                            {index !== 1 && (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span
                                  className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${event.iconBackground}`}
                                >
                                  <event.icon className="h-5 w-5 text-white" aria-hidden="true" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-500">{event.title}</p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {format(new Date(event.date), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loanDetails.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.type}</p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label htmlFor="note" className="sr-only">
                    Add note
                  </label>
                  <div className="relative">
                    <textarea
                      id="note"
                      rows={3}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <div className="absolute bottom-2 right-2">
                      <button
                        type="submit"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              <div className="flow-root">
                <ul className="-mb-8">
                  {loanDetails.notes.map((note, index) => (
                    <li key={note.id}>
                      <div className="relative pb-8">
                        {index !== loanDetails.notes.length - 1 && (
                          <span
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">{note.author}</span>
                              </div>
                              <p className="mt-0.5 text-sm text-gray-500">
                                {format(new Date(note.timestamp), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                              <p>{note.content}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanDetailsPage;
