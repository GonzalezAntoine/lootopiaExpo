export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  mailAddress: string;
  crowns: number;
  completedHuntsCount: number;
  participantBadges?: ParticipantBadge[];
}

export interface ParticipantBadge {
  badge: Badge;
}

export interface Badge {
  id: number;
  name: string;
  description?: string;
}

export interface Hunt {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
}

export interface Artifact {
  id: number;
  name: string;
  description?: string;
  imagePath?: string;
  createdAt: string;
  quantity: number;
}

export interface ArtifactItem {
  id: number;
  artifact: Artifact;
  quantity: number;
}

export interface Trade {
  id: number;
  status: TradeStatus;
  createdAt: string;
  resolvedAt?: string;
  message?: string;
  offeredQuantity: number;
  requestedQuantity: number;
  sender: string | User;
  receiver: string | User;
  offeredArtifact: string | Artifact;
  requestedArtifact: string | Artifact;
}

export type TradeStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface LeaderboardPlayer {
  id: number;
  username: string;
  crowns: number;
  completedHuntsCount: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface SearchParticipantResult {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  initials?: string;
}

export interface SearchArtifactResult {
  id: number;
  name: string;
  quantity?: number;
  initials?: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}