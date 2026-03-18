import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';

type ShareResult =
  | { success: true }
  | { success: false; error: string };

export async function generateAndShareTopTen(
  viewRef: RefObject<any>,
): Promise<ShareResult> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    if (!viewRef.current) {
      return { success: false, error: 'View reference is not available' };
    }

    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share your top movies',
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
