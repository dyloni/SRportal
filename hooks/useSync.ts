import React, { useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import * as db from '../utils/db';
// FIX: The Action type is exported from `types.ts`, not `DataContext.tsx`.
import { Action } from '../types';

export const useSync = (dispatch: React.Dispatch<Action>) => {
  const isOnline = useOnlineStatus();

  const syncData = useCallback(async () => {
    console.log('Checking for items to sync...');
    const queue = await db.getQueue();
    if (queue.length === 0) {
      console.log('Sync queue is empty.');
      return;
    }

    console.log(`Syncing ${queue.length} items...`);
    
    // In a real app, you'd send this to a backend API endpoint.
    // Here, we're dispatching directly to our client-side state.
    for (const action of queue) {
      // Add a small delay to simulate network latency
      await new Promise(res => setTimeout(res, 100));
      dispatch(action);
    }
    
    await db.clearQueue();
    console.log('Sync complete, queue cleared.');

  }, [dispatch]);

  useEffect(() => {
    db.initDB(); // Initialize DB on app start.

    if (isOnline) {
      syncData();
    }
  }, [isOnline, syncData]);
};