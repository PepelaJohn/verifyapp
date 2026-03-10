import type { SessionOptions } from "iron-session";

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "chatbot_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export interface SessionData {
  admin?: {
    isLoggedIn: boolean;
    username: string;
  };
}
