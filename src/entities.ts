// entities.ts — expanded Entity filter (Local / Africa / Global) + alias matcher.
// NOTE: verify the Ethiopian list against the current NBE licensed-bank register;
// licences, mergers and new entrants change often.

export type Scope = 'Local' | 'Africa' | 'Global';
export type Kind = 'Regulator' | 'Infrastructure' | 'Fintech' | 'Bank' | 'DFI';

export interface Entity {
  id: string;
  name: string;
  scope: Scope;
  kind: Kind;
  aliases: string[];   // lowercase; matched with word boundaries
  self?: boolean;      // Awash Bank, for highlighting
}

const e = (id: string, name: string, scope: Scope, kind: Kind, aliases: string[] = [], self = false): Entity =>
  ({ id, name, scope, kind, aliases: [name.toLowerCase(), ...aliases.map(a => a.toLowerCase())], self });

export const ENTITIES: Entity[] = [
  // ---------- LOCAL: regulators, infrastructure, fintech ----------
  e('nbe', 'National Bank of Ethiopia', 'Local', 'Regulator', ['nbe']),
  e('ecma', 'Ethiopian Capital Market Authority', 'Local', 'Regulator', ['ecma']),
  e('esx', 'Ethiopian Securities Exchange', 'Local', 'Infrastructure', ['esx']),
  e('ethswitch', 'EthSwitch', 'Local', 'Infrastructure', ['ethswitch s.c.']),
  e('telebirr', 'telebirr', 'Local', 'Fintech', ['ethio telecom']),
  e('mpesa_et', 'M-Pesa Ethiopia', 'Local', 'Fintech', ['safaricom ethiopia']),

  // ---------- LOCAL: banks ----------
  e('awash', 'Awash Bank', 'Local', 'Bank', ['awash international bank', 'awash birr'], true),
  e('cbe', 'Commercial Bank of Ethiopia', 'Local', 'Bank', ['cbe', 'cbe birr']),
  e('dashen', 'Dashen Bank', 'Local', 'Bank', ['dashen']),
  e('abyssinia', 'Bank of Abyssinia', 'Local', 'Bank', ['abyssinia bank']),
  e('wegagen', 'Wegagen Bank', 'Local', 'Bank', ['wegagen']),
  e('united', 'United Bank', 'Local', 'Bank', ['united bank s.c.']),
  e('nib', 'Nib International Bank', 'Local', 'Bank', ['nib bank']),
  e('coopbank', 'Cooperative Bank of Oromia', 'Local', 'Bank', ['coopbank', 'coop bank of oromia']),
  e('lion', 'Lion International Bank', 'Local', 'Bank', ['lion bank']),
  e('zemen', 'Zemen Bank', 'Local', 'Bank'),
  e('oromia', 'Oromia Bank', 'Local', 'Bank', ['oromia international bank']),
  e('bunna', 'Bunna Bank', 'Local', 'Bank', ['bunna international bank']),
  e('berhan', 'Berhan Bank', 'Local', 'Bank', ['berhan international bank']),
  e('abay', 'Abay Bank', 'Local', 'Bank'),
  e('addis_intl', 'Addis International Bank', 'Local', 'Bank'),
  e('enat', 'Enat Bank', 'Local', 'Bank'),
  e('hibret', 'Hibret Bank', 'Local', 'Bank', ['hibret']),
  e('global_et', 'Global Bank Ethiopia', 'Local', 'Bank'),
  e('siinqee', 'Siinqee Bank', 'Local', 'Bank', ['siinqee']),
  e('amhara', 'Amhara Bank', 'Local', 'Bank'),
  e('tsehay', 'Tsehay Bank', 'Local', 'Bank'),
  e('hijra', 'Hijra Bank', 'Local', 'Bank'),
  e('zamzam', 'ZamZam Bank', 'Local', 'Bank', ['zamzam']),
  e('gadaa', 'Gadaa Bank', 'Local', 'Bank'),
  e('shabelle', 'Shabelle Bank', 'Local', 'Bank'),
  e('ahadu', 'Ahadu Bank', 'Local', 'Bank'),
  e('goh', 'Goh Betoch Bank', 'Local', 'Bank', ['goh bank']),
  e('rammis', 'Rammis Bank', 'Local', 'Bank'),
  e('omo', 'Omo Bank', 'Local', 'Bank'),
  e('tsedey', 'Tsedey Bank', 'Local', 'Bank'),
  e('sidama', 'Sidama Bank', 'Local', 'Bank'),
  e('desta', 'Desta Bank', 'Local', 'Bank'),

  // ---------- AFRICA: tier-1 banks, pan-African champions, DFIs ----------
  e('standard_bank', 'Standard Bank Group', 'Africa', 'Bank', ['stanbic', 'standard bank']),
  e('equity_bank', 'Equity Bank', 'Africa', 'Bank', ['equity group']),
  e('kcb', 'KCB Group', 'Africa', 'Bank', ['kcb bank', 'kenya commercial bank']),
  e('absa', 'Absa Group', 'Africa', 'Bank', ['absa bank', 'barclays africa']),
  e('ecobank', 'Ecobank', 'Africa', 'Bank', ['ecobank transnational']),
  e('uba', 'United Bank for Africa', 'Africa', 'Bank', ['uba']),
  e('nedbank', 'Nedbank Group', 'Africa', 'Bank', ['nedbank']),
  e('firstrand', 'FirstRand', 'Africa', 'Bank', ['fnb', 'first national bank']),
  e('access_bank', 'Access Bank', 'Africa', 'Bank', ['access holdings']),
  e('zenith_bank', 'Zenith Bank', 'Africa', 'Bank'),
  e('attijariwafa', 'Attijariwafa Bank', 'Africa', 'Bank'),
  e('bank_of_africa', 'Bank of Africa', 'Africa', 'Bank', ['boa group']),
  e('afreximbank', 'Afreximbank', 'Africa', 'DFI', ['african export-import bank']),
  e('tdb', 'Trade and Development Bank', 'Africa', 'DFI', ['tdb group', 'pta bank']),
  e('afdb', 'African Development Bank', 'Africa', 'DFI', ['afdb']),

  // ---------- GLOBAL: GSIBs, major tech/core vendors & payment networks ----------
  e('jpmorgan', 'JPMorgan Chase', 'Global', 'Bank', ['jpmorgan', 'chase']),
  e('citi', 'Citi', 'Global', 'Bank', ['citibank', 'citigroup']),
  e('hsbc', 'HSBC', 'Global', 'Bank', ['hsbc bank']),
  e('standard_chartered', 'Standard Chartered', 'Global', 'Bank', ['stan chart', 'scb']),
  e('bnp_paribas', 'BNP Paribas', 'Global', 'Bank'),
  e('santander', 'Banco Santander', 'Global', 'Bank', ['santander']),
  e('barclays', 'Barclays', 'Global', 'Bank'),
  e('deutsche_bank', 'Deutsche Bank', 'Global', 'Bank'),
  e('ubs', 'UBS', 'Global', 'Bank', ['credit suisse']),
  e('bofa', 'Bank of America', 'Global', 'Bank', ['bofa']),
  e('wells_fargo', 'Wells Fargo', 'Global', 'Bank'),
  e('goldman_sachs', 'Goldman Sachs', 'Global', 'Bank'),
  e('morgan_stanley', 'Morgan Stanley', 'Global', 'Bank'),
  e('ing', 'ING Group', 'Global', 'Bank', ['ing bank']),
  e('bbva', 'BBVA', 'Global', 'Bank'),
  e('visa', 'Visa', 'Global', 'Infrastructure', ['visa inc']),
  e('mastercard', 'Mastercard', 'Global', 'Infrastructure', ['mastercard inc']),
  e('swift', 'SWIFT', 'Global', 'Infrastructure', ['swift scrl']),
  e('temenos', 'Temenos', 'Global', 'Fintech', ['temenos t24', 'transact']),
  e('infosys_finacle', 'Infosys Finacle', 'Global', 'Fintech', ['finacle']),
  e('oracle_fss', 'Oracle FSS', 'Global', 'Fintech', ['flexcube', 'oracle financial services']),
];

export const ENTITY_BY_ID = Object.fromEntries(ENTITIES.map(ent => [ent.id, ent])) as Record<string, Entity>;

// Match entities against text with word boundaries
export function matchEntities(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const ent of ENTITIES) {
    for (const alias of ent.aliases) {
      if (!alias) continue;
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`\\b${escaped}\\b`, 'i');
      if (rx.test(lower)) {
        matched.push(ent.name);
        break;
      }
    }
  }
  return matched;
}
