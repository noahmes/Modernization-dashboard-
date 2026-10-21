export type Geography = 'Global' | 'Africa' | 'Ethiopia' | 'Cross-border';

export type ModernizationCategory =
  | 'Product/Service Launch'
  | 'Partnership'
  | 'Technology Acquisition / Platform Deal'
  | 'Business Process Modernization / Automation'
  | 'Transformation Initiative / Strategy Announcement'
  | 'Funding / Valuation Signal';

import type { ThemeId, ThemeCluster, Theme } from '../themes';
export type { ThemeId, ThemeCluster, Theme };

export type ThemeTag = ThemeId | string;

export type ImpactLevel =
  | 'High (large bank or systemic)'
  | 'Medium'
  | 'Watchlist';

export type SourceReliability =
  | 'Tier-1 (press release / official)'
  | 'Tier-2 (reputable media)'
  | 'Social / Unverified';

export interface EntityResolution {
  bankOrFintech: string;
  partnerOrVendor?: string;
  regulatorOrPlatform?: string;
}

export interface DuplicateSource {
  source: string;
  title: string;
  url: string;
  timestamp: string;
  reliability: SourceReliability;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  changedBy: string;
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

export interface InternalMilestoneLink {
  bank: 'Awash Bank' | 'Wegagen Bank' | 'Commercial Bank of Ethiopia' | 'Dashen Bank' | 'EthSwitch';
  projectName: string;
  phase: string;
  alignmentSummary: string;
  status: 'In Progress' | 'On Track' | 'Pending NBE Sign-off' | 'Completed';
  targetQuarter: string;
}

export interface ModernizationItem {
  id: string;
  title: string;
  summary: string;
  takeaway: string;
  date: string; // ISO format e.g. 2026-10-18
  timestampFormatted: string;
  geography: Geography;
  category: ModernizationCategory;
  themeTags: ThemeTag[];
  impact: ImpactLevel;
  reliability: SourceReliability;
  verified: boolean;
  confidenceScore: number;
  source: string;
  sourceUrl: string;
  entities: EntityResolution;
  duplicatesResolved?: DuplicateSource[];
  auditHistory: AuditRecord[];
  isPinnedEthiopia?: boolean;
  internalProjectLinked?: InternalMilestoneLink;
}

export interface MonitoredSource {
  id: string;
  name: string;
  website: string;
  region: 'Ethiopia' | 'Africa' | 'Global';
  reliability: SourceReliability;
  feedUrl?: string;
  type: 'Industry Media' | 'Regulatory Gateway' | 'Commercial Bank' | 'Central Bank' | 'Vendor Wire' | 'Official Press Room';
  categoryGroup: 'Global Media' | 'Africa Media' | 'Ethiopia Media & Regulators' | 'Ethiopian Banks' | 'African Banks' | 'Global Banks';
  status: 'Active' | 'Paused' | 'Degraded';
  lastChecked: string;
  itemsFoundThisWeek: number;
}

export interface FilterState {
  searchQuery: string;
  geography: Geography | 'All';
  category: ModernizationCategory | 'All';
  themeTags: ThemeTag[];
  impact: ImpactLevel | 'All';
  reliability: SourceReliability | 'All';
  timePreset: 'this_week' | 'oct_5_9' | 'last_14_days' | 'all';
  onlyEthiopia: boolean;
  onlyHighImpact: boolean;
  onlyVerified: boolean;
}

export interface InternalMilestone {
  id: string;
  bank: string;
  projectCode: string;
  title: string;
  pillar: 'Core Composable' | 'FX & Treasury' | 'Instant Payments / EthSwitch' | 'Digital Onboarding' | 'Agentic AI';
  lead: string;
  status: 'On Track' | 'In Progress' | 'Under Review' | 'Completed';
  targetDate: string;
  keyDeliverable: string;
  externalDrivers: string[];
}
