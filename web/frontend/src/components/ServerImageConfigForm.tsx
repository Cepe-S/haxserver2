import { useState, useEffect } from 'react';
import axios from 'axios';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPasswordsManager } from './AdminPasswordsManager';

interface ServerImageConfig {
  ruid: string;
  _config: {
    roomName: string;
    playerName: string;
    password: string;
    maxPlayers: number;
    public: boolean;
    token: string;
    noPlayer: boolean;
    geo?: {
      code: string;
      lat: number;
      lon: number;
    };
  };
  settings: {
    // Anti-abuse settings
    maliciousBehaviourBanCriterion: number;
    banVoteEnable: boolean;
    banVoteBanMillisecs: number;
    banVoteAllowMinimum: number;
    banVoteExecuteMinimum: number;
    
    // AFK settings
    afkCountLimit: number;
    afkCommandAutoKick: boolean;
    afkCommandAutoKickAllowMillisecs: number;
    
    // Chat filtering
    chatFiltering: boolean;
    nicknameTextFilter: boolean;
    chatTextFilter: boolean;
    nicknameLengthLimit: number;
    chatLengthLimit: number;
    forbidDuplicatedNickname: boolean;
    
    // Anti-flood settings
    antiJoinFlood: boolean;
    joinFloodAllowLimitation: number;
    joinFloodIntervalMillisecs: number;
    joinFloodBanMillisecs: number;
    antiChatFlood: boolean;
    chatFloodCriterion: number;
    chatFloodIntervalMillisecs: number;
    antiSpamMuteEnabled: boolean;
    antiSpamMuteTimeMillisecs: number;
    antiSpamMuteLogEnabled: boolean;
    antiOgFlood: boolean;
    ogFloodCriterion: number;
    ogFloodBanMillisecs: number;
    antiAFKFlood: boolean;
    antiAFKAbusing: boolean;
    
    // Anti-abuse protections
    antiBanNoPermission: boolean;
    banNoPermissionBanMillisecs: number;
    antiInsufficientStartAbusing: boolean;
    insufficientStartAllowLimitation: number;
    insufficientStartAbusingBanMillisecs: number;
    antiPlayerKickAbusing: boolean;
    playerKickAllowLimitation: number;
    playerKickIntervalMillisecs: number;
    playerKickAbusingBanMillisecs: number;
    antiMuteAbusing: boolean;
    muteAllowIntervalMillisecs: number;
    muteDefaultMillisecs: number;
    antiGameAbscond: boolean;
    gameAbscondBanMillisecs: number;
    gameAbscondRatingPenalty: number;
    
    // Game mechanics
    rerollWinStreak: boolean;
    rerollWinstreakCriterion: number;
    guaranteePlayingTime: boolean;
    guaranteedPlayingTimeSeconds: number;
    avatarOverridingByTier: boolean;
    
    // Ball physics
    ballRadius: number;
    ballColor: string;
    ballBCoeff: number;
    ballInvMass: number;
    ballDamping: number;
    
    // Powershot system
    powershotEnabled: boolean;
    powershotActivationTime: number;
    powershotNormalColor: number;
    powershotActiveColor: number;
    powershotInvMassFactor: number;
    powershotCooldown: number;
    powershotStickDistance: number;
    
    // Balance system
    balanceEnabled: boolean;
    balanceMaxPlayersPerTeam: number;
  };
  rules: {
    ruleName: string;
    ruleDescription: string;
    requisite: {
      minimumPlayers: number;
      eachTeamPlayers: number;
      maxSubPlayers: number;
      timeLimit: number;
      scoreLimit: number;
      teamLock: boolean;
    };
    autoAdmin: boolean;
    autoOperating: boolean;
    statsRecord: boolean;
    balanceMode: string;
    defaultMapName: string;
    readyMapName: string;
    customJSONOptions: string;
  };
}

interface Props {
  config: ServerImageConfig;
  onChange: (config: ServerImageConfig) => void;
  isEditing?: boolean;
  serverImageId?: string;
}

export function ServerImageConfigForm({ config, onChange, serverImageId }: Props) {
  const [localConfig, setLocalConfig] = useState<ServerImageConfig>(config);
  const [balanceModes, setBalanceModes] = useState<any>({});
  const [stadiums, setStadiums] = useState<any>({});
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    // Load balance modes and stadiums from API
    const loadConfig = async () => {
      try {
        const response = await axios.get('/api/config/all');
        setBalanceModes(response.data.balanceModes);
        setStadiums(response.data.stadiums);
      } catch (error) {
        console.error('Failed to load config options:', error);
      } finally {
        setConfigLoading(false);
      }
    };
    
    loadConfig();
  }, []);

  const updateConfig = (section: keyof ServerImageConfig, field: string, value: any) => {
    const newConfig = { ...localConfig };
    if (section === '_config' || section === 'settings' || section === 'rules') {
      if (section === 'rules' && field.includes('.')) {
        const [parent, child] = field.split('.');
        (newConfig[section] as any)[parent][child] = value;
      } else {
        (newConfig[section] as any)[field] = value;
      }
    } else {
      (newConfig as any)[field] = value;
    }
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  // const formatTime = (milliseconds: number) => {
  //   const minutes = Math.floor(milliseconds / 60000);
  //   const seconds = Math.floor((milliseconds % 60000) / 1000);
  //   return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  // };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">🔧 Básico</TabsTrigger>
          <TabsTrigger value="game">🎮 Juego</TabsTrigger>
          <TabsTrigger value="advanced">⚠️ Avanzado</TabsTrigger>
        </TabsList>

        {/* Configuración Básica */}
        <TabsContent value="basic" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Configuración de la Sala</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Nombre de la Sala</label>
                  <input
                    className="w-full p-2 border rounded-md"
                    value={localConfig._config.roomName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('_config', 'roomName', e.target.value)}
                    placeholder="Nombre de la sala"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Nombre del Bot</label>
                  <input
                    className="w-full p-2 border rounded-md"
                    value={localConfig._config.playerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('_config', 'playerName', e.target.value)}
                    placeholder="🤖"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Máximo de Jugadores</label>
                  <input
                    className="w-full p-2 border rounded-md"
                    type="number"
                    min="2"
                    max="60"
                    value={localConfig._config.maxPlayers}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('_config', 'maxPlayers', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Contraseña (opcional)</label>
                  <input
                    className="w-full p-2 border rounded-md"
                    type="password"
                    value={localConfig._config.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('_config', 'password', e.target.value)}
                    placeholder="Dejar vacío para sala pública"
                  />
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Ubicación del Servidor (Geolocalización Falsa)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Código de País</label>
                    <input
                      className="w-full p-2 border rounded-md"
                      value={localConfig._config.geo?.code || 'AR'}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('_config', 'geo', { 
                        code: e.target.value,
                        lat: localConfig._config.geo?.lat || -34.6882652,
                        lon: localConfig._config.geo?.lon || -58.5685501
                      })}
                      placeholder="AR"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Latitud</label>
                    <input
                      className="w-full p-2 border rounded-md"
                      type="number"
                      step="0.0000001"
                      value={localConfig._config.geo?.lat || -34.6882652}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('_config', 'geo', { 
                        code: localConfig._config.geo?.code || 'AR',
                        lat: parseFloat(e.target.value),
                        lon: localConfig._config.geo?.lon || -58.5685501
                      })}
                      placeholder="-34.6882652"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Longitud</label>
                    <input
                      className="w-full p-2 border rounded-md"
                      type="number"
                      step="0.0000001"
                      value={localConfig._config.geo?.lon || -58.5685501}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('_config', 'geo', { 
                        code: localConfig._config.geo?.code || 'AR',
                        lat: localConfig._config.geo?.lat || -34.6882652,
                        lon: parseFloat(e.target.value)
                      })}
                      placeholder="-58.5685501"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Por defecto: Buenos Aires, Argentina 🇦🇷 (mismo que haxbotron original)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={localConfig._config.public}
                  onCheckedChange={(checked: boolean) => updateConfig('_config', 'public', checked)}
                />
                <label className="text-sm font-medium">Sala Pública</label>
                <Badge variant={localConfig._config.public ? "default" : "secondary"}>
                  {localConfig._config.public ? "Visible en lista" : "Solo por link"}
                </Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Configuración de Juego */}
        <TabsContent value="game" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reglas del Juego</CardTitle>
              <CardDescription>
                Configuración de las reglas y mecánicas del juego
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scoreLimit">Límite de Goles</Label>
                  <Input
                    id="scoreLimit"
                    type="number"
                    min="0"
                    max="14"
                    value={localConfig.rules.requisite.scoreLimit}
                    onChange={(e) => updateConfig('rules', 'requisite.scoreLimit', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">0 = Ilimitado</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Límite de Tiempo (minutos)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="0"
                    max="14"
                    value={localConfig.rules.requisite.timeLimit}
                    onChange={(e) => updateConfig('rules', 'requisite.timeLimit', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">0 = Ilimitado</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumPlayers">Jugadores Mínimos</Label>
                  <Input
                    id="minimumPlayers"
                    type="number"
                    min="1"
                    max="10"
                    value={localConfig.rules.requisite.minimumPlayers}
                    onChange={(e) => updateConfig('rules', 'requisite.minimumPlayers', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eachTeamPlayers">Jugadores por Equipo</Label>
                  <Input
                    id="eachTeamPlayers"
                    type="number"
                    min="1"
                    max="15"
                    value={localConfig.rules.requisite.eachTeamPlayers}
                    onChange={(e) => updateConfig('rules', 'requisite.eachTeamPlayers', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="teamLock"
                    checked={localConfig.rules.requisite.teamLock}
                    onCheckedChange={(checked: boolean) => updateConfig('rules', 'requisite.teamLock', checked)}
                  />
                  <Label htmlFor="teamLock">Bloquear Equipos</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoOperating"
                    checked={localConfig.rules.autoOperating}
                    onCheckedChange={(checked: boolean) => updateConfig('rules', 'autoOperating', checked)}
                  />
                  <Label htmlFor="autoOperating">Operación Automática</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="statsRecord"
                    checked={localConfig.rules.statsRecord}
                    onCheckedChange={(checked: boolean) => updateConfig('rules', 'statsRecord', checked)}
                  />
                  <Label htmlFor="statsRecord">Registrar Estadísticas</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Física de la Pelota</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ballRadius">Radio de la Pelota</Label>
                    <Input
                      id="ballRadius"
                      type="number"
                      step="0.1"
                      min="1"
                      max="20"
                      value={localConfig.settings.ballRadius}
                      onChange={(e) => updateConfig('settings', 'ballRadius', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ballInvMass">Masa Inversa</Label>
                    <Input
                      id="ballInvMass"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={localConfig.settings.ballInvMass}
                      onChange={(e) => updateConfig('settings', 'ballInvMass', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ballBCoeff">Coeficiente de Rebote</Label>
                    <Input
                      id="ballBCoeff"
                      type="number"
                      step="0.01"
                      min="0"
                      max="2"
                      value={localConfig.settings.ballBCoeff}
                      onChange={(e) => updateConfig('settings', 'ballBCoeff', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ballDamping">Amortiguación</Label>
                    <Input
                      id="ballDamping"
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="1"
                      value={localConfig.settings.ballDamping}
                      onChange={(e) => updateConfig('settings', 'ballDamping', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Sistema de Balance</h4>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="balanceEnabled"
                    checked={localConfig.settings.balanceEnabled}
                    onCheckedChange={(checked: boolean) => updateConfig('settings', 'balanceEnabled', checked)}
                  />
                  <Label htmlFor="balanceEnabled">Balance Automático</Label>
                </div>

                {localConfig.settings.balanceEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="balanceMode">Modo de Balance</Label>
                      <select
                        id="balanceMode"
                        className="w-full p-2 border rounded-md"
                        value={localConfig.rules.balanceMode}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateConfig('rules', 'balanceMode', e.target.value)}
                        disabled={configLoading}
                      >
                        {configLoading ? (
                          <option>Loading...</option>
                        ) : (
                          Object.entries(balanceModes).map(([key, mode]: [string, any]) => (
                            <option key={key} value={key}>
                              {mode.name}
                            </option>
                          ))
                        )}
                      </select>
                      {!configLoading && balanceModes[localConfig.rules.balanceMode] && (
                        <p className="text-xs text-gray-500 mt-1">
                          {balanceModes[localConfig.rules.balanceMode].description}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="balanceMaxPlayers">Máx. Jugadores por Equipo</Label>
                      <Input
                        id="balanceMaxPlayers"
                        type="number"
                        min="1"
                        max="15"
                        value={localConfig.settings.balanceMaxPlayersPerTeam}
                        onChange={(e) => updateConfig('settings', 'balanceMaxPlayersPerTeam', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Configuración Avanzada */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Configuración Avanzada</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">RUID (Room Unique ID)</label>
                <input
                  className="w-full p-2 border rounded-md bg-gray-100 text-gray-600"
                  value={localConfig.ruid}
                  readOnly
                  placeholder="haxbotron-room-default"
                />
                <p className="text-xs text-gray-500">El RUID se establece al crear la imagen y no se puede modificar</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Mapa por Defecto</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={localConfig.rules.defaultMapName}
                  onChange={(e) => updateConfig('rules', 'defaultMapName', e.target.value)}
                  disabled={configLoading}
                >
                  {configLoading ? (
                    <option>Loading...</option>
                  ) : (
                    Object.entries(stadiums).map(([key, name]: [string, any]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Mapa de Entrenamiento</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={localConfig.rules.readyMapName}
                  onChange={(e) => updateConfig('rules', 'readyMapName', e.target.value)}
                  disabled={configLoading}
                >
                  {configLoading ? (
                    <option>Loading...</option>
                  ) : (
                    Object.entries(stadiums).map(([key, name]: [string, any]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Opciones JSON Personalizadas</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={localConfig.rules.customJSONOptions}
                  onChange={(e) => updateConfig('rules', 'customJSONOptions', e.target.value)}
                  placeholder='{"customOption": "value"}'
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Gestión de Contraseñas de Admin */}
          {serverImageId && (
            <div className="bg-white p-6 rounded-lg border">
              <AdminPasswordsManager serverImageId={serverImageId} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}