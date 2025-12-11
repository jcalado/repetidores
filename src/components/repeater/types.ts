import type { Repeater } from "@/app/columns";
import type { VoteStats, FeedbackEntry } from "@/lib/votes";

export type { Repeater, VoteStats, FeedbackEntry };

export type LocalVote = {
  vote: "up" | "down";
  feedback?: string;
  reporterCallsign?: string;
  ts: number;
};

export type OperationalStatus = "active" | "maintenance" | "offline" | "unknown";
export type CommunityStatus = "ok" | "prob-bad" | "bad" | "unknown";

export interface RepeaterDetailsProps {
  r: Repeater;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}
