import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';

import { generateAndShareTopTen } from '@/lib/shareTopTen';

const mockCaptureRef = captureRef as jest.MockedFunction<typeof captureRef>;
const mockShareAsync = Sharing.shareAsync as jest.MockedFunction<typeof Sharing.shareAsync>;
const mockIsAvailable = Sharing.isAvailableAsync as jest.MockedFunction<typeof Sharing.isAvailableAsync>;

describe('generateAndShareTopTen', () => {
  const fakeRef = { current: {} } as RefObject<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailable.mockResolvedValue(true);
    mockCaptureRef.mockResolvedValue('file:///tmp/poster-grid.png');
  });

  it('captures the view and shares the image', async () => {
    const result = await generateAndShareTopTen(fakeRef);

    expect(mockCaptureRef).toHaveBeenCalledWith(fakeRef, {
      format: 'png',
      quality: 1,
    });
    expect(mockShareAsync).toHaveBeenCalledWith('file:///tmp/poster-grid.png', {
      mimeType: 'image/png',
      dialogTitle: 'Share your top movies',
    });
    expect(result).toEqual({ success: true });
  });

  it('returns error when sharing is not available', async () => {
    mockIsAvailable.mockResolvedValue(false);

    const result = await generateAndShareTopTen(fakeRef);

    expect(result).toEqual({ success: false, error: 'Sharing is not available on this device' });
    expect(mockCaptureRef).not.toHaveBeenCalled();
  });

  it('returns error when ref is null', async () => {
    const nullRef = { current: null } as RefObject<any>;
    const result = await generateAndShareTopTen(nullRef);

    expect(result).toEqual({ success: false, error: 'View reference is not available' });
    expect(mockCaptureRef).not.toHaveBeenCalled();
  });

  it('returns error when capture fails', async () => {
    mockCaptureRef.mockRejectedValue(new Error('capture failed'));

    const result = await generateAndShareTopTen(fakeRef);

    expect(result).toEqual({ success: false, error: 'capture failed' });
  });

  it('returns error when share fails', async () => {
    mockShareAsync.mockRejectedValue(new Error('share failed'));

    const result = await generateAndShareTopTen(fakeRef);

    expect(result).toEqual({ success: false, error: 'share failed' });
  });
});
