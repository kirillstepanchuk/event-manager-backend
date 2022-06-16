import { Request } from 'express';

export interface TypedRequest extends Request {
  tokenData: {
    userId: number
  },
  t: (arg0: string) => string,
  query: {
    id: string,
    role: string,
    page: string,
    event_id: string,
    user_id: string,
    radius: string,
    eventsType: string,
    lng: string,
    lat: string,
    title: string,
    category: string,
    isBlocked: string,
  }
}
