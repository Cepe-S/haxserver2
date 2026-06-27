const WEB = process.env.WEB_URL || 'http://localhost:3000';

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status} ${url}`);
  }
  return data;
}

export async function getHealth() {
  return fetchJson(`${WEB}/api/health`);
}

export async function getRunningRoom(preferredRuid) {
  const { images } = await fetchJson(`${WEB}/api/server-images`);
  const running = images.filter((i) => i.status === 'running' && i.roomLink);
  if (running.length === 0) {
    throw new Error('No hay server image running — ejecutá Execute primero');
  }
  if (preferredRuid) {
    const match = running.find((i) => i.ruid === preferredRuid || i.config?.ruid === preferredRuid);
    if (match) return match;
  }
  return running[0];
}

export async function getGameloop() {
  return fetchJson(`${WEB}/api/debug/gameloop`);
}

export async function getDebugStatus() {
  return fetchJson(`${WEB}/api/debug/status`);
}

export async function transitionLoop(loop, reason = 'debug-players repl') {
  return fetchJson(`${WEB}/api/debug/gameloop/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loop, reason }),
  });
}

export async function getDebugReport(ruid) {
  const q = ruid ? `?ruid=${encodeURIComponent(ruid)}` : '';
  const res = await fetch(`${WEB}/api/debug/report${q}`);
  return res.text();
}

/** Espera hasta que red+blue >= minCount (poll gameloop). */
export async function waitForPlayerCount(minCount, timeoutMs = 60000) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutMs) {
    const gl = await getGameloop();
    const onField = (gl.players?.red ?? 0) + (gl.players?.blue ?? 0);
    if (onField >= minCount) {
      return { ...gl, onField };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timeout esperando ${minCount} jugadores en cancha`);
}

/** Reinicia match loop para re-evaluar estadio con count actual. */
export async function refreshMatchLoop(reason = 'debug-players refresh') {
  await transitionLoop('training', reason);
  await new Promise((r) => setTimeout(r, 1500));
  await transitionLoop('match', reason);
  await new Promise((r) => setTimeout(r, 2500));
  return getGameloop();
}
