export interface User {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  mailAddress?: string;
  crowns: number;
  completedHuntsCount: number;
  participantBadges?: ParticipantBadge[];
  '@id'?: string;
  iri?: string;
}

export interface ParticipantBadge {
  id: number;
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
  organizer?: User;
  participants?: User[];
  rewards?: HuntReward[];
  createdAt?: string;
  updatedAt?: string;
}

export interface HuntReward {
  id: number;
  crownAmount: number;
}

export interface Artifact {
  id: number;
  name: string;
  description?: string;
  imagePath?: string;
  createdAt?: string;
}

export interface ArtifactItem {
  id: number;
  artifact: Artifact;
  quantity: number;
}

export interface Trade {
  id: number;
  status: TradeStatus;
  message?: string;
  offeredQuantity: number;
  requestedQuantity: number;
  createdAt: string;
  resolvedAt?: string;
  sender: User | string;
  receiver: User | string;
  offeredArtifact: Artifact | string;
  requestedArtifact: Artifact | string;
}

export type TradeStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface EnrichedTrade extends Trade {
  sender: User;
  receiver: User;
  offeredArtifact: Artifact;
  requestedArtifact: Artifact;
}

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
  '2fa_required'?: boolean;
}

export interface TwoFactorResponse {
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

export interface CreateTradeRequest {
  receiverId: number;
  offeredArtifactId: number;
  offeredQuantity: number;
  requestedArtifactId: number;
  requestedQuantity: number;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface Auction {
  id: number;
  seller: { id: number; username: string };
  artifact: { id: number; name: string; imagePath?: string };
  quantity: number;
  startingPrice: number;
  currentHighestBid: number;
  currentBidder: { id: number; username: string } | null;
  endAt: string;
  status: AuctionStatus;
  createdAt: string;
  resolvedAt?: string;
  bidCount: number;
  minNextBidAmount: number;
}

export type AuctionStatus = 'active' | 'ended' | 'cancelled';

export interface CreateAuctionRequest {
  artifactId: number;
  quantity: number;
  startingPrice: number;
  endAt: string;
}

export interface PlaceBidRequest {
  amount: number;
}