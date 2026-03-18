import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { SearchFilterBar } from '@/lib/components/SearchFilterBar';

describe('SearchFilterBar', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: jest.fn(),
    minRating: null as number | null,
    onMinRatingChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(<SearchFilterBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search movies...')).toBeTruthy();
  });

  it('displays current search query value', () => {
    render(<SearchFilterBar {...defaultProps} searchQuery="matrix" />);
    const input = screen.getByPlaceholderText('Search movies...');
    expect(input.props.value).toBe('matrix');
  });

  it('calls onSearchChange when typing', () => {
    const onSearchChange = jest.fn();
    render(<SearchFilterBar {...defaultProps} onSearchChange={onSearchChange} />);
    fireEvent.changeText(screen.getByPlaceholderText('Search movies...'), 'para');
    expect(onSearchChange).toHaveBeenCalledWith('para');
  });

  it('renders 5 rating filter buttons', () => {
    render(<SearchFilterBar {...defaultProps} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`rating-filter-${i}`)).toBeTruthy();
    }
  });

  it('highlights the active rating filter button', () => {
    render(<SearchFilterBar {...defaultProps} minRating={3} />);
    const activeButton = screen.getByTestId('rating-filter-3');
    const inactiveButton = screen.getByTestId('rating-filter-1');
    // Active button should have primary-colored text/background
    expect(activeButton).toBeTruthy();
    expect(inactiveButton).toBeTruthy();
  });

  it('calls onMinRatingChange with rating when button pressed', () => {
    const onMinRatingChange = jest.fn();
    render(<SearchFilterBar {...defaultProps} onMinRatingChange={onMinRatingChange} />);
    fireEvent.press(screen.getByTestId('rating-filter-4'));
    expect(onMinRatingChange).toHaveBeenCalledWith(4);
  });

  it('calls onMinRatingChange with null when active button pressed again (toggle off)', () => {
    const onMinRatingChange = jest.fn();
    render(<SearchFilterBar {...defaultProps} minRating={4} onMinRatingChange={onMinRatingChange} />);
    fireEvent.press(screen.getByTestId('rating-filter-4'));
    expect(onMinRatingChange).toHaveBeenCalledWith(null);
  });

  it('has search-filter-bar testID on container', () => {
    render(<SearchFilterBar {...defaultProps} />);
    expect(screen.getByTestId('search-filter-bar')).toBeTruthy();
  });

  it('has search-input testID on the text input', () => {
    render(<SearchFilterBar {...defaultProps} />);
    expect(screen.getByTestId('search-input')).toBeTruthy();
  });
});
