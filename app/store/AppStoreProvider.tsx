import React, { PropsWithChildren, useEffect } from 'react';
import { useAppStore } from './appStore';
import { useUserStore } from './userStore';

const AppStoreProvider: React.FC<PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    useAppStore.persist.rehydrate();
    useUserStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
};

export default AppStoreProvider;
