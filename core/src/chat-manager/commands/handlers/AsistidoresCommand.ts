import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { LeaderboardService, LeaderboardPeriod, getPeriodLabel } from '../../../shared/stats/LeaderboardService';
import { STRINGS } from '../../../shared/strings';

const leaderboard = new LeaderboardService();

function parsePeriod(arg?: string): LeaderboardPeriod | null {
  if (!arg) return 'day';
  switch (arg.toLowerCase()) {
    case 'dia':
    case 'day':
      return 'day';
    case 'semana':
    case 'week':
      return 'week';
    case 'mes':
    case 'month':
      return 'month';
    case 'global':
    case 'all':
      return 'all';
    default:
      return null;
  }
}

function formatLeaderboard(
  periodLabel: string,
  entries: { rank: number; name: string; count: number }[]
): string {
  if (entries.length === 0) {
    return `📊 No hay asistidores registrados en este período (${periodLabel}).`;
  }

  const lines = entries.map(e => `${e.rank}. ${e.name} — ${e.count} asistencias`);
  return `🎯 Top Asistidores — ${periodLabel}\n${lines.join('\n')}`;
}

/**
 * Comando !asistidores - Top de asistidores por período
 */
export class AsistidoresCommand implements CommandHandler {
  name = 'asistidores';
  description = 'Top de asistidores';
  detailedHelp = STRINGS.command.helpman.asistidores;
  usage = '!asistidores [semana|mes|global] (default: día)';
  permission = PermissionLevel.PLAYER;
  category = 'stats';

  async execute(context: CommandContext): Promise<CommandResult> {
    const period = parsePeriod(context.args[0]);
    if (!period) {
      return {
        success: false,
        error: '❌ Período inválido. Usa: dia, semana, mes o global'
      };
    }

    const entries = await leaderboard.getTopAssisters(context.ruid, period, 10);
    const message = formatLeaderboard(getPeriodLabel(period), entries);

    return { success: true, message };
  }
}
