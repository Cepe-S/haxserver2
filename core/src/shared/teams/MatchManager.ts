import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Match, MatchCategory, KitType } from './TeamTypes';
import { TeamsManager } from './TeamsManager';
import { createLogger } from '../logger/Logger';

export class MatchManager {
  private logger = createLogger('MATCHES');
  private matchesData: { [category: string]: MatchCategory } = {};
  private dataPath: string;
  private teamsManager: TeamsManager;

  constructor() {
    this.dataPath = join(__dirname, '../data/matches.json');
    this.teamsManager = new TeamsManager();
    this.loadMatches();
  }

  private loadMatches(): void {
    try {
      const data = readFileSync(this.dataPath, 'utf-8');
      this.matchesData = JSON.parse(data);
      this.logger.info(`Loaded ${Object.keys(this.matchesData).length} match categories`);
    } catch (error) {
      this.logger.error('Failed to load matches data', error);
      this.matchesData = {};
    }
  }

  private saveMatches(): void {
    try {
      writeFileSync(this.dataPath, JSON.stringify(this.matchesData, null, 2));
      this.logger.info('Matches data saved successfully');
    } catch (error) {
      this.logger.error('Failed to save matches data', error);
    }
  }

  public getAllMatches(): { [category: string]: MatchCategory } {
    return { ...this.matchesData };
  }

  public selectRandomMatch(): { homeTeam: string; awayTeam: string; homeKit: KitType; awayKit: KitType } | null {
    try {
      // Calcular probabilidades totales
      const categories = Object.entries(this.matchesData);
      const totalRate = categories.reduce((sum, [_, category]) => sum + category.rate, 0);
      
      if (totalRate === 0) return null;

      // Seleccionar categoría
      let random = Math.random() * totalRate;
      let selectedCategory: MatchCategory | null = null;

      for (const [_, category] of categories) {
        random -= category.rate;
        if (random <= 0) {
          selectedCategory = category;
          break;
        }
      }

      if (!selectedCategory || selectedCategory.classics.length === 0) return null;

      // Seleccionar partido aleatorio de la categoría
      const randomMatch = selectedCategory.classics[Math.floor(Math.random() * selectedCategory.classics.length)];
      
      return {
        homeTeam: randomMatch[0][0],
        awayTeam: randomMatch[1][0],
        homeKit: randomMatch[0][1],
        awayKit: randomMatch[1][1]
      };
    } catch (error) {
      this.logger.error('Failed to select random match', error);
      return null;
    }
  }

  public applyMatchToHaxball(haxballRoom: any, match: { homeTeam: string; awayTeam: string; homeKit: KitType; awayKit: KitType }): boolean {
    try {
      const homeKit = this.teamsManager.getTeamKit(match.homeTeam, match.homeKit);
      const awayKit = this.teamsManager.getTeamKit(match.awayTeam, match.awayKit);

      if (!homeKit || !awayKit) {
        this.logger.warn('Missing kit data for match', { match });
        return false;
      }

      // Aplicar colores del equipo local (team 1)
      haxballRoom.setTeamColors(1, homeKit.angle, homeKit.textColour, [
        homeKit.teamColour1,
        homeKit.teamColour2 || homeKit.teamColour1,
        homeKit.teamColour3 || homeKit.teamColour2 || homeKit.teamColour1
      ]);

      // Aplicar colores del equipo visitante (team 2)
      haxballRoom.setTeamColors(2, awayKit.angle, awayKit.textColour, [
        awayKit.teamColour1,
        awayKit.teamColour2 || awayKit.teamColour1,
        awayKit.teamColour3 || awayKit.teamColour2 || awayKit.teamColour1
      ]);

      this.logger.info('Match applied to Haxball', { 
        home: `${match.homeTeam} (${match.homeKit})`,
        away: `${match.awayTeam} (${match.awayKit})`
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to apply match to Haxball', error);
      return false;
    }
  }

  public updateAllMatches(matches: { [category: string]: MatchCategory }): boolean {
    try {
      this.matchesData = matches;
      this.saveMatches();
      return true;
    } catch (error) {
      this.logger.error('Failed to update all matches', error);
      return false;
    }
  }

  public updateCategory(categoryId: string, category: MatchCategory): boolean {
    try {
      this.matchesData[categoryId] = category;
      this.saveMatches();
      return true;
    } catch (error) {
      this.logger.error(`Failed to update category ${categoryId}`, error);
      return false;
    }
  }

  public deleteCategory(categoryId: string): boolean {
    try {
      delete this.matchesData[categoryId];
      this.saveMatches();
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete category ${categoryId}`, error);
      return false;
    }
  }
}