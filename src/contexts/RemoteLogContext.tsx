import React, { ReactNode, createContext, useContext } from 'react';

import { SendSVGPathParams, useRemoteLog } from '@hooks/useRemoteLog';

interface RemoteLogContextType {
  isConnected: boolean;
  messages: any[];
  sendMessage: (message: string) => void;
  sendJSON: (json: any) => void;
  sendSVGPath: (params: SendSVGPathParams) => void;
}

const RemoteLogContext = createContext<RemoteLogContextType | undefined>(
  undefined
);

export const RemoteLogProvider = ({
  children,
  url
}: {
  children: ReactNode;
  url: string;
}) => {
  const state = useRemoteLog(url);

  return (
    <RemoteLogContext.Provider value={state}>
      {children}
    </RemoteLogContext.Provider>
  );
};

export const useRemoteLogContext = () => {
  const context = useContext(RemoteLogContext);
  if (context === undefined) {
    throw new Error(
      'useRemoteLogContext must be used within a RemoteLogProvider'
    );
  }
  return context;
};
