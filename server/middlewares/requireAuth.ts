import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, type User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      dbUser?: User;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth = getAuth(req);
    const claims = auth.sessionClaims;
    const userId =
      typeof claims?.userId === "string" ? claims.userId : auth.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!dbUser) {
      const [inserted] = await db
        .insert(users)
        .values({
          id: userId,
          email: typeof claims?.email === "string" ? claims.email : null,
          firstName:
            typeof claims?.firstName === "string" ? claims.firstName : null,
          lastName:
            typeof claims?.lastName === "string" ? claims.lastName : null,
        })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        dbUser = inserted;
      } else {
        [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
      }
    }

    if (!dbUser) {
      return res.status(403).json({ message: "Account access unavailable" });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    next(error);
  }
}