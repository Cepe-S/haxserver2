import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { TeamsData, Team, TeamKit, KitType } from './TeamTypes';
import { createLogger } from '../logger/Logger';

export class TeamsManager {
  private logger = createLogger('TEAMS');
  private teamsData: TeamsData = {};
  private dataPath: string;

  constructor() {
    this.dataPath = join(__dirname, '../data/teams.json');
    this.loadTeams();
  }

  private loadTeams(): void {
    try {
      const data = readFileSync(this.dataPath, 'utf-8');
      this.teamsData = JSON.parse(data);
      this.logger.info(`Loaded ${Object.keys(this.teamsData).length} teams`);
    } catch (error) {
      this.logger.error('Failed to load teams data', error);
      this.teamsData = {};
    }
  }

  private saveTeams(): void {
    try {
      writeFileSync(this.dataPath, JSON.stringify(this.teamsData, null, 2));
      this.logger.info('Teams data saved successfully');
    } catch (error) {
      this.logger.error('Failed to save teams data', error);
    }
  }

  public getAllTeams(): TeamsData {
    return { ...this.teamsData };
  }

  public getTeam(name: string): Team | null {
    return this.teamsData[name] || null;
  }

  public getTeamKit(name: string, kitType: KitType): TeamKit | null {
    const team = this.getTeam(name);
    return team?.[kitType] || null;
  }

  public updateTeam(name: string, team: Team): boolean {
    try {
      this.teamsData[name] = team;
      this.saveTeams();
      return true;
    } catch (error) {
      this.logger.error(`Failed to update team ${name}`, error);
      return false;
    }
  }

  public deleteTeam(name: string): boolean {
    try {
      delete this.teamsData[name];
      this.saveTeams();
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete team ${name}`, error);
      return false;
    }
  }

  public validateKit(kit: TeamKit): boolean {
    return (
      kit.angle >= 0 && kit.angle <= 360 &&
      Number.isInteger(kit.textColour) &&
      Number.isInteger(kit.teamColour1) &&
      (kit.teamColour2 === null || kit.teamColour2 === undefined || Number.isInteger(kit.teamColour2)) &&
      (kit.teamColour3 === null || kit.teamColour3 === undefined || Number.isInteger(kit.teamColour3))
    );
  }
}