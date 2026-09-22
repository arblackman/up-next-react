import { shows, type Show, type InsertShow, type UpdateShowRequest, users, type User } from "@shared/schema";
import { db } from "./db";
import { eq, and, asc } from "drizzle-orm";

export interface IStorage {
  getShows(userId: string): Promise<Show[]>;
  getShow(id: number, userId: string): Promise<Show | undefined>;
  createShow(show: InsertShow): Promise<Show>;
  updateShow(id: number, userId: string, updates: UpdateShowRequest): Promise<Show | undefined>;
  deleteShow(id: number, userId: string): Promise<void>;
  getUserByShareToken(shareToken: string): Promise<User | undefined>;
  getShowsByShareToken(shareToken: string): Promise<{ shows: Omit<Show, 'userId'>[], user: Pick<User, 'firstName' | 'profileImageUrl'> | null }>;
}

export class DatabaseStorage implements IStorage {
  async getShows(userId: string): Promise<Show[]> {
    return await db.select().from(shows)
      .where(eq(shows.userId, userId))
      .orderBy(asc(shows.priority));
  }

  async getShow(id: number, userId: string): Promise<Show | undefined> {
    const [show] = await db.select().from(shows)
      .where(and(eq(shows.id, id), eq(shows.userId, userId)));
    return show;
  }

  async createShow(insertShow: InsertShow): Promise<Show> {
    const [show] = await db.insert(shows).values(insertShow).returning();
    return show;
  }

  async updateShow(id: number, userId: string, updates: UpdateShowRequest): Promise<Show | undefined> {
    const [show] = await db
      .update(shows)
      .set(updates)
      .where(and(eq(shows.id, id), eq(shows.userId, userId)))
      .returning();
    return show;
  }

  async deleteShow(id: number, userId: string): Promise<void> {
    await db.delete(shows).where(and(eq(shows.id, id), eq(shows.userId, userId)));
  }

  async getUserByShareToken(shareToken: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.shareToken, shareToken));
    return user;
  }

  async getShowsByShareToken(shareToken: string): Promise<{ 
    shows: Omit<Show, 'userId'>[], 
    user: Pick<User, 'firstName' | 'profileImageUrl'> | null 
  }> {
    const user = await this.getUserByShareToken(shareToken);
    if (!user) {
      return { shows: [], user: null };
    }
    
    const userShows = await db.select().from(shows)
      .where(eq(shows.userId, user.id))
      .orderBy(asc(shows.priority));
    
    const publicShows = userShows.map(({ userId, ...rest }) => rest);
    
    return {
      shows: publicShows,
      user: { firstName: user.firstName, profileImageUrl: user.profileImageUrl }
    };
  }
}

export const storage = new DatabaseStorage();
