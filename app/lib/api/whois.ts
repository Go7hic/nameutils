import { requestJson } from './http';
import type { WhoisData } from '../../types/database';

export async function getWhoisData(domainName: string): Promise<WhoisData> {
  return requestJson<WhoisData>(`/api/whois/${encodeURIComponent(domainName)}`);
}
