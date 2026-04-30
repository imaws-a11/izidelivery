import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { WalletProvider } from './contexts/WalletContext';
import { OrderProvider } from './contexts/OrderContext';
import { AddressProvider } from './contexts/AddressContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppProvider>
      <AddressProvider>
        <WalletProvider>
          <OrderProvider>
            {children}
          </OrderProvider>
        </WalletProvider>
      </AddressProvider>
    </AppProvider>
  );
};
