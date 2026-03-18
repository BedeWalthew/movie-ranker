import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PosterGrid } from '@/lib/components/PosterGrid';
import type { Movie } from '@/lib/schema';

function makeMovie(overrides: Partial<Movie> & { id: string; rank: number }): Movie {
  return {
    title: `Movie ${overrides.rank}`,
    year: 2020,
    letterboxdUri: `https://letterboxd.com/film/${overrides.id}`,
    letterboxdRating: 4.0,
    posterUrl: `https://image.tmdb.org/t/p/w500/${overrides.id}.jpg`,
    director: 'Director',
    ...overrides,
  };
}

function makeMovies(count: number): Movie[] {
  return Array.from({ length: count }, (_, i) =>
    makeMovie({ id: `m${i + 1}`, rank: i + 1, title: `Movie ${i + 1}` }),
  );
}

describe('PosterGrid', () => {
  it('renders the title heading', () => {
    render(<PosterGrid movies={makeMovies(3)} />);
    expect(screen.getByText('My Top Movies')).toBeTruthy();
  });

  it('renders all movie titles', () => {
    const movies = makeMovies(5);
    render(<PosterGrid movies={movies} />);
    movies.forEach((m) => {
      expect(screen.getByText(m.title)).toBeTruthy();
    });
  });

  it('renders rank numbers for each movie', () => {
    const movies = makeMovies(4);
    render(<PosterGrid movies={movies} />);
    movies.forEach((m) => {
      expect(screen.getByText(`#${m.rank}`)).toBeTruthy();
    });
  });

  it('renders poster images when posterUrl is available', () => {
    const movies = makeMovies(2);
    render(<PosterGrid movies={movies} />);
    const images = screen.getAllByTestId(/^poster-image-/);
    expect(images).toHaveLength(2);
  });

  it('renders placeholder when posterUrl is null', () => {
    const movies = [makeMovie({ id: 'no-poster', rank: 1, posterUrl: null })];
    render(<PosterGrid movies={movies} />);
    expect(screen.getByTestId('poster-placeholder-no-poster')).toBeTruthy();
  });

  it('handles full 10 movies', () => {
    const movies = makeMovies(10);
    render(<PosterGrid movies={movies} />);
    expect(screen.getAllByTestId(/^poster-cell-/)).toHaveLength(10);
  });

  it('handles fewer than 10 movies without empty slots', () => {
    const movies = makeMovies(3);
    render(<PosterGrid movies={movies} />);
    expect(screen.getAllByTestId(/^poster-cell-/)).toHaveLength(3);
  });

  it('shows empty state message when no movies', () => {
    render(<PosterGrid movies={[]} />);
    expect(screen.getByText('No ranked movies yet')).toBeTruthy();
  });

  it('uses dark background', () => {
    render(<PosterGrid movies={makeMovies(1)} />);
    const container = screen.getByTestId('poster-grid');
    expect(container.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: expect.stringMatching(/^#[0-1]/),
      }),
    );
  });

  it('limits to 10 movies even if more provided', () => {
    const movies = makeMovies(15);
    render(<PosterGrid movies={movies} />);
    expect(screen.getAllByTestId(/^poster-cell-/)).toHaveLength(10);
  });
});
