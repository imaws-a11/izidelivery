import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { WalletProvider } from './contexts/WalletContext';
import { OrderProvider } from './contexts/OrderContext';
import { AddressProvider } from './contexts/AddressContext';
import { NotificationProvider } from './contexts/NotificationContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppProvider>
      <AddressProvider>
        <WalletProvider>
          <OrderProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </OrderProvider>
        </WalletProvider>
      </AddressProvider>
    </AppProvider>
  );
};
