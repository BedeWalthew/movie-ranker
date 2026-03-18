import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RankNudgeCard } from '@/lib/components/RankNudgeCard';
import type { Movie } from '@/lib/schema';

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return { Ionicons: (props: any) => <Text {...props}>{props.name}</Text> };
});

const mockMovie: Movie = {
  id: 'movie-1',
  title: 'Parasite',
  year: 2019,
  letterboxdUri: 'https://letterboxd.com/film/parasite-2019/',
  letterboxdRating: 4.5,
  posterUrl: 'https://image.tmdb.org/poster.jpg',
  director: 'Bong Joon-ho',
  rank: null,
};

const movieNoPoster: Movie = {
  ...mockMovie,
  id: 'movie-2',
  title: 'Unknown Film',
  posterUrl: null,
};

describe('RankNudgeCard', () => {
  it('renders the card with testID', () => {
    render(<RankNudgeCard movie={mockMovie} onPress={jest.fn()} />);
    expect(screen.getByTestId('rank-nudge-card')).toBeTruthy();
  });

  it('displays the movie title', () => {
    render(<RankNudgeCard movie={mockMovie} onPress={jest.fn()} />);
    expect(screen.getByText('Parasite')).toBeTruthy();
  });

  it('displays the movie year', () => {
    render(<RankNudgeCard movie={mockMovie} onPress={jest.fn()} />);
    expect(screen.getByText('2019')).toBeTruthy();
  });

  it('displays the CTA text', () => {
    render(<RankNudgeCard movie={mockMovie} onPress={jest.fn()} />);
    expect(screen.getByText('Rank this movie!')).toBeTruthy();
  });

  it('displays the prompt heading', () => {
    render(<RankNudgeCard movie={mockMovie} onPress={jest.fn()} />);
    expect(screen.getByText('Rank a movie?')).toBeTruthy();
  });

  it('shows poster thumbnail when posterUrl is present', () => {
    render(<RankNudgeCard movie={mockMovie} onPress={jest.fn()} />);
    expect(screen.getByTestId('nudge-poster')).toBeTruthy();
  });

  it('shows a placeholder when posterUrl is null', () => {
    render(<RankNudgeCard movie={movieNoPoster} onPress={jest.fn()} />);
    expect(screen.getByTestId('nudge-poster-placeholder')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<RankNudgeCard movie={mockMovie} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('rank-nudge-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
