/** Extrae room id de link Haxball: https://www.haxball.com/play?c=XXXX */
export function parseRoomId(roomLink) {
  if (!roomLink) throw new Error('roomLink vacío');
  try {
    const url = new URL(roomLink);
    const id = url.searchParams.get('c');
    if (id) return id;
  } catch {
    // fallback regex
  }
  const match = roomLink.match(/[?&]c=([^&]+)/);
  if (match) return match[1];
  throw new Error(`No se pudo parsear room id de: ${roomLink}`);
}
