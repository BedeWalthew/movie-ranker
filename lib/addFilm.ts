import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { fetchFilmDetails, type FilmSearchHit } from './tmdbClient';
import { insertMovie, getMovieByTmdbId } from './movieRepository';
import type { Movie } from './schema';

/**
 * Puts a film from search on the unranked reel and returns it. The director
 * comes from a second lookup; when that fails the film is added without one.
 * A film whose TMDB id is already on the reel is returned as it is.
 */
export async function addFilmToReel(
  db: SQLiteDatabase,
  hit: FilmSearchHit,
  workerUrl: string,
): Promise<Movie> {
  const existing = await getMovieByTmdbId(db, hit.tmdbId);
  if (existing) return existing;

  const details = await fetchFilmDetails(hit.tmdbId, workerUrl);

  const movie: Movie = {
    id: Crypto.randomUUID(),
    title: details?.title ?? hit.title,
    year: details?.year ?? hit.year,
    letterboxdUri: null,
    letterboxdRating: null,
    posterUrl: details?.posterUrl ?? hit.posterUrl,
    director: details?.director ?? null,
    rank: null,
    tmdbId: hit.tmdbId,
  };

  await insertMovie(db, movie);
  return movie;
}
