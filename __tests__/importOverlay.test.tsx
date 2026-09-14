import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ImportOverlay } from '@/lib/components/ImportOverlay';
import type { ImportState } from '@/lib/importContext';

const base: ImportState = {
  phase: 'idle', current: 0, total: 0, latestTitle: null, imported: 0, skipped: 0, error: null,
};

describe('ImportOverlay', () => {
  it('renders nothing while idle', () => {
    render(<ImportOverlay state={base} onDismiss={jest.fn()} />);
    expect(screen.queryByTestId('import-overlay')).toBeNull();
  });

  it('shows the running count and the latest film while fetching', () => {
    render(
      <ImportOverlay
        state={{ ...base, phase: 'fetching', current: 42, total: 140, latestTitle: 'Parasite' }}
        onDismiss={jest.fn()}
      />,
    );
    expect(screen.getByText('Loading the reel')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('of 140')).toBeTruthy();
    expect(screen.getByText('Parasite')).toBeTruthy();
    expect(screen.queryByTestId('import-done')).toBeNull();
  });

  it('reports the result and dismisses when done', () => {
    const onDismiss = jest.fn();
    render(
      <ImportOverlay
        state={{ ...base, phase: 'done', current: 138, total: 138, imported: 138, skipped: 2 }}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText('Reel loaded')).toBeTruthy();
    expect(screen.getByText(/138 films added.*2 already in your list/)).toBeTruthy();
    fireEvent.press(screen.getByTestId('import-done'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows the error when the import fails', () => {
    render(
      <ImportOverlay state={{ ...base, phase: 'failed', error: 'Network request failed' }} onDismiss={jest.fn()} />,
    );
    expect(screen.getByText('Import failed')).toBeTruthy();
    expect(screen.getByText('Network request failed')).toBeTruthy();
  });
});
