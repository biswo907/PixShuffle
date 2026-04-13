import UpdateModal from '@/components/UpdateModal';
import * as Updates from 'expo-updates';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export default function UpdateHandler() {
  const {
    isUpdateAvailable,
    isUpdatePending,
    isDownloading,
    availableUpdate,
  } = Updates.useUpdates();

  const [isVisible, setIsVisible] = useState(false);

  // Extract update message from manifest (EAS Update format)
  const manifest: any = availableUpdate?.manifest;
  const updateMessage = manifest?.extra?.expoClient?.extra?.eas?.message || manifest?.message;

  useEffect(() => {
    // Show the modal if an update is available or pending
    if (isUpdateAvailable || isUpdatePending) {
      setIsVisible(true);
    }
  }, [isUpdateAvailable, isUpdatePending]);

  const handleUpdate = async () => {
    try {
      if (isUpdateAvailable && !isUpdatePending) {
        // Fetch the update if it's available but not yet downloaded
        await Updates.fetchUpdateAsync();
      }
      // Reload the app to apply the update
      await Updates.reloadAsync();
    } catch (error: any) {
      console.error('Failed to update app:', error);
      setIsVisible(false);
      Alert.alert('Failed to update app', error?.message);
    }
  };

  return (
    <UpdateModal 
      isVisible={true}
      isDownloading={isDownloading}
      onUpdate={handleUpdate}
      onClose={() => setIsVisible(false)}
      updateMessage={updateMessage}
    />
  );
}