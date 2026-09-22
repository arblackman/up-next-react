import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { requireAuth } from "./middlewares/requireAuth";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const RATE_LIMIT_MS = 2000;

let lastApiCallTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTime;
  
  if (timeSinceLastCall < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastCall));
  }
  
  lastApiCallTime = Date.now();
  return fetch(url);
}

function shouldRefresh(lastRefreshedAt: Date | null): boolean {
  if (!lastRefreshedAt) return true;
  const timeSinceRefresh = Date.now() - lastRefreshedAt.getTime();
  return timeSinceRefresh >= TWELVE_HOURS_MS;
}

interface ShowDetails {
  status: string | null;
  nextEpisodeDate: string | null;
  nextEpisodeNumber: number | null;
  latestSeasonEpisodeCount: number | null;
  latestSeasonNumber: number | null;
  seasonsFetchSucceeded: boolean;
}

async function fetchShowDetails(apiId: number): Promise<ShowDetails> {
  const result: ShowDetails = {
    status: null,
    nextEpisodeDate: null,
    nextEpisodeNumber: null,
    latestSeasonEpisodeCount: null,
    latestSeasonNumber: null,
    seasonsFetchSucceeded: false
  };
  
  try {
    const tvmazeRes = await rateLimitedFetch(`https://api.tvmaze.com/shows/${apiId}?embed=nextepisode`);
    if (!tvmazeRes.ok) return result;
    
    const tvmazeData = await tvmazeRes.json();
    result.status = tvmazeData.status;
    
    const nextEpisode = tvmazeData._embedded?.nextepisode;
    const nextEpisodeSeason = nextEpisode?.season;
    if (nextEpisode) {
      result.nextEpisodeDate = nextEpisode.airdate || null;
      result.nextEpisodeNumber = nextEpisode.number || null;
    }
    
    const seasonsRes = await rateLimitedFetch(`https://api.tvmaze.com/shows/${apiId}/seasons`);
    if (seasonsRes.ok) {
      result.seasonsFetchSucceeded = true;
      const seasons = await seasonsRes.json();
      if (seasons.length > 0) {
        let targetSeason = null;
        
        if (nextEpisodeSeason) {
          targetSeason = seasons.find((s: any) => s.number === nextEpisodeSeason);
        }
        
        if (!targetSeason) {
          for (let i = seasons.length - 1; i >= 0; i--) {
            const season = seasons[i];
            if (season.endDate) {
              targetSeason = season;
              break;
            }
          }
          
          if (!targetSeason) {
            for (let i = seasons.length - 1; i >= 0; i--) {
              const season = seasons[i];
              const checkEpisodesRes = await rateLimitedFetch(`https://api.tvmaze.com/seasons/${season.id}/episodes`);
              if (checkEpisodesRes.ok) {
                const episodes = await checkEpisodesRes.json();
                if (episodes.length > 0) {
                  targetSeason = season;
                  break;
                }
              }
            }
          }
          
          if (!targetSeason) {
            targetSeason = seasons[seasons.length - 1];
          }
        }
        
        if (targetSeason) {
          result.latestSeasonNumber = targetSeason.number || null;
          
          if (targetSeason.episodeOrder && targetSeason.episodeOrder > 0) {
            result.latestSeasonEpisodeCount = targetSeason.episodeOrder;
          } else {
            const episodesRes = await rateLimitedFetch(`https://api.tvmaze.com/seasons/${targetSeason.id}/episodes`);
            if (episodesRes.ok) {
              const episodes = await episodesRes.json();
              if (episodes.length > 0) {
                result.latestSeasonEpisodeCount = episodes.length;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(`Failed to fetch show details for apiId ${apiId}:`, err);
  }
  
  return result;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/me", requireAuth, (req, res) => {
    res.json(req.dbUser);
  });

  app.get(api.shows.list.path, requireAuth, async (req, res) => {
    const userId = req.dbUser!.id;
    const shows = await storage.getShows(userId);
    res.json(shows);
  });

  app.get(api.shows.get.path, requireAuth, async (req, res) => {
    const userId = req.dbUser!.id;
    const show = await storage.getShow(Number(req.params.id), userId);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }
    res.json(show);
  });

  app.post(api.shows.create.path, requireAuth, async (req, res) => {
    try {
      const userId = req.dbUser!.id;
      const input = api.shows.create.input.parse(req.body);
      
      const details = await fetchShowDetails(input.apiId);
      
      const show = await storage.createShow({ 
        ...input, 
        userId, 
        status: details.status || undefined,
        nextEpisodeDate: details.nextEpisodeDate || undefined,
        nextEpisodeNumber: details.nextEpisodeNumber || undefined,
        latestSeasonEpisodeCount: details.latestSeasonEpisodeCount || undefined,
        latestSeasonNumber: details.latestSeasonNumber || undefined,
        lastRefreshedAt: new Date()
      });
      res.status(201).json(show);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.shows.update.path, requireAuth, async (req, res) => {
    try {
      const userId = req.dbUser!.id;
      const input = api.shows.update.input.parse(req.body);
      
      if (input.rating !== undefined && input.rating !== null) {
        if (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
          return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
        }
      }
      
      const show = await storage.updateShow(Number(req.params.id), userId, input);
      if (!show) {
        return res.status(404).json({ message: "Show not found" });
      }
      res.json(show);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.shows.delete.path, requireAuth, async (req, res) => {
    const userId = req.dbUser!.id;
    await storage.deleteShow(Number(req.params.id), userId);
    res.status(204).send();
  });

  app.get(api.shows.details.path, requireAuth, async (req, res) => {
    const userId = req.dbUser!.id;
    const show = await storage.getShow(Number(req.params.id), userId);
    if (!show) return res.status(404).json({ message: "Show not found" });

    try {
      const response = await rateLimitedFetch(`https://api.tvmaze.com/shows/${show.apiId}`);
      if (!response.ok) {
        return res.status(502).json({ message: "Failed to fetch from TVMaze" });
      }
      const data = await response.json();
      res.json({
        summary: data.summary ? data.summary.replace(/<[^>]*>/g, '').trim() : null,
        genres: data.genres || [],
        network: data.network?.name || data.webChannel?.name || null,
        premiered: data.premiered || null,
        runtime: data.runtime || data.averageRuntime || null,
        language: data.language || null,
        officialSite: data.officialSite || null,
        rating: data.rating?.average ?? null,
        weight: data.weight ?? null,
      });
    } catch (error) {
      console.error('TVMaze details error:', error);
      res.status(500).json({ message: "Failed to fetch show details" });
    }
  });

  app.get(api.shows.search.path, requireAuth, async (req, res) => {
    const q = req.query.q as string;
    if (!q) {
      return res.json([]);
    }

    try {
      const response = await rateLimitedFetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      
      const results = data.map((item: any) => ({
        apiId: item.show.id,
        title: item.show.name,
        imageUrl: item.show.image?.medium,
        summary: item.show.summary?.replace(/<[^>]*>/g, ''),
        year: item.show.premiered?.split('-')[0]
      }));
      
      res.json(results);
    } catch (error) {
      console.error('TVMaze search error:', error);
      res.status(500).json({ message: "Failed to fetch from TVMaze" });
    }
  });

  app.post(api.shows.refreshStatus.path, requireAuth, async (req, res) => {
    const userId = req.dbUser!.id;
    const userShows = await storage.getShows(userId);
    
    let updated = 0;
    let skipped = 0;
    
    for (const show of userShows) {
      if (!shouldRefresh(show.lastRefreshedAt)) {
        skipped++;
        continue;
      }
      
      try {
        const details = await fetchShowDetails(show.apiId);
        
        if (!details.status) {
          continue;
        }
        
        const updateData: Record<string, any> = {
          status: details.status,
          nextEpisodeDate: details.nextEpisodeDate,
          nextEpisodeNumber: details.nextEpisodeNumber,
          lastRefreshedAt: new Date()
        };
        
        const hasValidEpisodeCount = details.latestSeasonEpisodeCount !== null && details.latestSeasonEpisodeCount > 0;
        if (hasValidEpisodeCount) {
          updateData.latestSeasonEpisodeCount = details.latestSeasonEpisodeCount;
        }
        
        const hasValidSeasonNumber = details.latestSeasonNumber !== null && details.latestSeasonNumber > 0;
        if (hasValidSeasonNumber) {
          updateData.latestSeasonNumber = details.latestSeasonNumber;
        }
        
        await storage.updateShow(show.id, userId, updateData);
        updated++;
      } catch (err) {
        console.error(`Failed to refresh show ${show.id}:`, err);
      }
    }
    
    res.json({ updated, skipped });
  });

  app.post(api.shows.refreshShow.path, requireAuth, async (req, res) => {
    const userId = req.dbUser!.id;
    const showId = Number(req.params.id);
    
    const show = await storage.getShow(showId, userId);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }
    
    if (!shouldRefresh(show.lastRefreshedAt)) {
      return res.json({ ...show, skipped: true });
    }
    
    try {
      const details = await fetchShowDetails(show.apiId);
      
      if (!details.status) {
        return res.status(502).json({ message: "Failed to fetch from TVMaze" });
      }
      
      const updateData: Record<string, any> = {
        status: details.status,
        nextEpisodeDate: details.nextEpisodeDate,
        nextEpisodeNumber: details.nextEpisodeNumber,
        lastRefreshedAt: new Date()
      };
      
      const hasValidEpisodeCount = details.latestSeasonEpisodeCount !== null && details.latestSeasonEpisodeCount > 0;
      if (hasValidEpisodeCount) {
        updateData.latestSeasonEpisodeCount = details.latestSeasonEpisodeCount;
      }
      
      const hasValidSeasonNumber = details.latestSeasonNumber !== null && details.latestSeasonNumber > 0;
      if (hasValidSeasonNumber) {
        updateData.latestSeasonNumber = details.latestSeasonNumber;
      }
      
      const updatedShow = await storage.updateShow(showId, userId, updateData);
      return res.json(updatedShow);
    } catch (err) {
      console.error(`Failed to refresh show ${showId}:`, err);
      return res.status(502).json({ message: "Failed to fetch from TVMaze" });
    }
  });

  // Share routes
  app.get(api.share.getToken.path, requireAuth, async (req, res) => {
    const userId = req.dbUser!.id;
    
    // If we don't have the shareToken from the user object in session, fetch it from DB
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const [dbUser] = await db.select({ shareToken: users.shareToken }).from(users).where(eq(users.id, userId));
    
    if (!dbUser?.shareToken) {
      return res.status(404).json({ message: "Share token not found" });
    }
    
    res.json({ shareToken: dbUser.shareToken });
  });

  app.get(api.share.getSharedList.path, async (req, res) => {
    const token = req.params.token;
    const result = await storage.getShowsByShareToken(token);
    
    if (!result.user) {
      return res.status(404).json({ message: "List not found" });
    }
    
    res.json(result);
  });

  return httpServer;
}
