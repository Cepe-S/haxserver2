import { Logger } from '../logger/Logger';

export interface GeoLocationData {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  isp?: string;
  isVpn?: boolean;
  isProxy?: boolean;
  isTor?: boolean;
  threatLevel?: 'low' | 'medium' | 'high';
}

export class GeoLocationService {
  private logger = new Logger('GeoLocation');
  private cache = new Map<string, GeoLocationData>();

  async getLocationData(ipAddress: string): Promise<GeoLocationData> {
    if (this.cache.has(ipAddress)) {
      return this.cache.get(ipAddress)!;
    }

    const fallbackData: GeoLocationData = {
      country: 'Unknown',
      threatLevel: 'low'
    };

    try {
      const response = await fetch(
        `http://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city,timezone,isp,proxy,query`,
        { signal: AbortSignal.timeout(3000) }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'fail') {
        throw new Error(data.message || 'IP lookup failed');
      }

      const locationData: GeoLocationData = {
        country: data.country,
        region: data.regionName,
        city: data.city,
        timezone: data.timezone,
        isp: data.isp,
        isProxy: data.proxy || false,
        isVpn: this.detectVpn(data.isp),
        isTor: this.detectTor(data.isp),
        threatLevel: this.calculateThreatLevel(data)
      };

      this.cache.set(ipAddress, locationData);
      setTimeout(() => this.cache.delete(ipAddress), 60 * 60 * 1000);

      return locationData;

    } catch (error) {
      this.logger.warn('Geo lookup skipped or failed — join continues', { error: (error as Error).message, ipAddress });
      return fallbackData;
    }
  }

  private detectVpn(isp?: string): boolean {
    if (!isp) return false;
    
    const vpnKeywords = ['vpn', 'virtual private', 'proxy', 'tunnel', 'nordvpn', 'expressvpn'];
    const text = isp.toLowerCase();
    return vpnKeywords.some(keyword => text.includes(keyword));
  }

  private detectTor(isp?: string): boolean {
    if (!isp) return false;
    
    const torKeywords = ['tor', 'onion', 'relay'];
    const text = isp.toLowerCase();
    return torKeywords.some(keyword => text.includes(keyword));
  }

  private calculateThreatLevel(data: any): 'low' | 'medium' | 'high' {
    let score = 0;
    
    if (data.proxy) score += 2;
    if (this.detectVpn(data.isp)) score += 2;
    if (this.detectTor(data.isp)) score += 3;
    
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }
}