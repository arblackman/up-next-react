import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateShowRequest, type UpdateShowRequest } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

// ============================================
// SHOWS HOOKS
// ============================================

// GET /api/shows
export function useShows() {
  return useQuery({
    queryKey: [api.shows.list.path],
    queryFn: async () => {
      const res = await apiRequest(api.shows.list.method, api.shows.list.path);
      return api.shows.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/shows/:id
export function useShow(id: number) {
  return useQuery({
    queryKey: [api.shows.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.shows.get.path, { id });
      const res = await apiRequest(api.shows.get.method, url);
      return api.shows.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// POST /api/shows
export function useCreateShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateShowRequest) => {
      const res = await apiRequest(api.shows.create.method, api.shows.create.path, data);
      return api.shows.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shows.list.path] });
    },
  });
}

// PATCH /api/shows/:id
export function useUpdateShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateShowRequest) => {
      const url = buildUrl(api.shows.update.path, { id });
      const res = await apiRequest(api.shows.update.method, url, updates);
      return api.shows.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shows.list.path] });
    },
  });
}

// DELETE /api/shows/:id
export function useDeleteShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.shows.delete.path, { id });
      await apiRequest(api.shows.delete.method, url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shows.list.path] });
    },
  });
}

// GET /api/search?q=...
export function useSearchShows(query: string) {
  return useQuery({
    queryKey: [api.shows.search.path, query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const url = `${api.shows.search.path}?q=${encodeURIComponent(query)}`;
      const res = await apiRequest(api.shows.search.method, url);
      return api.shows.search.responses[200].parse(await res.json());
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache search results for 5 minutes
  });
}

// POST /api/shows/refresh-status
export function useRefreshStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest(api.shows.refreshStatus.method, api.shows.refreshStatus.path);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shows.list.path] });
    },
  });
}

// POST /api/shows/:id/refresh
export function useRefreshShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.shows.refreshShow.path, { id });
      const res = await apiRequest(api.shows.refreshShow.method, url);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shows.list.path] });
    },
  });
}
