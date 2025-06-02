import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isInRoom: boolean;
  currentRoomId: string | null;
  clientId: string | null;
  error: string | null;
}

const ConnectionStatus = ({
  isConnected,
  isInRoom,
  currentRoomId,
  clientId,
  error,
}: ConnectionStatusProps) => {
  return (
    <div className="border-b border-gray-200 p-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {isInRoom && currentRoomId && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium">Room: {currentRoomId}</span>
            </div>
          )}
        </div>

        {clientId && (
          <div className="text-xs text-gray-500">
            Client ID: {clientId.slice(0, 8)}...
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export { ConnectionStatus };
