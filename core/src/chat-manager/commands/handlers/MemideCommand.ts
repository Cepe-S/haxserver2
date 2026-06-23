import { CommandHandler, CommandContext, CommandResult, PermissionLevel } from '../types/CommandTypes';
import { command } from '../../../shared/strings';

export class MemideCommand implements CommandHandler {
  name = 'memide';
  description = 'Genera un valor aleatorio de medida con comentarios humorísticos';
  detailedHelp = command.helpman.memide;
  usage = '!memide';
  permission = PermissionLevel.PLAYER;
  category = 'social';
  cooldown = 15;

  // Cache para mantener el mismo valor por jugador
  private static playerSizes = new Map<string, number>();

  // Comentarios originales del proyecto anterior
  private static comentarios = {
    micropene: [
      "¡Es más fácil encontrar a Wally que eso!",
      "¡Ese tiene que ser el Minion más pequeño que existe!",
      "¡Eso no es un pito, es un error de la fábrica!",
      "¿Necesitas pinzas para manejar eso?",
      "¡Es tan chiquito que ni el Viagra lo encuentra!",
      "¡Eso es más chico que la autoestima de un cornudo!",
      "¡Necesitás un microscopio para ver esa mierda!",
      "¡Parece que la madre naturaleza se quedó sin material!",
      "¡Eres la definición viviente de 'chiquito pero peligroso'!"
    ],
    debajoPromedio: [
      "¡Tranquilo! No todos pueden ser estrellas porno.",
      "¡A veces menos es más... o eso dicen!",
      "¡La compensación viene en otras áreas, amigo!",
      "¡No te preocupes, el carisma lo es todo!",
      "¡Vos te bajás los pantalones y sube la autoestima de todos!",
      "¡Con eso no hacés ni cosquillas!",
      "¡Eso es tan chico que ni para mear bien sirve!"
    ],
    promedio: [
      "¡Ni muy grande ni muy pequeño, perfecto para cualquier agujero!",
      "¡Eres el término medio, el equilibrio perfecto!",
      "¡Lo importante es cómo lo usas, dicen por ahí!",
      "¡No es el tamaño, es cómo lo mueves!",
      "¡Lo justo para no pasar vergüenza, pero tampoco para presumir!",
      "¡Cumplís, pero sin pena ni gloria!"
    ],
    encimaPromedio: [
      "¡Tenés un misil entre las piernas!",
      "¡El tamaño sí importa, y lo sabes!",
      "¡Te bajás los pantalones y aplauden!",
      "¡Con eso podés asustar hasta a King Kong!",
      "¡Tremenda anaconda tenes ahí!",
      "¡Te bajás los pantalones y parece una película porno!",
      "¡Con esa cosa puedes hacer feliz a varias de una vez!",
      "¡Cuidado, que eso podría necesitar un permiso de armas!"
    ],
    grande: [
      "¡Con eso hasta los caballos te respetan!",
      "¡Con eso podés colgar la ropa de toda la cuadra!",
      "¡Eso sí que es un 'paquete' de verdad!",
      "¡Eres el orgullo del Host!",
      "¡Con eso puedes hacer sombras en un día soleado!",
      "¡Eso podría causar un eclipse solar!",
      "¡Eso no es un pene, es un arma de destrucción masiva!"
    ]
  };

  async execute(context: CommandContext): Promise<CommandResult> {
    const { player } = context;

    try {
      // Usar auth como identificador único, fallback a name si no hay auth
      const playerId = player.auth || player.name;
      
      // Obtener o generar tamaño para este jugador
      let size = MemideCommand.playerSizes.get(playerId);
      if (!size) {
        // Generar tamaño aleatorio entre 1 y 30 cm con decimales
        let randomValue = Math.random() * (30 - 1) + 1;
        size = Math.round(randomValue * 10) / 10; // Redondear a 1 decimal
        MemideCommand.playerSizes.set(playerId, size);
      }

      // Obtener comentario basado en el tamaño
      const comentario = this.obtenerComentario(size);
      
      // Mensaje final con formato original
      const finalMessage = `📏 A ${player.name} le mide ${size} cm 🍌 ${comentario}`;

      return {
        success: true,
        message: finalMessage
      };
    } catch (error) {
      return {
        success: false,
        error: '❌ Error al medir.'
      };
    }
  }

  private obtenerComentario(valor: number): string {
    if (valor >= 1 && valor <= 7) {
      return MemideCommand.comentarios.micropene[Math.floor(Math.random() * MemideCommand.comentarios.micropene.length)];
    } else if (valor > 7 && valor <= 12) {
      return MemideCommand.comentarios.debajoPromedio[Math.floor(Math.random() * MemideCommand.comentarios.debajoPromedio.length)];
    } else if (valor > 12 && valor <= 16) {
      return MemideCommand.comentarios.promedio[Math.floor(Math.random() * MemideCommand.comentarios.promedio.length)];
    } else if (valor > 16 && valor <= 20) {
      return MemideCommand.comentarios.encimaPromedio[Math.floor(Math.random() * MemideCommand.comentarios.encimaPromedio.length)];
    } else {
      return MemideCommand.comentarios.grande[Math.floor(Math.random() * MemideCommand.comentarios.grande.length)];
    }
  }
}