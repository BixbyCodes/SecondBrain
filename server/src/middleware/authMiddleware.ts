import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function protect(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    // must exist and start with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];   // "Bearer xxx" → "xxx"

    // verify the signature — throws if fake/expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    req.userId = decoded.userId;   // remember who this is, for the route handler
    next();                        // ✅ let the request continue
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
}
