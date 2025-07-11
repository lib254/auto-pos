import React, { useState, useEffect } from 'react';
import { useRegister } from '../hooks/useRegister';
import { format } from 'date-fns';
import { FiClock, FiCheckCircle, FiDollarSign, FiInfo } from 'react-icons/fi';
import type { RegisterSession } from '../types/register'; // Adjust path if needed

const PreviousSessionsPage: React.FC = () => {
  const { previousSessions, reopenSession } = useRegister();
  const [selectedSession, setSelectedSession] = useState<RegisterSession | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Number of sessions per page

  // Calculate totals for summary cards
  const totalSessions = previousSessions.length;
  const activeSessions = previousSessions.filter(s => !s.closedAt).length;
  const totalCashFlow = previousSessions.reduce((sum, session) => {
    if (session.closingBalance !== undefined) {
      return sum + Number(session.closingBalance);
    }
    return sum;
  }, 0);

  // Pagination logic
  const paginatedSessions = previousSessions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(previousSessions.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [previousSessions.length]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session History</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage all your previous register sessions
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <FiClock size={20} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
              <p className="text-2xl font-semibold text-gray-900">{totalSessions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50 text-green-600">
              <FiCheckCircle size={20} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Sessions</h3>
              <p className="text-2xl font-semibold text-gray-900">{activeSessions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50 text-purple-600">
              <FiDollarSign size={20} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Cash Flow</h3>
              <p className="text-2xl font-semibold text-gray-900">
                Ksh{totalCashFlow.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {previousSessions.length === 0 ? (
          <div className="text-center py-12">
            <FiInfo className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No sessions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by opening a new register session.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opened At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Closed At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opening Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Closing Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{session.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${session.closedAt ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {session.closedAt ? 'Closed' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.openedAt ? format(new Date(session.openedAt), 'PPpp') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.closedAt ? format(new Date(session.closedAt), 'PPpp') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Ksh{Number(session.openingBalance).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.closingBalance !== undefined
                        ? `Ksh${Number(session.closingBalance).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        View Details
                      </button>
                      {session.closedAt && (
                        <button
                          onClick={() => reopenSession(session.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination would go here */}
      {previousSessions.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
            {' '}to{' '}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, previousSessions.length)}
            </span>
            {' '}of{' '}
            <span className="font-medium">{previousSessions.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 relative">
            <button
              onClick={() => setSelectedSession(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4">Session Details</h2>
            <div className="mb-2">
              <strong>Session ID:</strong> #{selectedSession.id}
            </div>
            <div className="mb-2">
              <strong>Opened At:</strong> {selectedSession.openedAt ? format(new Date(selectedSession.openedAt), 'PPpp') : 'N/A'}
            </div>
            <div className="mb-2">
              <strong>Closed At:</strong> {selectedSession.closedAt ? format(new Date(selectedSession.closedAt), 'PPpp') : '—'}
            </div>
            <div className="mb-2">
              <strong>Opening Balance:</strong> Ksh{Number(selectedSession.openingBalance).toFixed(2)}
            </div>
            <div className="mb-2">
              <strong>Closing Balance:</strong> {selectedSession.closingBalance !== undefined ? `Ksh${Number(selectedSession.closingBalance).toFixed(2)}` : '—'}
            </div>
            {selectedSession.difference !== undefined && (
              <div className="mb-2">
                <strong>Difference:</strong>{' '}
                <span className={
                  selectedSession.difference === 0 ? 'text-green-600' :
                  selectedSession.difference > 0 ? 'text-blue-600' : 'text-red-600'
                }>
                  {selectedSession.difference === 0
                    ? 'Balanced'
                    : selectedSession.difference > 0
                      ? `Excess: Ksh${selectedSession.difference.toFixed(2)}`
                      : `Shortage: Ksh${Math.abs(selectedSession.difference).toFixed(2)}`}
                </span>
              </div>
            )}
            {selectedSession.notes && (
              <div className="mb-2">
                <strong>Notes:</strong> {selectedSession.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousSessionsPage;