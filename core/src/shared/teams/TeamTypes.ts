export interface TeamKit {
  angle: number;
  textColour: number;
  teamColour1: number;
  teamColour2?: number | null;
  teamColour3?: number | null;
}

export interface Team {
  tit?: TeamKit;
  alt?: TeamKit;
}

export interface TeamsData {
  [teamName: string]: Team;
}

export type KitType = 'tit' | 'alt';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  probability: number;
  enabled: boolean;
  category: string;
}

export interface MatchCategory {
  name: string;
  rate: number;
  classics: Array<[[string, KitType], [string, KitType]]>;
}