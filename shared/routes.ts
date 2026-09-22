import { z } from 'zod';
import { insertShowSchema, shows, type CreateShowRequest, type UpdateShowRequest } from './schema';

export const clientShowInputSchema = insertShowSchema.omit({ userId: true });

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  shows: {
    list: {
      method: 'GET' as const,
      path: '/api/shows',
      responses: {
        200: z.array(z.custom<typeof shows.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/shows/:id',
      responses: {
        200: z.custom<typeof shows.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/shows',
      input: clientShowInputSchema,
      responses: {
        201: z.custom<typeof shows.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/shows/:id',
      input: clientShowInputSchema.partial(),
      responses: {
        200: z.custom<typeof shows.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/shows/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    search: {
      method: 'GET' as const,
      path: '/api/search',
      input: z.object({ q: z.string() }),
      responses: {
        200: z.array(z.object({
          apiId: z.number(),
          title: z.string(),
          imageUrl: z.string().optional(),
          summary: z.string().optional(),
          year: z.string().optional()
        }))
      }
    },
    refreshStatus: {
      method: 'POST' as const,
      path: '/api/shows/refresh-status',
      responses: {
        200: z.object({ updated: z.number() }),
      }
    },
    refreshShow: {
      method: 'POST' as const,
      path: '/api/shows/:id/refresh',
      responses: {
        200: z.custom<typeof shows.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    details: {
      method: 'GET' as const,
      path: '/api/shows/:id/details',
      responses: {
        200: z.object({
          summary: z.string().nullable(),
          genres: z.array(z.string()),
          network: z.string().nullable(),
          premiered: z.string().nullable(),
          runtime: z.number().nullable(),
          language: z.string().nullable(),
          officialSite: z.string().nullable(),
          rating: z.number().nullable(),
          weight: z.number().nullable(),
        }),
        404: errorSchemas.notFound,
      }
    }
  },
  share: {
    getToken: {
      method: 'GET' as const,
      path: '/api/share/token',
      responses: {
        200: z.object({ shareToken: z.string() }),
      }
    },
    getSharedList: {
      method: 'GET' as const,
      path: '/api/shared/:token',
      responses: {
        200: z.object({
          shows: z.array(z.object({
            id: z.number(),
            title: z.string(),
            apiId: z.number().nullable(),
            imageUrl: z.string().nullable(),
            category: z.string(),
            priority: z.number(),
            status: z.string().nullable(),
            nextEpisodeDate: z.string().nullable(),
            nextEpisodeNumber: z.number().nullable(),
            latestSeasonEpisodeCount: z.number().nullable(),
            latestSeasonNumber: z.number().nullable(),
            lastRefreshedAt: z.string().nullable(),
            rating: z.number().nullable(),
          })),
          user: z.object({
            firstName: z.string().nullable(),
            profileImageUrl: z.string().nullable(),
          }).nullable()
        }),
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type { CreateShowRequest, UpdateShowRequest };
