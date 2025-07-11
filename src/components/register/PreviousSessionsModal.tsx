import React from 'react';
import { X } from 'lucide-react';
import { RegisterSession } from '../../types/register';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessions: RegisterSession[];
  onReopen: (sessionId: string) => void;
}

export const PreviousSessionsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sessions,
  onReopen
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Previous Register Sessions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {sessions.slice(0, 5).map((session) => (
            <div key={session.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium">
                    {new Date(session.openedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.openedAt).toLocaleTimeString()} - 
                    {session.closedAt ? new Date(session.closedAt).toLocaleTimeString() : 'Open'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Opening: Ksh{session.openingBalance.toFixed(2)}</p>
                  {session.closingBalance && (
                    <p className="text-sm text-gray-600">
                      Closing: Ksh{session.closingBalance.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-sm text-gray-600">Cash</p>
                  <p className="font-medium">Ksh{session.paymentTotals.cash.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-sm text-gray-600">Card</p>
                  <p className="font-medium">Ksh{session.paymentTotals.card.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-sm text-gray-600">Mobile</p>
                  <p className="font-medium">Ksh{session.paymentTotals.mobile.toFixed(2)}</p>
                </div>
              </div>

              {session.difference && (
                <div className={`text-sm mb-3 ${
                  session.difference === 0 ? 'text-green-600' :
                  session.difference > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {session.difference === 0 ? 'Balanced' :
                   session.difference > 0 ? `Excess: $${session.difference.toFixed(2)}` :
                   `Shortage: $${Math.abs(session.difference).toFixed(2)}`}
                </div>
              )}

              {session.notes && (
                <p className="text-sm text-gray-600 mb-3">
                  Notes: {session.notes}
                </p>
              )}

              <button
                onClick={() => onReopen(session.id)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Reopen Register
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              onClose();
              navigate('/previous-sessions');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            See all previous sessions
          </button>
        </div>
      </div>
    </div>
  );
};