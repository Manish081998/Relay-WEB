export interface HeaderCell {
  label: string;
  rowspan?: number;
  colspan?: number;
}

export interface TableColumn {
  key: string; // property key on the parsed Record<string, string>
  label: string; // display label for simple (single-row) headers
  xmlTags: string[]; // XML element names to try in order; first non-empty wins
  align: 'left' | 'center' | 'right';
  widthPct: number; // <col> width as a percentage
}

/** Possible &lt;SellingWareHouse&gt; values — identifies the brand for an order. */
export type Brand = 'TTS' | 'TNB' | 'PEN' | 'KRU';

export interface OrderTypeConfig {
  id:
    | 'titusgrd'
    | 'tnbheader'
    | 'titusterminal'
    | 'generic'
    | 'titusrepairparts'
    | 'tituschildedcbsyn'
    | 'titusffd'
    | 'titustec'
    | 'titusvsrisers'
    | 'titusexv'
    | 'tnbheadervav'
    | 'tnbheader7'
    | 'tnbheaderdv'
    | 'tnbheader13'
    | 'tnbheader18'
    | 'krugrd'
    | 'kruchilledbeams'
    | 'krusingleduct'
    | 'krudualduct'
    | 'krufanpowered'
    | 'kruheaterrack'
    | 'krucrff'
    | 'krudisplace'
    | 'krurepairparts'
    | 'krustandardfancoil'
    | 'kruahu'
    | 'krublowercoil'
    | 'krufancoilnfchorzchc'
    | 'krufancoilnfchorzstand'
    | 'krufancoilnfcvertstand'
    | 'krufancoilnfcvertstack';
  /** Which brand root element this category lives under in the XML. */
  brand: Brand;
  /** Human-readable section heading shown on Page 2 when multiple sections are present. */
  label: string;
  /** When 'block', Page 2 renders a per-model card layout instead of a flat table.
   *  When 'kru-block', renders a per-model card with label/value field pairs (KRU complex units). */
  renderMode?: 'table' | 'block' | 'kru-block';
  /** KRU complex units only: ordered list of field rows shown in the per-model card. */
  blockFields?: { label: string; xmlTag: string }[];
  /** CSS selector used to find Group elements in the XML */
  groupSelector: string;
  /** Drives both XML parsing and body-cell rendering */
  columns: TableColumn[];
  /** Each inner array is one <tr> in <thead>. Cells omitted when covered by rowspan above. */
  headerRows: HeaderCell[][];
}

// ── TitusGRD ─────────────────────────────────────────────────────────────────
const TITUSGRD_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 4 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 4 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 10 },
  { key: 'dimOne', label: 'Dim 1', xmlTags: ['DimOne', 'WIDTH', 'DIM1'], align: 'center', widthPct: 5 },
  { key: 'dimTwo', label: 'Dim 2', xmlTags: ['DimTwo', 'HEIGHT', 'DIM2'], align: 'center', widthPct: 5 },
  {
    key: 'modSize',
    label: 'Module Size',
    xmlTags: ['ModSize_Border_Plen', 'MODULE'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'frameBorder',
    label: 'Frame',
    xmlTags: ['FrameBorder', 'BORDER', 'FRAME'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'finish', label: 'Finish', xmlTags: ['Finish', 'FINISH'], align: 'center', widthPct: 5 },
  {
    key: 'fastenPattern',
    label: 'Fastener',
    xmlTags: ['FastenPattern', 'MOUNTING', 'PATTERN'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'damper',
    label: 'Damper Model',
    xmlTags: ['Damper', 'DAMPER'],
    align: 'center',
    widthPct: 6,
  },
  { key: 'accOne', label: 'Acc 1', xmlTags: ['AccOne', 'ACC1'], align: 'center', widthPct: 5 },
  { key: 'accTwo', label: 'Acc 2', xmlTags: ['AccTwo', 'ACC2'], align: 'center', widthPct: 5 },
  { key: 'accThree', label: 'Acc 3', xmlTags: ['AccThree', 'ACC3'], align: 'center', widthPct: 5 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 9,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 10 },
];

const TITUSGRD_HEADER: HeaderCell[][] = [
  [
    { label: 'Line', rowspan: 3 },
    { label: 'Qty', rowspan: 3 },
    { label: 'Model', rowspan: 3 },
    { label: 'Dim 1', rowspan: 3 },
    { label: 'Dim 2', rowspan: 3 },
    { label: 'Module Size' },
    { label: 'Frame', rowspan: 3 },
    { label: 'Finish', rowspan: 3 },
    { label: 'Fastener', rowspan: 2 },
    { label: 'Damper Model', rowspan: 2 },
    { label: 'Accessories', rowspan: 3, colspan: 3 },
    { label: 'Price Each', rowspan: 3 },
    { label: 'Total Price', rowspan: 3 },
  ],
  [{ label: 'End Border' }],
  [{ label: 'Plenum Inlet' }, { label: 'Pattern' }, { label: 'Angle Cut' }],
];

export const TITUSGRD_CONFIG: OrderTypeConfig = {
  id: 'titusgrd',
  brand: 'TTS',
  label: 'Titus GRD',
  groupSelector: 'LineItems > Group, TitusGRD > Group',
  columns: TITUSGRD_COLUMNS,
  headerRows: TITUSGRD_HEADER,
};

// ── TnBHeader ─────────────────────────────────────────────────────────────────
const TNBHEADER_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 3 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 3 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 8 },
  {
    key: 'control',
    label: 'Air Pattern',
    xmlTags: ['Gd7AirPatternM'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'bladePattern',
    label: 'Bar Pattern',
    xmlTags: ['Ga1DrumSize'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'dim1',
    label: 'Width',
    xmlTags: ['Ga1Dim1', 'Ga1Width', 'Ga1Length', 'Gp4NeckSizePc', 'Ga2SquareNeck'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'dim2',
    label: 'Height',
    xmlTags: ['Ga1Dim2', 'Ga1Height', 'Ga2RoundNeck'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'defPattern',
    label: 'Def Pattern',
    xmlTags: ['Gd7DefPatternM'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'margin', label: 'Margin Style', xmlTags: ['Ga3Margin'], align: 'center', widthPct: 5 },
  {
    key: 'module',
    label: 'Module Size',
    xmlTags: ['Ga4ModuleFixed', 'Ga4ModuleUnfixed'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'hinge',
    label: 'Hinge/Cable',
    xmlTags: ['GpHingeLocation', 'GpCableLength'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'fastening',
    label: 'Fast. Style',
    xmlTags: ['Gg5ScrewHoles'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'filterFrame',
    label: 'Filter Frame',
    xmlTags: ['GgFilterFrame'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'damper', label: 'Damper', xmlTags: ['GaaDamper'], align: 'center', widthPct: 4 },
  {
    key: 'accy1',
    label: 'Accy 1',
    xmlTags: ['Gd5Accessories1', 'Gg6MountingFrame45'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'accy2', label: 'Accy 2', xmlTags: ['Gd5Accessories2'], align: 'center', widthPct: 4 },
  { key: 'accy3', label: 'Accy 3', xmlTags: ['Gd5Accessories3'], align: 'center', widthPct: 4 },
  { key: 'finish', label: 'Finish', xmlTags: ['Ga9Finish'], align: 'center', widthPct: 4 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 8,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 8 },
];

const TNBHEADER_HEADER: HeaderCell[][] = [
  [
    { label: 'Line', rowspan: 4 },
    { label: 'Qty', rowspan: 4 },
    { label: 'Model', rowspan: 4 },
    { label: 'Control' },
    { label: 'Blade Pattern' },
    { label: '' },
    { label: '' },
    { label: 'Def Pattern' },
    { label: '' },
    { label: '' },
    { label: '' },
    { label: 'Fastening style', rowspan: 2 },
    { label: 'Filter Frame' },
    { label: '' },
    { label: '' },
    { label: '' },
    { label: '' },
    { label: 'Finish', rowspan: 4 },
    { label: 'Price Each', rowspan: 4 },
    { label: 'Total Price', rowspan: 4 },
  ],
  [
    { label: 'Air Pattern' },
    { label: 'Bar Pattern' },
    { label: 'Width' },
    { label: 'Height' },
    { label: 'Adj Type' },
    { label: '' },
    { label: 'Module(s) Size', rowspan: 2 },
    { label: 'Hinge Location', rowspan: 2 },
    { label: 'Sleeve' },
    { label: 'Damper', rowspan: 2 },
    { label: 'Accy 1', rowspan: 2 },
    { label: 'Accy 2', rowspan: 2 },
    { label: 'Accy 3', rowspan: 2 },
  ],
  [
    { label: 'Plaque' },
    { label: 'Drum SZ / EndCap Style' },
    { label: 'Length' },
    { label: '' },
    { label: 'Slots' },
    { label: 'Margin Style' },
    { label: '' },
    { label: 'Element(s)' },
    { label: '' },
  ],
  [
    { label: 'Shock-Vibe' },
    { label: '' },
    { label: 'Square Neck' },
    { label: 'Round Duct Size' },
    { label: 'Material' },
    { label: '' },
    { label: 'Cable Length' },
    { label: 'Transformer' },
    { label: 'Return Width' },
    { label: 'Return Height' },
    { label: 'Insulation' },
    { label: 'CFM' },
    { label: 'T-Stat' },
    { label: 'Cable length' },
  ],
];

export const TNBHEADER_CONFIG: OrderTypeConfig = {
  id: 'tnbheader',
  brand: 'TNB',
  label: 'TNB Header',
  groupSelector: 'TnBHeader0 > Group',
  columns: TNBHEADER_COLUMNS,
  headerRows: TNBHEADER_HEADER,
};

// ── TNBHeaderVAV ──────────────────────────────────────────────────────────────
const TNBHEADERVAV_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 2,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 2 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 6 },
  { key: 'sensor', label: 'Sensor', xmlTags: ['SENSOR'], align: 'center', widthPct: 3 },
  {
    key: 'unitConfig',
    label: 'Unit Config',
    xmlTags: ['UnitConfig'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'liner', label: 'Liner', xmlTags: ['LINER'], align: 'center', widthPct: 3 },
  { key: 'casing', label: 'Casing', xmlTags: ['CASING'], align: 'center', widthPct: 3 },
  {
    key: 'controlSide',
    label: 'Control Side',
    xmlTags: ['CONTROLSIDE'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'caseSize', label: 'Case Size', xmlTags: ['CASESIZE'], align: 'center', widthPct: 3 },
  { key: 'inlet', label: 'Inlet Size', xmlTags: ['inlet'], align: 'center', widthPct: 3 },
  { key: 'minCfm', label: 'Min CFM', xmlTags: ['MINCFM'], align: 'center', widthPct: 3 },
  { key: 'maxCfm', label: 'Max CFM', xmlTags: ['MAXCFM'], align: 'center', widthPct: 3 },
  {
    key: 'auxFan',
    label: 'AUX/FAN CFM / Inlet Hot',
    xmlTags: ['AUXCFM', 'FANCFM', 'inlethot'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'dischOpt',
    label: 'Disch OPT / Min HOT / Voltage',
    xmlTags: ['DISCHARGEOPT', 'minhotcfm', 'volts'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'maxCfmHotEcm',
    label: 'Max CFM Hot / ECM Ctrl',
    xmlTags: ['maxhotcfm', 'ECMCONTROL'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'control', label: 'Control Type', xmlTags: ['control'], align: 'center', widthPct: 3 },
  { key: 'accOne', label: 'Accy 1', xmlTags: ['AccOne'], align: 'center', widthPct: 2 },
  { key: 'accTwo', label: 'Accy 2', xmlTags: ['AccTwo'], align: 'center', widthPct: 2 },
  { key: 'accThree', label: 'Accy 3', xmlTags: ['AccThree'], align: 'center', widthPct: 2 },
  { key: 'accFour', label: 'Accy 4', xmlTags: ['AccFour'], align: 'center', widthPct: 2 },
  { key: 'accFive', label: 'Accy 5', xmlTags: ['AccFive'], align: 'center', widthPct: 2 },
  { key: 'hydroHeat', label: 'Hydro Heat', xmlTags: ['HYDROHEAT'], align: 'center', widthPct: 3 },
  {
    key: 'electHeat',
    label: 'Heat / Elec Heat',
    xmlTags: ['ELECTHEAT', 'heat'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'kw', label: 'KW', xmlTags: ['kw'], align: 'center', widthPct: 2 },
  { key: 'heatAcc1', label: 'Heat Acc 1', xmlTags: ['ELECHEATACC'], align: 'center', widthPct: 2 },
  { key: 'heatAcc2', label: 'Heat Acc 2', xmlTags: ['ELECHEATACC2'], align: 'center', widthPct: 2 },
  {
    key: 'heatAcc3ScrAcc1',
    label: 'Heat Acc 3 / SCR Acc 1',
    xmlTags: ['ELECHEATACC3', 'SCRHEATACC1'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'scrAcc2', label: 'SCR Acc 2', xmlTags: ['SCRHEATACC2'], align: 'center', widthPct: 2 },
  { key: 'scrAcc3', label: 'SCR Acc 3', xmlTags: ['SCRHEATACC3'], align: 'center', widthPct: 2 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 5,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 5 },
];

const TNBHEADERVAV_HEADER: HeaderCell[][] = [
  [
    { label: 'Line', rowspan: 2 },
    { label: 'Qty', rowspan: 2 },
    { label: 'Model', rowspan: 2 },
    { label: 'Sensor', rowspan: 2 },
    { label: 'Unit Config', rowspan: 2 },
    { label: 'Liner', rowspan: 2 },
    { label: 'Casing', rowspan: 2 },
    { label: 'Control Side', rowspan: 2 },
    { label: 'Case Size', rowspan: 2 },
    { label: 'Inlet Size', rowspan: 2 },
    { label: 'Min CFM', rowspan: 2 },
    { label: 'Max CFM', rowspan: 2 },
    { label: 'AUX CFM / FAN CFM / Inlet Hot', rowspan: 2 },
    { label: 'Disch OPT / Min HOT / Voltage', rowspan: 2 },
    { label: 'Max CFM Hot / ECM Control', rowspan: 2 },
    { label: 'Control Type', rowspan: 2 },
    { label: 'Unit / Accy', colspan: 5 },
    { label: 'Hydro Heat', rowspan: 2 },
    { label: 'Heat / Elec Heat', rowspan: 2 },
    { label: 'KW', rowspan: 2 },
    { label: 'Heat / Accy', colspan: 3 },
    { label: 'SCR / Accy', colspan: 2 },
    { label: 'Price Each', rowspan: 2 },
    { label: 'Total Price', rowspan: 2 },
  ],
  [
    { label: '1' },
    { label: '2' },
    { label: '3' },
    { label: '4' },
    { label: '5' },
    { label: '1' },
    { label: '2' },
    { label: 'Heat Acc 3 / SCR Acc 1' },
    { label: '2' },
    { label: '3' },
  ],
];

export const TNBHEADERVAV_CONFIG: OrderTypeConfig = {
  id: 'tnbheadervav',
  brand: 'TNB',
  label: 'TNB VAV',
  groupSelector: 'TNBHeaderVAV > Group',
  columns: TNBHEADERVAV_COLUMNS,
  headerRows: TNBHEADERVAV_HEADER,
};

// ── TnBHeader7 ────────────────────────────────────────────────────────────────
const TNBHEADER7_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 4 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 4 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 10 },
  {
    key: 'plenumStyle',
    label: 'Plenum Style',
    xmlTags: ['GTensorPlenum', 'GStyle'],
    align: 'center',
    widthPct: 8,
  },
  { key: 'material', label: 'Material', xmlTags: ['Ga9Material'], align: 'center', widthPct: 7 },
  {
    key: 'neckVslot',
    label: 'Neck Size / V Slot Length',
    xmlTags: ['Ga2RoundNeck', 'GVSlotLength'],
    align: 'center',
    widthPct: 8,
  },
  {
    key: 'vSlotInlet',
    label: 'V Slot Inlet',
    xmlTags: ['GVSlotInlet'],
    align: 'center',
    widthPct: 7,
  },
  {
    key: 'marginDamper',
    label: 'Margin / Damper',
    xmlTags: ['Ga3Margin', 'GaaDamper'],
    align: 'center',
    widthPct: 7,
  },
  { key: 'module', label: 'Module', xmlTags: ['Ga4ModuleFixed'], align: 'center', widthPct: 7 },
  {
    key: 'patternVoltage',
    label: 'Pattern / Voltage',
    xmlTags: ['Gd7AirPatternM', 'GVoltageMotor'],
    align: 'center',
    widthPct: 8,
  },
  {
    key: 'accPlenumElbow',
    label: 'Acc / Plenum Elbow',
    xmlTags: ['Gd5Accessories', 'GVSlotElbow'],
    align: 'center',
    widthPct: 8,
  },
  { key: 'finish', label: 'Finish', xmlTags: ['Ga9Finish'], align: 'center', widthPct: 6 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 8,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 8 },
];

export const TNBHEADER7_CONFIG: OrderTypeConfig = {
  id: 'tnbheader7',
  brand: 'TNB',
  label: 'TNB Header 7',
  groupSelector: 'TnBHeader7 > Group',
  columns: TNBHEADER7_COLUMNS,
  headerRows: [TNBHEADER7_COLUMNS.map((c) => ({ label: c.label }))],
};

// ── TNBHeaderDV ───────────────────────────────────────────────────────────────
const TNBHEADERDV_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 5 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 5 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 12 },
  { key: 'inlet', label: 'Inlet', xmlTags: ['Gp3InletSize'], align: 'center', widthPct: 9 },
  { key: 'size', label: 'Size', xmlTags: ['GD8Size'], align: 'center', widthPct: 9 },
  {
    key: 'construction',
    label: 'Construction',
    xmlTags: ['GLinearConstruction'],
    align: 'center',
    widthPct: 12,
  },
  {
    key: 'accessories',
    label: 'Accessories',
    xmlTags: ['Gd5Accessories'],
    align: 'center',
    widthPct: 10,
  },
  {
    key: 'accessories2',
    label: 'Accessories 2',
    xmlTags: ['Gp5Accessories2'],
    align: 'center',
    widthPct: 10,
  },
  { key: 'finish', label: 'Finish', xmlTags: ['Ga9Finish'], align: 'center', widthPct: 8 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 10,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 10 },
];

export const TNBHEADERDV_CONFIG: OrderTypeConfig = {
  id: 'tnbheaderdv',
  brand: 'TNB',
  label: 'TNB DV',
  groupSelector: 'TNBHeaderDV > Group',
  columns: TNBHEADERDV_COLUMNS,
  headerRows: [TNBHEADERDV_COLUMNS.map((c) => ({ label: c.label }))],
};

// ── TnBHeader13 ───────────────────────────────────────────────────────────────
const TNBHEADER13_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 3 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 3 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 6 },
  {
    key: 'supplyInsul',
    label: 'Supply/Return / Insul.',
    xmlTags: ['GSUPPLYRETURN', 'Gz1Insulation'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'barStyle',
    label: 'Bar Style / Slots / Rows',
    xmlTags: ['GBarStyle', 'GLinearBarStyle', 'Gp4NumOfSlots', 'GEfRows', 'GEhRows'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'coreReinfDefl',
    label: 'Core / Defl / Slot / Pattern',
    xmlTags: ['GLinearConstruction', 'Gg4Deflection', 'Gp4SlotWidth', 'GAirPatternEh'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'length',
    label: 'Length',
    xmlTags: ['Ga1Length', 'GLinearLength', 'Gp4SlotLength'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'linearHeight',
    label: 'Linear Type / Height',
    xmlTags: ['Ga1Height200', 'Ga1Height', 'Ga1HeightAlpha', 'GLinearConfigType'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'diffuserModel',
    label: 'Diffuser Model',
    xmlTags: ['Gz2DiffuserModel'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'marginWidth',
    label: 'Margin Style / Width',
    xmlTags: ['GLinearMargin', 'GCaCrMarginType', 'GMarginStyle', 'Gz3Width'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'mountingRows',
    label: 'Mounting Style / Rows',
    xmlTags: ['GLinMountingStyle', 'Gz3Rows', 'GCaCrMounting'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'miterSlots',
    label: 'Miter Cut / Slots',
    xmlTags: ['GMiterCut', 'Gz3Slots'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'miterDegSide',
    label: 'Miter Deg / Side Const.',
    xmlTags: ['GMiterDegree', 'Gp3SideConst'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'inletsEndcaps',
    label: 'Inlets / Endcaps',
    xmlTags: ['GLinEndcaps', 'GNUMINLETS'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'damper', label: 'Damper', xmlTags: ['GaaDamper'], align: 'center', widthPct: 4 },
  {
    key: 'inletSize',
    label: 'Inlet Size',
    xmlTags: ['Gp3InletSize'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'acc1', label: 'Accessory 1', xmlTags: ['Gd5Accessories1'], align: 'center', widthPct: 4 },
  {
    key: 'acc2InletType',
    label: 'Accessory 2 / Inlet Type',
    xmlTags: ['Gd5Accessories2', 'Gp3InletType'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'accessDoor',
    label: 'Access Door / Duct Dia.',
    xmlTags: ['GLinearAccessDoor', 'GDuctDiameterSl', 'GDuctDiameter'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'finish', label: 'Finish', xmlTags: ['Ga9Finish'], align: 'center', widthPct: 4 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 7,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 7 },
];

export const TNBHEADER13_CONFIG: OrderTypeConfig = {
  id: 'tnbheader13',
  brand: 'TNB',
  label: 'TNB Header 13',
  groupSelector: 'TnBHeader13 > Group',
  columns: TNBHEADER13_COLUMNS,
  headerRows: [TNBHEADER13_COLUMNS.map((c) => ({ label: c.label }))],
};

// ── TnBHeader18 ───────────────────────────────────────────────────────────────
const TNBHEADER18_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 4 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 4 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 9 },
  {
    key: 'insul',
    label: 'Insulation / Slot Length',
    xmlTags: ['Gz1Insulation'],
    align: 'center',
    widthPct: 7,
  },
  { key: 'length', label: 'Length', xmlTags: ['Gp4SlotLength'], align: 'center', widthPct: 6 },
  {
    key: 'downblowLen',
    label: 'Downblow Length',
    xmlTags: ['Gp6DownBlowLength'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'numSlots',
    label: 'Number of Slots',
    xmlTags: ['Gp4NumOfSlots'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'plenumInlet',
    label: 'Plenum Inlet Size',
    xmlTags: ['Gp3InletSize'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'slotsWidth',
    label: 'Slots Width',
    xmlTags: ['Gp4SlotWidth'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'tbarPattern',
    label: 'T-Bar Config / Pattern',
    xmlTags: ['Gp4TbarConfig', 'Gp6Pattern'],
    align: 'center',
    widthPct: 8,
  },
  { key: 'damper', label: 'Damper', xmlTags: ['Gp5InletDamper'], align: 'center', widthPct: 5 },
  { key: 'acc1', label: 'ACC 1', xmlTags: ['Gp5Accessories1'], align: 'center', widthPct: 5 },
  { key: 'acc2', label: 'ACC 2', xmlTags: ['Gp5Accessories2'], align: 'center', widthPct: 5 },
  { key: 'acc3', label: 'ACC 3', xmlTags: ['Gp5Accessories3'], align: 'center', widthPct: 5 },
  { key: 'finish', label: 'Finish', xmlTags: ['Ga9Finish'], align: 'center', widthPct: 5 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 8,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 11 },
];

export const TNBHEADER18_CONFIG: OrderTypeConfig = {
  id: 'tnbheader18',
  brand: 'TNB',
  label: 'TNB Header 18',
  groupSelector: 'TnBHeader18 > Group',
  columns: TNBHEADER18_COLUMNS,
  headerRows: [TNBHEADER18_COLUMNS.map((c) => ({ label: c.label }))],
};

// ── TitusTerminal ─────────────────────────────────────────────────────────────
const TITUSTERMINAL_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 2 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 2 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 5 },
  { key: 'sensor', label: 'Sensor', xmlTags: ['SensorCode'], align: 'center', widthPct: 3 },
  { key: 'unitConfig', label: 'Unit Cfg', xmlTags: ['UnitConfig'], align: 'center', widthPct: 3 },
  { key: 'liner', label: 'Liner', xmlTags: ['LinerOption'], align: 'center', widthPct: 2 },
  { key: 'casing', label: 'Casing', xmlTags: ['CasingConfig'], align: 'center', widthPct: 3 },
  { key: 'coldInlet', label: 'Cold Inlet', xmlTags: ['ColdInlet'], align: 'center', widthPct: 2 },
  { key: 'hotInlet', label: 'Hot Inlet', xmlTags: ['HotInlet'], align: 'center', widthPct: 2 },
  { key: 'unitSize', label: 'Unit Size', xmlTags: ['UnitSize'], align: 'center', widthPct: 3 },
  {
    key: 'fanBoxInlet',
    label: 'Fan Box Inlet',
    xmlTags: ['FanBoxInletSize'],
    align: 'center',
    widthPct: 2,
  },
  {
    key: 'inletSize',
    label: '>Inlet Size',
    xmlTags: ['DuctInletSize'],
    align: 'center',
    widthPct: 2,
  },
  { key: 'ductType', label: 'Duct Size', xmlTags: ['DuctType'], align: 'center', widthPct: 2 },
  { key: 'motorSize', label: 'Motor', xmlTags: ['MotorSize'], align: 'center', widthPct: 2 },
  { key: 'ctrlType', label: 'Ctrl Type', xmlTags: ['ControlType'], align: 'center', widthPct: 3 },
  { key: 'coldCtrl', label: 'Cold Ctrl', xmlTags: ['ColdCtrl'], align: 'center', widthPct: 2 },
  { key: 'hotCtrl', label: 'Hot Ctrl', xmlTags: ['HotCtrl'], align: 'center', widthPct: 2 },
  { key: 'actType', label: 'Act Type', xmlTags: ['ActType'], align: 'center', widthPct: 3 },
  { key: 'maxCfm', label: 'Max CFM', xmlTags: ['MaxCfm'], align: 'center', widthPct: 3 },
  {
    key: 'maxCfmCold',
    label: 'Max CFM Cold',
    xmlTags: ['MaxCfmCold'],
    align: 'center',
    widthPct: 2,
  },
  { key: 'minCfm', label: 'Min CFM', xmlTags: ['MinCfm'], align: 'center', widthPct: 3 },
  { key: 'fanCfm', label: 'Fan CFM', xmlTags: ['FanCfm'], align: 'center', widthPct: 2 },
  { key: 'maxCfmHot', label: 'Max CFM Hot', xmlTags: ['MaxCfmHot'], align: 'center', widthPct: 2 },
  { key: 'ctrlAcc1', label: 'Ctrl Acc 1', xmlTags: ['CtrlAccOne'], align: 'center', widthPct: 2 },
  { key: 'ctrlAcc2', label: 'Ctrl Acc 2', xmlTags: ['CtrlAccTwo'], align: 'center', widthPct: 2 },
  { key: 'ctrlAcc3', label: 'Ctrl Acc 3', xmlTags: ['CtrlAccThree'], align: 'center', widthPct: 2 },
  { key: 'unitAcc1', label: 'Unit Acc 1', xmlTags: ['UnitAccOne'], align: 'center', widthPct: 2 },
  { key: 'unitAcc2', label: 'Unit Acc 2', xmlTags: ['UnitAccTwo'], align: 'center', widthPct: 2 },
  { key: 'unitAcc3', label: 'Unit Acc 3', xmlTags: ['UnitAccThree'], align: 'center', widthPct: 2 },
  { key: 'unitAcc4', label: 'Unit Acc 4', xmlTags: ['UnitAccFour'], align: 'center', widthPct: 2 },
  { key: 'unitAcc5', label: 'Unit Acc 5', xmlTags: ['UnitAccFive'], align: 'center', widthPct: 2 },
  { key: 'waterCoil', label: 'Water Coil', xmlTags: ['WaterCoil'], align: 'center', widthPct: 2 },
  { key: 'elecCoil', label: 'Elec Coil', xmlTags: ['ElecCoilType'], align: 'center', widthPct: 2 },
  { key: 'kw', label: 'KW', xmlTags: ['Kw'], align: 'center', widthPct: 2 },
  { key: 'coilAcc1', label: 'Coil Acc 1', xmlTags: ['CoilAccOne'], align: 'center', widthPct: 2 },
  { key: 'coilAcc2', label: 'Coil Acc 2', xmlTags: ['CoilAccTwo'], align: 'center', widthPct: 2 },
  { key: 'coilAcc3', label: 'Coil Acc 3', xmlTags: ['CoilAccThree'], align: 'center', widthPct: 2 },
  { key: 'coilAcc4', label: 'Coil Acc 4', xmlTags: ['CoilAccFour'], align: 'center', widthPct: 2 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 4,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 4 },
];

const TITUSTERMINAL_HEADER: HeaderCell[][] = [
  [
    { label: 'Line', rowspan: 2 },
    { label: 'Qty', rowspan: 2 },
    { label: 'Model', rowspan: 2 },
    { label: 'Sensor', rowspan: 2 },
    { label: 'Unit Cfg', rowspan: 2 },
    { label: 'Liner', rowspan: 2 },
    { label: 'Casing', rowspan: 2 },
    { label: 'Cold Inlet', rowspan: 2 },
    { label: 'Hot Inlet', rowspan: 2 },
    { label: 'Unit Size', rowspan: 2 },
    { label: 'Fan Box Inlet', rowspan: 2 },
    { label: '>Inlet Size', rowspan: 2 },
    { label: 'Duct Size', rowspan: 2 },
    { label: 'Motor', rowspan: 2 },
    { label: 'Ctrl Type', rowspan: 2 },
    { label: 'Cold Ctrl', rowspan: 2 },
    { label: 'Hot Ctrl', rowspan: 2 },
    { label: 'Act Type', rowspan: 2 },
    { label: 'Max CFM', rowspan: 2 },
    { label: 'Max CFM Cold', rowspan: 2 },
    { label: 'Min CFM', rowspan: 2 },
    { label: 'Fan CFM', rowspan: 2 },
    { label: 'MAX CFM Hot', rowspan: 2 },
    { label: 'Control Acc', colspan: 3 },
    { label: 'Unit Acc', colspan: 5 },
    { label: 'Water Coil', rowspan: 2 },
    { label: 'Elec Coil', rowspan: 2 },
    { label: 'KW', rowspan: 2 },
    { label: 'Coil Acc.', colspan: 4 },
    { label: 'Price Each', rowspan: 2 },
    { label: 'Total Price', rowspan: 2 },
  ],
  [
    { label: '1' },
    { label: '2' },
    { label: '3' },
    { label: '1' },
    { label: '2' },
    { label: '3' },
    { label: '4' },
    { label: '5' },
    { label: '1' },
    { label: '2' },
    { label: '3' },
    { label: '4' },
  ],
];

export const TITUSTERMINAL_CONFIG: OrderTypeConfig = {
  id: 'titusterminal',
  brand: 'TTS',
  label: 'Titus Terminal',
  groupSelector: 'TitusTerminal > Group',
  columns: TITUSTERMINAL_COLUMNS,
  headerRows: TITUSTERMINAL_HEADER,
};

// ── TitusRepairParts ──────────────────────────────────────────────────────────
// Source: TitusRepairPartsModelConfig template in TitusXslTemplate-NEW.xslt
const TITUSREPAIRPARTS_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 5 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 5 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 15 },
  {
    key: 'modelDesc',
    label: 'Model Description',
    xmlTags: ['ModelDesc'],
    align: 'left',
    widthPct: 46,
  },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 15,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 14 },
];

const TITUSREPAIRPARTS_HEADER: HeaderCell[][] = [
  [
    { label: 'Line' },
    { label: 'Qty' },
    { label: 'Model' },
    { label: 'Model Description' },
    { label: 'Price Each' },
    { label: 'Total Price' },
  ],
];

export const TITUSREPAIRPARTS_CONFIG: OrderTypeConfig = {
  id: 'titusrepairparts',
  brand: 'TTS',
  label: 'Titus Repair Parts',
  groupSelector: 'TitusRepairParts > Group',
  columns: TITUSREPAIRPARTS_COLUMNS,
  headerRows: TITUSREPAIRPARTS_HEADER,
};

// ── TituschilledCBSYN ─────────────────────────────────────────────────────────
// Source: TituschilledCBSYNModelConfig template in TitusXslTemplate-NEW.xslt
// 23 columns. 2-row header: 7 singles(r2) + Chill Beam Coil(c5) + Air Inlet(c3)
//   + Liner(r2) + Unit Casing(c5) + Price/Total(r2).
const TITUSCHILDEDCBSYN_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 3 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 3 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 5 },
  { key: 'cbWidth', label: 'Width (Beam)', xmlTags: ['CB_WIDTH'], align: 'center', widthPct: 4 },
  { key: 'cbLength', label: 'Length', xmlTags: ['CB_LENGTH'], align: 'center', widthPct: 4 },
  {
    key: 'cbNozzle',
    label: 'Height / Nozzle',
    xmlTags: ['CB_NOZZLE'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'cbThrow',
    label: 'Air Pattern',
    xmlTags: ['CB_THROW_PATTERN'],
    align: 'center',
    widthPct: 4,
  },
  // Chill Beam Coil (colspan=5)
  { key: 'cbCoilType', label: 'Type', xmlTags: ['CB_CTYPE'], align: 'center', widthPct: 4 },
  { key: 'cbCoilAcc1', label: 'Acc 1', xmlTags: ['CB_CoilAccy1'], align: 'center', widthPct: 3 },
  { key: 'cbCoilAcc2', label: 'Acc 2', xmlTags: ['CB_CoilAccy2'], align: 'center', widthPct: 3 },
  { key: 'cbConnLoc', label: 'Conn. Loc.', xmlTags: ['CB_WATER'], align: 'center', widthPct: 4 },
  {
    key: 'cbPipeConn',
    label: 'Pipe Conn.',
    xmlTags: ['CB_PCONNTYPE'],
    align: 'center',
    widthPct: 4,
  },
  // Air Inlet (colspan=3)
  {
    key: 'cbInletLoc',
    label: 'Location',
    xmlTags: ['CB_INLETCONFIG'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'cbInletDia', label: 'Diameter', xmlTags: ['UnitSize'], align: 'center', widthPct: 4 },
  {
    key: 'cbFacePattern',
    label: 'Face Pattern',
    xmlTags: ['CB_FACE'],
    align: 'center',
    widthPct: 5,
  },
  // Liner (r2 in header)
  { key: 'liner', label: 'Liner', xmlTags: ['LinerOption'], align: 'center', widthPct: 3 },
  // Unit Casing (colspan=5)
  {
    key: 'casingLoc',
    label: 'Location',
    xmlTags: ['CB_Casing_Option'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'casingLen',
    label: 'Length',
    xmlTags: ['CB_CasingExtension'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'casingHand',
    label: 'Hand',
    xmlTags: ['CB_CasingLocation'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'border', label: 'Border', xmlTags: ['FrameBorder'], align: 'center', widthPct: 3 },
  { key: 'finish', label: 'Finish', xmlTags: ['Finish'], align: 'center', widthPct: 3 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 6,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 7 },
];

const TITUSCHILDEDCBSYN_HEADER: HeaderCell[][] = [
  [
    { label: 'Line', rowspan: 2 },
    { label: 'Qty', rowspan: 2 },
    { label: 'Model', rowspan: 2 },
    { label: 'Width (Beam)', rowspan: 2 },
    { label: 'Length', rowspan: 2 },
    { label: 'Height / Nozzle', rowspan: 2 },
    { label: 'Air Pattern', rowspan: 2 },
    { label: 'Chill Beam Coil', colspan: 5 },
    { label: 'Air Inlet', colspan: 3 },
    { label: 'Liner', rowspan: 2 },
    { label: 'Unit Casing', colspan: 5 },
    { label: 'Price Each', rowspan: 2 },
    { label: 'Total Price', rowspan: 2 },
  ],
  [
    { label: 'Type' },
    { label: 'Acc 1' },
    { label: 'Acc 2' },
    { label: 'Conn. Loc.' },
    { label: 'Pipe Conn.' },
    { label: 'Location' },
    { label: 'Diameter' },
    { label: 'Face Pattern' },
    { label: 'Location' },
    { label: 'Length' },
    { label: 'Hand' },
    { label: 'Border' },
    { label: 'Finish' },
  ],
];

export const TITUSCHILDEDCBSYN_CONFIG: OrderTypeConfig = {
  id: 'tituschildedcbsyn',
  brand: 'TTS',
  label: 'Titus Chilled Beam (CBSYN)',
  groupSelector: 'TituschilledCBSYN > Group',
  columns: TITUSCHILDEDCBSYN_COLUMNS,
  headerRows: TITUSCHILDEDCBSYN_HEADER,
};

// ── TitusFFD ──────────────────────────────────────────────────────────────────
// Source: TitusFFDConfig template in TitusXslTemplate-NEW.xslt
// 20 columns. 2-row header: 11 singles(r2) + Accessories(c7) + Price/Total(r2).
const TITUSFFD_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 3 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 3 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 5 },
  { key: 'module', label: 'Module', xmlTags: ['ModuleSize'], align: 'center', widthPct: 5 },
  { key: 'inletSize', label: 'Inlet Size', xmlTags: ['InletSize'], align: 'center', widthPct: 5 },
  {
    key: 'lightOption',
    label: 'Light Options',
    xmlTags: ['LightOption'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'freeFaceArea',
    label: 'Free Face Area / Unit Const.',
    xmlTags: ['PlenumMaterial', 'Free_Face_Area'],
    align: 'center',
    widthPct: 7,
  },
  { key: 'finish', label: 'Finish', xmlTags: ['Finish'], align: 'center', widthPct: 5 },
  {
    key: 'damperVolt',
    label: 'Damper / Voltage',
    xmlTags: ['Damper', 'Voltage'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'controller', label: 'Controller', xmlTags: ['Controller'], align: 'center', widthPct: 5 },
  { key: 'filter', label: 'Filter', xmlTags: ['Filter'], align: 'center', widthPct: 4 },
  // Accessories (colspan=7)
  { key: 'accOne', label: 'Acc 1', xmlTags: ['AccOne'], align: 'center', widthPct: 4 },
  { key: 'accTwo', label: 'Acc 2', xmlTags: ['AccTwo'], align: 'center', widthPct: 4 },
  { key: 'accThree', label: 'Acc 3', xmlTags: ['AccThree'], align: 'center', widthPct: 4 },
  { key: 'accFour', label: 'Acc 4', xmlTags: ['AccFour'], align: 'center', widthPct: 4 },
  { key: 'accFive', label: 'Acc 5', xmlTags: ['AccFive'], align: 'center', widthPct: 4 },
  { key: 'accSix', label: 'Acc 6', xmlTags: ['AccSix'], align: 'center', widthPct: 4 },
  { key: 'accSeven', label: 'Acc 7', xmlTags: ['AccSeven'], align: 'center', widthPct: 4 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 6,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 7 },
];

const TITUSFFD_HEADER: HeaderCell[][] = [
  [
    { label: 'Line', rowspan: 2 },
    { label: 'Qty', rowspan: 2 },
    { label: 'Model', rowspan: 2 },
    { label: 'Module', rowspan: 2 },
    { label: 'Inlet Size', rowspan: 2 },
    { label: 'Light Options', rowspan: 2 },
    { label: 'Free Face Area / Unit Const.', rowspan: 2 },
    { label: 'Finish', rowspan: 2 },
    { label: 'Damper / Voltage', rowspan: 2 },
    { label: 'Controller', rowspan: 2 },
    { label: 'Filter', rowspan: 2 },
    { label: 'Accessories', colspan: 7 },
    { label: 'Price Each', rowspan: 2 },
    { label: 'Total Price', rowspan: 2 },
  ],
  [
    { label: 'Acc 1' },
    { label: 'Acc 2' },
    { label: 'Acc 3' },
    { label: 'Acc 4' },
    { label: 'Acc 5' },
    { label: 'Acc 6' },
    { label: 'Acc 7' },
  ],
];

export const TITUSFFD_CONFIG: OrderTypeConfig = {
  id: 'titusffd',
  brand: 'TTS',
  label: 'Titus FFD',
  groupSelector: 'TitusFFD > Group',
  columns: TITUSFFD_COLUMNS,
  headerRows: TITUSFFD_HEADER,
};

// ── TitusTEC ──────────────────────────────────────────────────────────────────
// Source: TitusTEC header in TitusXslTemplate-NEW.xslt (Lineatec / SteriTec families).
// 17 columns, single-row header.
// Note: XML tag names inferred from column labels; verify against live XML if needed.
const TITUSTEC_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 4 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 4 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 6 },
  { key: 'length', label: 'Length', xmlTags: ['Length'], align: 'center', widthPct: 5 },
  { key: 'width', label: 'Width', xmlTags: ['Width'], align: 'center', widthPct: 5 },
  {
    key: 'diffuserWidth',
    label: 'Diffuser Width',
    xmlTags: ['DiffuserWidth'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'inletHeight',
    label: 'Inlet Height',
    xmlTags: ['InletHeight'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'inletWidth',
    label: 'Inlet Width',
    xmlTags: ['InletWidth'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'numInlets',
    label: 'No. of Inlets',
    xmlTags: ['NoOfInlets', 'NumInlets'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'inletLocations',
    label: 'Inlet Locations',
    xmlTags: ['InletLocations'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'inletOrient',
    label: 'Inlet Orient.',
    xmlTags: ['InletOrientation'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'slotConfig',
    label: 'Slot Config',
    xmlTags: ['SlotConfig'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'finish', label: 'Finish', xmlTags: ['Finish'], align: 'center', widthPct: 5 },
  {
    key: 'damper',
    label: 'Damper Model',
    xmlTags: ['DamperModel', 'Damper'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'plenum', label: 'Plenum', xmlTags: ['Plenum'], align: 'center', widthPct: 5 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 7,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 8 },
];

const TITUSTEC_HEADER: HeaderCell[][] = [
  [
    { label: 'Line' },
    { label: 'Qty' },
    { label: 'Model' },
    { label: 'Length' },
    { label: 'Width' },
    { label: 'Diffuser Width' },
    { label: 'Inlet Height' },
    { label: 'Inlet Width' },
    { label: 'No. of Inlets' },
    { label: 'Inlet Locations' },
    { label: 'Inlet Orient.' },
    { label: 'Slot Config' },
    { label: 'Finish' },
    { label: 'Damper Model' },
    { label: 'Plenum' },
    { label: 'Price Each' },
    { label: 'Total Price' },
  ],
];

export const TITUSTEC_CONFIG: OrderTypeConfig = {
  id: 'titustec',
  brand: 'TTS',
  label: 'Titus TEC (Lineatec / SteriTec)',
  groupSelector: 'TitusTEC > Group',
  columns: TITUSTEC_COLUMNS,
  headerRows: TITUSTEC_HEADER,
};

// ── TitusVSRisers ─────────────────────────────────────────────────────────────
// Source: TitusVSRisers header in TitusXslTemplate-NEW.xslt
// 25 columns. 2-row header: 5 singles(r2) + Riser Assembly(c8) + Riser Ext Lengths(c5)
//   + Riser Ext Couplings(c5) + Price/Total(r2).
// Note: XML tag names inferred from XSLT column labels; verify against live XML if needed.
const TITUSVSRISERS_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 3 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 3 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 5 },
  { key: 'type', label: 'Type', xmlTags: ['Type'], align: 'center', widthPct: 4 },
  { key: 'unitSize', label: 'Unit Size', xmlTags: ['UnitSize'], align: 'center', widthPct: 4 },
  // Riser Assembly (colspan=8)
  { key: 'rMount', label: 'Mount', xmlTags: ['Mount', 'RiserMount'], align: 'center', widthPct: 4 },
  { key: 'rLength', label: 'Length', xmlTags: ['RiserLength'], align: 'center', widthPct: 4 },
  { key: 'rHWR', label: 'HWR', xmlTags: ['RiserHWR', 'HWR'], align: 'center', widthPct: 3 },
  { key: 'rHWS', label: 'HWS', xmlTags: ['RiserHWS', 'HWS'], align: 'center', widthPct: 3 },
  { key: 'rDrain', label: 'Drain', xmlTags: ['RiserDrain', 'Drain'], align: 'center', widthPct: 3 },
  { key: 'rCWS', label: 'CWS', xmlTags: ['RiserCWS', 'CWS'], align: 'center', widthPct: 3 },
  { key: 'rCWR', label: 'CWR', xmlTags: ['RiserCWR', 'CWR'], align: 'center', widthPct: 3 },
  { key: 'rConn', label: 'Conn', xmlTags: ['RiserConn', 'Conn'], align: 'center', widthPct: 3 },
  // Riser Ext Lengths (colspan=5)
  { key: 'elHWR', label: 'HWR', xmlTags: ['ExtLenHWR'], align: 'center', widthPct: 3 },
  { key: 'elHWS', label: 'HWS', xmlTags: ['ExtLenHWS'], align: 'center', widthPct: 3 },
  { key: 'elDrain', label: 'Drain', xmlTags: ['ExtLenDrain'], align: 'center', widthPct: 3 },
  { key: 'elCWS', label: 'CWS', xmlTags: ['ExtLenCWS'], align: 'center', widthPct: 3 },
  { key: 'elCWR', label: 'CWR', xmlTags: ['ExtLenCWR'], align: 'center', widthPct: 3 },
  // Riser Ext Couplings (colspan=5)
  { key: 'ecHWR', label: 'HWR', xmlTags: ['ExtCoupHWR'], align: 'center', widthPct: 3 },
  { key: 'ecHWS', label: 'HWS', xmlTags: ['ExtCoupHWS'], align: 'center', widthPct: 3 },
  { key: 'ecDrain', label: 'Drain', xmlTags: ['ExtCoupDrain'], align: 'center', widthPct: 3 },
  { key: 'ecCWS', label: 'CWS', xmlTags: ['ExtCoupCWS'], align: 'center', widthPct: 3 },
  { key: 'ecCWR', label: 'CWR', xmlTags: ['ExtCoupCWR'], align: 'center', widthPct: 3 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 6,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 8 },
];

const TITUSVSRISERS_HEADER: HeaderCell[][] = [
  [
    { label: 'Line', rowspan: 2 },
    { label: 'Qty', rowspan: 2 },
    { label: 'Model', rowspan: 2 },
    { label: 'Type', rowspan: 2 },
    { label: 'Unit Size', rowspan: 2 },
    { label: 'Riser Assembly', colspan: 8 },
    { label: 'Riser Ext. Lengths', colspan: 5 },
    { label: 'Riser Ext. Couplings', colspan: 5 },
    { label: 'Price Each', rowspan: 2 },
    { label: 'Total Price', rowspan: 2 },
  ],
  [
    { label: 'Mount' },
    { label: 'Length' },
    { label: 'HWR' },
    { label: 'HWS' },
    { label: 'Drain' },
    { label: 'CWS' },
    { label: 'CWR' },
    { label: 'Conn' },
    { label: 'HWR' },
    { label: 'HWS' },
    { label: 'Drain' },
    { label: 'CWS' },
    { label: 'CWR' },
    { label: 'HWR' },
    { label: 'HWS' },
    { label: 'Drain' },
    { label: 'CWS' },
    { label: 'CWR' },
  ],
];

export const TITUSVSRISERS_CONFIG: OrderTypeConfig = {
  id: 'titusvsrisers',
  brand: 'TTS',
  label: 'Titus VS Risers',
  groupSelector: 'TitusVSRisers > Group',
  columns: TITUSVSRISERS_COLUMNS,
  headerRows: TITUSVSRISERS_HEADER,
};

// ── TitusEXV ──────────────────────────────────────────────────────────────────
// Source: TitusEXVConfig template in TitusXslTemplate-TitusEXV.xslt
// 22 columns. 2-row header: 3 singles(r2) + Cabinet(c4) + Air Flow(c3) +
//   Attenuator(c2) + Controls(c3) + Accessories(c5) + Price/Total(r2).
const TITUSEXV_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 3 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 8 },
  // Cabinet
  { key: 'unitSize', label: 'Unit Size', xmlTags: ['UnitSize'], align: 'center', widthPct: 4 },
  {
    key: 'casingConfig',
    label: 'Unit Config',
    xmlTags: ['CasingConfig'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'unitMaterial',
    label: 'Material',
    xmlTags: ['UnitMaterial'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'liner', label: 'Liner', xmlTags: ['LinerOption'], align: 'center', widthPct: 4 },
  // Air Flow
  { key: 'maxCfm', label: 'PA Max CFM', xmlTags: ['MaxCfm'], align: 'center', widthPct: 5 },
  { key: 'minCfm', label: 'PA Min CFM', xmlTags: ['MinCfm'], align: 'center', widthPct: 5 },
  { key: 'sensor', label: 'Sensor', xmlTags: ['SensorCode'], align: 'center', widthPct: 4 },
  // Attenuator
  { key: 'attenuator', label: 'Material', xmlTags: ['Attenuator'], align: 'center', widthPct: 5 },
  { key: 'linerAtt', label: 'Liner', xmlTags: ['LinerAtt'], align: 'center', widthPct: 4 },
  // Controls
  { key: 'ctrlType', label: 'Type', xmlTags: ['ControllerType'], align: 'center', widthPct: 5 },
  { key: 'controller', label: 'Controller', xmlTags: ['Controller'], align: 'center', widthPct: 5 },
  { key: 'actType', label: 'Actuator', xmlTags: ['ActType'], align: 'center', widthPct: 4 },
  // Accessories
  { key: 'acc1', label: 'Unit Acc 1', xmlTags: ['UnitAccOne'], align: 'center', widthPct: 3 },
  { key: 'acc2', label: 'Unit Acc 2', xmlTags: ['UnitAccTwo'], align: 'center', widthPct: 3 },
  { key: 'acc3', label: 'Unit Acc 3', xmlTags: ['UnitAccThree'], align: 'center', widthPct: 3 },
  { key: 'acc4', label: 'Unit Acc 4', xmlTags: ['UnitAccFour'], align: 'center', widthPct: 3 },
  { key: 'acc5', label: 'Unit Acc 5', xmlTags: ['UnitAccFive'], align: 'center', widthPct: 3 },
  // Pricing
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 7,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 7 },
];

const TITUSEXV_HEADER: HeaderCell[][] = [
  [
    { label: 'Line', rowspan: 2 },
    { label: 'Qty', rowspan: 2 },
    { label: 'Model', rowspan: 2 },
    { label: 'Cabinet', colspan: 4 },
    { label: 'Air Flow', colspan: 3 },
    { label: 'Attenuator', colspan: 2 },
    { label: 'Controls', colspan: 3 },
    { label: 'Accessories', colspan: 5 },
    { label: 'Price Each', rowspan: 2 },
    { label: 'Total Price', rowspan: 2 },
  ],
  [
    { label: 'Unit Size' },
    { label: 'Unit Config' },
    { label: 'Material' },
    { label: 'Liner' },
    { label: 'PA Max CFM' },
    { label: 'PA Min CFM' },
    { label: 'Sensor' },
    { label: 'Material' },
    { label: 'Liner' },
    { label: 'Type' },
    { label: 'Controller' },
    { label: 'Actuator' },
    { label: 'Unit Acc 1' },
    { label: 'Unit Acc 2' },
    { label: 'Unit Acc 3' },
    { label: 'Unit Acc 4' },
    { label: 'Unit Acc 5' },
  ],
];

export const TITUSEXV_CONFIG: OrderTypeConfig = {
  id: 'titusexv',
  brand: 'TTS',
  label: 'Titus EXV',
  groupSelector: 'TitusEXV > Group',
  columns: TITUSEXV_COLUMNS,
  headerRows: TITUSEXV_HEADER,
};

// ── Generic (PEN) ─────────────────────────────────────────────────────────────
const GENERIC_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'LI', xmlTags: ['Line'], align: 'center', widthPct: 5 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 5 },
  { key: 'mktgPgm', label: 'Mktg Pgm', xmlTags: ['MP'], align: 'left', widthPct: 15 },
  { key: 'list', label: 'List', xmlTags: ['IndividualPrice'], align: 'right', widthPct: 15 },
  { key: 'mult1', label: 'Mult1', xmlTags: ['Multiplier'], align: 'center', widthPct: 20 },
  { key: 'net', label: 'Net', xmlTags: ['TotalCost'], align: 'right', widthPct: 15 },
  { key: 'freight', label: 'Freight', xmlTags: ['Freight'], align: 'right', widthPct: 12 },
  { key: 'totalSell', label: 'Total Sell', xmlTags: ['TotalSell'], align: 'right', widthPct: 13 },
];

export const GENERIC_CONFIG: OrderTypeConfig = {
  id: 'generic',
  brand: 'PEN',
  label: 'Generic',
  renderMode: 'block',
  groupSelector: 'Generic > Group',
  columns: GENERIC_COLUMNS,
  headerRows: [],
};

// ── KRU GRD ───────────────────────────────────────────────────────────────────
const KRUGRD_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 3 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 7 },
  {
    key: 'dim1',
    label: 'Dim 1 / Slot Length',
    xmlTags: ['dim1', 'slotlength', 'roundneck', 'width'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'dim2',
    label: 'Dim 2',
    xmlTags: ['dim2', 'numelem', 'height', 'squareneck', 'linwidth'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'dim3',
    label: 'Dim 3 / Slot Width',
    xmlTags: ['slotwidth', 'barspace', 'bladespace', 'dmgdiam', 'sleeve', 'slotconfig'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'inletSize',
    label: 'Inlet Size',
    xmlTags: ['inletsize', 'inlet_dv', 'diameter', 'material', 'sr'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'endBorder', label: 'End Border', xmlTags: ['endborder'], align: 'center', widthPct: 5 },
  { key: 'frame', label: 'Frame', xmlTags: ['frame', 'basket'], align: 'center', widthPct: 5 },
  { key: 'finish', label: 'Finish', xmlTags: ['finish'], align: 'center', widthPct: 4 },
  { key: 'panel', label: 'Panel', xmlTags: ['panel', 'curved', 'module'], align: 'center', widthPct: 4 },
  {
    key: 'numSlots',
    label: '# of Slots',
    xmlTags: ['numslots', 'frametype'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'actFast',
    label: 'Act / Fast. / Mount',
    xmlTags: ['fastening', 'mount', 'actuator', 'vpqdiftyp', 'ufd_len_alph', 'pattern'],
    align: 'center',
    widthPct: 7,
  },
  {
    key: 'pattern',
    label: 'Pattern / Deflect. / Insul.',
    xmlTags: ['pattern', 'deflection', 'defpattern', 'difinsul', 'vpqpower'],
    align: 'center',
    widthPct: 7,
  },
  {
    key: 'damper',
    label: 'Damper / Slot Loc',
    xmlTags: ['damper', 'Slot_Location_dv'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'accy1',
    label: 'Accy 1 / Miter Corner',
    xmlTags: ['accy1', 'miterangle', 'trans'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'accy2',
    label: 'Accy 2 / Miter Angle',
    xmlTags: ['accy2', 'mc1', 'operator', 'tstat_dif'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'accy3',
    label: 'Accy 3',
    xmlTags: ['accy3', 'mc2', 'fc_tstat_accy1'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 5,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 5 },
];

export const KRUGRD_CONFIG: OrderTypeConfig = {
  id: 'krugrd',
  brand: 'KRU',
  label: 'KRU GRD',
  groupSelector: 'KRUgrd > Group',
  columns: KRUGRD_COLUMNS,
  headerRows: [KRUGRD_COLUMNS.map((c) => ({ label: c.label }))],
};

// ── KRU Chilled Beams ─────────────────────────────────────────────────────────
const KRUCHILLEDBEAMS_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 3 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 6 },
  {
    key: 'airPat',
    label: 'Air Pattern / Nozzle',
    xmlTags: ['cb_apnt'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'ductConn', label: 'Duct Connection', xmlTags: ['cb_dc'], align: 'center', widthPct: 5 },
  { key: 'beamL', label: 'L', xmlTags: ['cb_l'], align: 'center', widthPct: 4 },
  { key: 'beamW', label: 'W', xmlTags: ['cb_w'], align: 'center', widthPct: 4 },
  { key: 'beamH', label: 'H', xmlTags: ['cb_h'], align: 'center', widthPct: 4 },
  { key: 'unitSize', label: 'Unit Size', xmlTags: ['unitsize_dv'], align: 'center', widthPct: 4 },
  { key: 'coilLen', label: 'Coil Length', xmlTags: ['cb_coil_l'], align: 'center', widthPct: 5 },
  { key: 'coilType', label: 'Coil Type', xmlTags: ['cb_ctype'], align: 'center', widthPct: 4 },
  { key: 'dampHAQ', label: 'HAQ', xmlTags: ['cb_haq'], align: 'center', widthPct: 4 },
  { key: 'dampInlet', label: 'Inlet', xmlTags: ['cb_id'], align: 'center', widthPct: 4 },
  { key: 'ctrlValve', label: 'Control Valve', xmlTags: ['cb_cv'], align: 'center', widthPct: 4 },
  { key: 'coilConnL', label: 'Coil Conn. Loc.', xmlTags: ['cb_ccl'], align: 'center', widthPct: 5 },
  {
    key: 'exhaust',
    label: 'Exhaust / Appearance',
    xmlTags: ['cb_ex', 'cb_boost', 'cb_app'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'accy1',
    label: 'Accy 1',
    xmlTags: ['cb_accy1', 'cb_skirt', 'cb_cl'],
    align: 'center',
    widthPct: 4,
  },
  {
    key: 'accy2',
    label: 'Accy 2',
    xmlTags: ['cb_accy2', 'cb_grille', 'cb_vvalve'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'controls', label: 'Controls', xmlTags: ['cb_ctl'], align: 'center', widthPct: 4 },
  { key: 'busConn', label: 'Bus Connection', xmlTags: ['cb_bus'], align: 'center', widthPct: 5 },
  { key: 'valveAct', label: 'Valve Act', xmlTags: ['cb_vlvact'], align: 'center', widthPct: 4 },
  { key: 'finish', label: 'Finish', xmlTags: ['cb_finish'], align: 'center', widthPct: 4 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 5,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 5 },
];

export const KRUCHILLEDBEAMS_CONFIG: OrderTypeConfig = {
  id: 'kruchilledbeams',
  brand: 'KRU',
  label: 'KRU Chilled Beams',
  groupSelector: 'KRUchilledbeams > Group',
  columns: KRUCHILLEDBEAMS_COLUMNS,
  headerRows: [
    [
      { label: 'Line', rowspan: 2 },
      { label: 'Qty', rowspan: 2 },
      { label: 'Model', rowspan: 2 },
      { label: 'Air Pattern / Nozzle Type', rowspan: 2 },
      { label: 'Duct Connection', rowspan: 2 },
      { label: 'Beam', colspan: 3 },
      { label: 'Unit Size', rowspan: 2 },
      { label: 'Coil Length', rowspan: 2 },
      { label: 'Coil Type', rowspan: 2 },
      { label: 'Damper', colspan: 2 },
      { label: 'Control Valve', rowspan: 2 },
      { label: 'Coil Conn. Loc.', rowspan: 2 },
      { label: 'Exhaust / Appearance', rowspan: 2 },
      { label: 'Accy 1', rowspan: 2 },
      { label: 'Accy 2', rowspan: 2 },
      { label: 'Controls', rowspan: 2 },
      { label: 'Bus Connection', rowspan: 2 },
      { label: 'Valve Act', rowspan: 2 },
      { label: 'Finish', rowspan: 2 },
      { label: 'Price Each', rowspan: 2 },
      { label: 'Total Price', rowspan: 2 },
    ],
    [{ label: 'L' }, { label: 'W' }, { label: 'H' }, { label: 'HAQ' }, { label: 'Inlet' }],
  ],
};

// ── KRU Single Duct ───────────────────────────────────────────────────────────
const KRUSINGLEDUCT_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 2 },
  { key: 'model', label: 'Model', xmlTags: ['CARModel', 'Model'], align: 'left', widthPct: 6 },
  { key: 'sensor', label: 'Sensor', xmlTags: ['sensor'], align: 'center', widthPct: 3 },
  { key: 'unitStyle', label: 'Unit Style', xmlTags: ['config'], align: 'center', widthPct: 3 },
  { key: 'liner', label: 'Liner', xmlTags: ['liner'], align: 'center', widthPct: 3 },
  { key: 'unitCfg', label: 'Unit Cfg', xmlTags: ['casing'], align: 'center', widthPct: 3 },
  {
    key: 'unitSize',
    label: 'Unit Size',
    xmlTags: ['unitsize', 'inlet'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'ductW', label: 'W', xmlTags: ['width'], align: 'center', widthPct: 2 },
  { key: 'ductH', label: 'H', xmlTags: ['height'], align: 'center', widthPct: 2 },
  { key: 'outlet', label: 'Outlet', xmlTags: ['outlet'], align: 'center', widthPct: 3 },
  { key: 'control', label: 'Control', xmlTags: ['control'], align: 'center', widthPct: 3 },
  { key: 'actuator', label: 'Actuator', xmlTags: ['actuator'], align: 'center', widthPct: 3 },
  { key: 'maxCfm', label: 'Max', xmlTags: ['maxcfm'], align: 'center', widthPct: 2 },
  { key: 'minCfm', label: 'Min', xmlTags: ['mincfm'], align: 'center', widthPct: 2 },
  { key: 'htgCfm', label: 'Htg', xmlTags: ['heatcfm'], align: 'center', widthPct: 2 },
  { key: 'ctlAc1', label: '1', xmlTags: ['ctlac1'], align: 'center', widthPct: 2 },
  { key: 'ctlAc2', label: '2', xmlTags: ['ctlac2'], align: 'center', widthPct: 2 },
  { key: 'ctlAc3', label: '3', xmlTags: ['ctlac3'], align: 'center', widthPct: 2 },
  { key: 'trans', label: 'TXFR', xmlTags: ['trans'], align: 'center', widthPct: 2 },
  { key: 'unitAc1', label: '1', xmlTags: ['unitac1'], align: 'center', widthPct: 2 },
  { key: 'unitAc2', label: '2', xmlTags: ['unitac2'], align: 'center', widthPct: 2 },
  { key: 'unitAc3', label: '3', xmlTags: ['unitac3'], align: 'center', widthPct: 2 },
  { key: 'unitAc4', label: '4', xmlTags: ['unitac4'], align: 'center', widthPct: 2 },
  { key: 'unitAc5', label: '5', xmlTags: ['unitac5'], align: 'center', widthPct: 2 },
  { key: 'hwCoil', label: 'Water Coil', xmlTags: ['hwcoil'], align: 'center', widthPct: 4 },
  { key: 'eCoil', label: 'Type', xmlTags: ['ecoil'], align: 'center', widthPct: 3 },
  { key: 'kw', label: 'KW', xmlTags: ['kw'], align: 'center', widthPct: 2 },
  { key: 'coilAc1', label: '1', xmlTags: ['coilac1'], align: 'center', widthPct: 2 },
  { key: 'coilAc2', label: '2', xmlTags: ['coilac2'], align: 'center', widthPct: 2 },
  { key: 'coilAc3', label: '3', xmlTags: ['coilac3'], align: 'center', widthPct: 2 },
  { key: 'coilAc4', label: '4', xmlTags: ['coilac4'], align: 'center', widthPct: 2 },
  { key: 'coilAc5', label: '5', xmlTags: ['coilac5'], align: 'center', widthPct: 2 },
  { key: 'metric', label: 'Metric', xmlTags: ['metric'], align: 'center', widthPct: 3 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 4,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 4 },
];

export const KRUSINGLEDUCT_CONFIG: OrderTypeConfig = {
  id: 'krusingleduct',
  brand: 'KRU',
  label: 'KRU Single Duct',
  groupSelector: 'KRUsingleduct > Group',
  columns: KRUSINGLEDUCT_COLUMNS,
  headerRows: [
    [
      { label: 'Line', rowspan: 2 },
      { label: 'Qty', rowspan: 2 },
      { label: 'Model', rowspan: 2 },
      { label: 'Sensor', rowspan: 2 },
      { label: 'Unit Style', rowspan: 2 },
      { label: 'Liner', rowspan: 2 },
      { label: 'Unit Cfg', rowspan: 2 },
      { label: 'Unit Size', rowspan: 2 },
      { label: 'Duct Size', colspan: 2 },
      { label: 'Outlet', rowspan: 2 },
      { label: 'Control', rowspan: 2 },
      { label: 'Actuator', rowspan: 2 },
      { label: 'CFM', colspan: 3 },
      { label: 'Control Accy', colspan: 3 },
      { label: 'Unit Accy', colspan: 6 },
      { label: 'Water Coil', rowspan: 2 },
      { label: 'Electric Coil', colspan: 2 },
      { label: 'Coil Accy', colspan: 5 },
      { label: 'Metric', rowspan: 2 },
      { label: 'Price Each', rowspan: 2 },
      { label: 'Total Price', rowspan: 2 },
    ],
    [
      { label: 'W' },
      { label: 'H' },
      { label: 'Max' },
      { label: 'Min' },
      { label: 'Htg' },
      { label: '1' },
      { label: '2' },
      { label: '3' },
      { label: 'TXFR' },
      { label: '1' },
      { label: '2' },
      { label: '3' },
      { label: '4' },
      { label: '5' },
      { label: 'Type' },
      { label: 'KW' },
      { label: '1' },
      { label: '2' },
      { label: '3' },
      { label: '4' },
      { label: '5' },
    ],
  ],
};

// ── KRU Dual Duct ─────────────────────────────────────────────────────────────
const KRUDUALDUCT_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 3 },
  { key: 'model', label: 'Model', xmlTags: ['CARModel', 'Model'], align: 'left', widthPct: 7 },
  { key: 'sensor', label: 'Sensor', xmlTags: ['sensor'], align: 'center', widthPct: 4 },
  { key: 'unitStyle', label: 'Unit Style', xmlTags: ['config'], align: 'center', widthPct: 4 },
  { key: 'liner', label: 'Liner', xmlTags: ['liner'], align: 'center', widthPct: 4 },
  { key: 'unitCfg', label: 'Unit Cfg', xmlTags: ['casing'], align: 'center', widthPct: 4 },
  { key: 'coldInlet', label: 'Cold Inlet', xmlTags: ['coldinlet'], align: 'center', widthPct: 4 },
  { key: 'hotInlet', label: 'Hot Inlet', xmlTags: ['hotinlet'], align: 'center', widthPct: 4 },
  { key: 'control', label: 'Control', xmlTags: ['control'], align: 'center', widthPct: 4 },
  { key: 'actuator', label: 'Actuator', xmlTags: ['actuator'], align: 'center', widthPct: 4 },
  { key: 'coldMax', label: 'Max', xmlTags: ['coldcfmmax'], align: 'center', widthPct: 3 },
  { key: 'coldMin', label: 'Min', xmlTags: ['coldcfmmin'], align: 'center', widthPct: 3 },
  { key: 'hotMax', label: 'Max', xmlTags: ['hotcfmmax'], align: 'center', widthPct: 3 },
  { key: 'hotMin', label: 'Min', xmlTags: ['hotcfmmin'], align: 'center', widthPct: 3 },
  { key: 'ctlAc1', label: '1', xmlTags: ['ctlac1'], align: 'center', widthPct: 2 },
  { key: 'ctlAc2', label: '2', xmlTags: ['ctlac2'], align: 'center', widthPct: 2 },
  { key: 'ctlAc3', label: '3', xmlTags: ['ctlac3'], align: 'center', widthPct: 2 },
  { key: 'trans', label: 'TXFR', xmlTags: ['trans'], align: 'center', widthPct: 3 },
  { key: 'unitAc1', label: '1', xmlTags: ['unitac1'], align: 'center', widthPct: 2 },
  { key: 'unitAc2', label: '2', xmlTags: ['unitac2'], align: 'center', widthPct: 2 },
  { key: 'unitAc3', label: '3', xmlTags: ['unitac3'], align: 'center', widthPct: 2 },
  { key: 'metric', label: 'Metric', xmlTags: ['metric'], align: 'center', widthPct: 3 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 5,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 5 },
];

export const KRUDUALDUCT_CONFIG: OrderTypeConfig = {
  id: 'krudualduct',
  brand: 'KRU',
  label: 'KRU Dual Duct',
  groupSelector: 'KRUdualduct > Group',
  columns: KRUDUALDUCT_COLUMNS,
  headerRows: [
    [
      { label: 'Line', rowspan: 2 },
      { label: 'Qty', rowspan: 2 },
      { label: 'Model', rowspan: 2 },
      { label: 'Sensor', rowspan: 2 },
      { label: 'Unit Style', rowspan: 2 },
      { label: 'Liner', rowspan: 2 },
      { label: 'Unit Cfg', rowspan: 2 },
      { label: 'Cold Inlet', rowspan: 2 },
      { label: 'Hot Inlet', rowspan: 2 },
      { label: 'Control', rowspan: 2 },
      { label: 'Actuator', rowspan: 2 },
      { label: 'Cold CFM', colspan: 2 },
      { label: 'Hot CFM', colspan: 2 },
      { label: 'Control Accy', colspan: 3 },
      { label: 'Unit Accy', colspan: 4 },
      { label: 'Metric', rowspan: 2 },
      { label: 'Price Each', rowspan: 2 },
      { label: 'Total Price', rowspan: 2 },
    ],
    [
      { label: 'Max' },
      { label: 'Min' },
      { label: 'Max' },
      { label: 'Min' },
      { label: '1' },
      { label: '2' },
      { label: '3' },
      { label: 'TXFR' },
      { label: '1' },
      { label: '2' },
      { label: '3' },
    ],
  ],
};

// ── KRU Fan Powered ───────────────────────────────────────────────────────────
const KRUFANPOWERED_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 2 },
  { key: 'model', label: 'Model', xmlTags: ['CARModel', 'Model'], align: 'left', widthPct: 6 },
  {
    key: 'sensor',
    label: 'Sensor',
    xmlTags: ['sensor', 'induct_pan'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'liner', label: 'Liner', xmlTags: ['liner'], align: 'center', widthPct: 3 },
  { key: 'casing', label: 'Unit Casing', xmlTags: ['casing'], align: 'center', widthPct: 4 },
  { key: 'unitSize', label: 'Unit Size', xmlTags: ['unitsize'], align: 'center', widthPct: 3 },
  { key: 'inlet', label: 'Inlet Size', xmlTags: ['inlet'], align: 'center', widthPct: 3 },
  { key: 'motor', label: 'Motor', xmlTags: ['motor'], align: 'center', widthPct: 3 },
  { key: 'control', label: 'Control', xmlTags: ['control'], align: 'center', widthPct: 3 },
  { key: 'actuator', label: 'Actuator', xmlTags: ['actuator'], align: 'center', widthPct: 3 },
  { key: 'maxCfm', label: 'Max', xmlTags: ['maxcfm'], align: 'center', widthPct: 2 },
  { key: 'minCfm', label: 'Min', xmlTags: ['mincfm'], align: 'center', widthPct: 2 },
  { key: 'fanPs', label: 'PS', xmlTags: ['static'], align: 'center', widthPct: 2 },
  { key: 'fanCfm', label: 'CFM', xmlTags: ['fancfm'], align: 'center', widthPct: 2 },
  { key: 'ctlAc1', label: '1', xmlTags: ['ctlac1'], align: 'center', widthPct: 2 },
  { key: 'ctlAc2', label: '2', xmlTags: ['ctlac2'], align: 'center', widthPct: 2 },
  { key: 'ctlAc3', label: '3', xmlTags: ['ctlac3'], align: 'center', widthPct: 2 },
  { key: 'unitAc1', label: '1', xmlTags: ['unitac1'], align: 'center', widthPct: 2 },
  { key: 'unitAc2', label: '2', xmlTags: ['unitac2'], align: 'center', widthPct: 2 },
  { key: 'unitAc3', label: '3', xmlTags: ['unitac3'], align: 'center', widthPct: 2 },
  { key: 'unitAc4', label: '4', xmlTags: ['unitac4'], align: 'center', widthPct: 2 },
  { key: 'unitAc5', label: '5', xmlTags: ['unitac5'], align: 'center', widthPct: 2 },
  { key: 'unitAc6', label: '6', xmlTags: ['unitac6'], align: 'center', widthPct: 2 },
  { key: 'hwCoil', label: 'Water Coil', xmlTags: ['hwcoil'], align: 'center', widthPct: 4 },
  { key: 'eCoil', label: 'Type', xmlTags: ['ecoil'], align: 'center', widthPct: 3 },
  { key: 'kw', label: 'KW', xmlTags: ['kw'], align: 'center', widthPct: 2 },
  { key: 'coilAc1', label: '1', xmlTags: ['coilac1'], align: 'center', widthPct: 2 },
  { key: 'coilAc2', label: '2', xmlTags: ['coilac2'], align: 'center', widthPct: 2 },
  { key: 'coilAc3', label: '3', xmlTags: ['coilac3'], align: 'center', widthPct: 2 },
  { key: 'coilAc4', label: '4', xmlTags: ['coilac4'], align: 'center', widthPct: 2 },
  { key: 'coilAc5', label: '5', xmlTags: ['coilac5'], align: 'center', widthPct: 2 },
  { key: 'metric', label: 'Metric', xmlTags: ['metric'], align: 'center', widthPct: 3 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 4,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 4 },
];

export const KRUFANPOWERED_CONFIG: OrderTypeConfig = {
  id: 'krufanpowered',
  brand: 'KRU',
  label: 'KRU Fan Powered',
  groupSelector: 'KRUfanpowered > Group',
  columns: KRUFANPOWERED_COLUMNS,
  headerRows: [
    [
      { label: 'Line', rowspan: 2 },
      { label: 'Qty', rowspan: 2 },
      { label: 'Model', rowspan: 2 },
      { label: 'Sensor', rowspan: 2 },
      { label: 'Liner', rowspan: 2 },
      { label: 'Unit Casing', rowspan: 2 },
      { label: 'Unit Size', rowspan: 2 },
      { label: 'Inlet Size', rowspan: 2 },
      { label: 'Motor', rowspan: 2 },
      { label: 'Control', rowspan: 2 },
      { label: 'Actuator', rowspan: 2 },
      { label: 'Inlet CFM', colspan: 2 },
      { label: 'Fan', colspan: 2 },
      { label: 'Control Accy', colspan: 3 },
      { label: 'Unit Accy', colspan: 6 },
      { label: 'Water Coil', rowspan: 2 },
      { label: 'Electric Coil', colspan: 2 },
      { label: 'Coil Accy', colspan: 5 },
      { label: 'Metric', rowspan: 2 },
      { label: 'Price Each', rowspan: 2 },
      { label: 'Total Price', rowspan: 2 },
    ],
    [
      { label: 'Max' },
      { label: 'Min' },
      { label: 'PS' },
      { label: 'CFM' },
      { label: '1' },
      { label: '2' },
      { label: '3' },
      { label: '1' },
      { label: '2' },
      { label: '3' },
      { label: '4' },
      { label: '5' },
      { label: '6' },
      { label: 'Type' },
      { label: 'KW' },
      { label: '1' },
      { label: '2' },
      { label: '3' },
      { label: '4' },
      { label: '5' },
    ],
  ],
};

// ── KRU Heater Rack ───────────────────────────────────────────────────────────
const KRUHEATERRACK_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 5 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 8 },
  { key: 'ofoNum', label: 'FO #', xmlTags: ['ofonum'], align: 'center', widthPct: 8 },
  { key: 'ofoLinNum', label: 'Line #', xmlTags: ['ofolinnum'], align: 'center', widthPct: 8 },
  { key: 'ofoTag', label: 'Line Tag', xmlTags: ['ofoltag'], align: 'center', widthPct: 10 },
  { key: 'inlet', label: 'Inlet Size', xmlTags: ['inlet'], align: 'center', widthPct: 8 },
  { key: 'unitSize', label: 'Unit Size', xmlTags: ['unitsize'], align: 'center', widthPct: 8 },
  { key: 'eCoil', label: 'Type', xmlTags: ['ecoil'], align: 'center', widthPct: 6 },
  { key: 'kw', label: 'KW', xmlTags: ['kw'], align: 'center', widthPct: 6 },
  { key: 'coilAc1', label: '1', xmlTags: ['coilac1'], align: 'center', widthPct: 5 },
  { key: 'coilAc2', label: '2', xmlTags: ['coilac2'], align: 'center', widthPct: 5 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 9,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 9 },
];

export const KRUHEATERRACK_CONFIG: OrderTypeConfig = {
  id: 'kruheaterrack',
  brand: 'KRU',
  label: 'KRU Heater Rack',
  groupSelector: 'KRUheaterrack > Group',
  columns: KRUHEATERRACK_COLUMNS,
  headerRows: [
    [
      { label: '' },
      { label: '' },
      { label: '' },
      { label: 'Original', rowspan: 2 },
      { label: 'Original', rowspan: 2 },
      { label: 'Original', rowspan: 2 },
      { label: '' },
      { label: '' },
      { label: 'Electric Coil', colspan: 2 },
      { label: 'Coil Accy', colspan: 2 },
      { label: '' },
      { label: '' },
    ],
    [
      { label: 'Line' },
      { label: 'Qty' },
      { label: 'Model' },
      { label: 'Inlet Size' },
      { label: 'Unit Size' },
      { label: 'Type' },
      { label: 'KW' },
      { label: '1' },
      { label: '2' },
      { label: 'Price Each' },
      { label: 'Total Price' },
    ],
  ],
};

// ── KRU Standard Fan Coil ─────────────────────────────────────────────────────
const KRUSTANDARDFANCOIL_COLUMNS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 2 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 2 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 4 },
  { key: 'unitSize', label: 'Size', xmlTags: ['fc_unit_size'], align: 'center', widthPct: 3 },
  { key: 'pipe2', label: '2 Pipe', xmlTags: ['fc_2_pipe'], align: 'center', widthPct: 3 },
  { key: 'pipe4', label: '4 Pipe', xmlTags: ['fc_4_pipe'], align: 'center', widthPct: 3 },
  {
    key: 'pipeEntry',
    label: 'Pipe Entry',
    xmlTags: ['fc_pipe_entry'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'coil', label: 'Coil', xmlTags: ['fc_coil_type'], align: 'center', widthPct: 3 },
  { key: 'ehVolt', label: 'EH Volt', xmlTags: ['fc_eh_voltage'], align: 'center', widthPct: 3 },
  { key: 'ehKw', label: 'EH KW', xmlTags: ['fc_eh_kw'], align: 'center', widthPct: 3 },
  { key: 'motor', label: 'Motor', xmlTags: ['fc_motor'], align: 'center', widthPct: 3 },
  {
    key: 'motorDisc',
    label: 'Motor Disc.',
    xmlTags: ['fc_motor_disc'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'tstat', label: 'Thermostat', xmlTags: ['fc_tstat'], align: 'center', widthPct: 3 },
  {
    key: 'transRelay',
    label: 'Trans / Relay',
    xmlTags: ['fc_trans_relay'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'aquastat', label: 'AquaStat', xmlTags: ['fc_aquastat'], align: 'center', widthPct: 3 },
  { key: 'pan', label: 'PAN', xmlTags: ['fc_pan'], align: 'center', widthPct: 3 },
  { key: 'panSos', label: 'PAN SOS', xmlTags: ['fc_pansos'], align: 'center', widthPct: 3 },
  { key: 'valvePkg', label: 'Valve Pkg', xmlTags: ['fc_valve_pack'], align: 'center', widthPct: 3 },
  { key: 'strainer', label: 'Strainer', xmlTags: ['fc_strainer'], align: 'center', widthPct: 3 },
  { key: 'flowCtl', label: 'Flow Ctrl', xmlTags: ['fc_flow_ctl'], align: 'center', widthPct: 3 },
  { key: 'union', label: 'Union', xmlTags: ['fc_union_fit'], align: 'center', widthPct: 3 },
  {
    key: 'petesPlug',
    label: 'Petes Plug',
    xmlTags: ['fc_petes_plug'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'airVent', label: 'Air Vent', xmlTags: ['fc_air_vent'], align: 'center', widthPct: 3 },
  {
    key: 'disconnect',
    label: 'Disconnect',
    xmlTags: ['fc_disconnect'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'filter', label: 'Filter', xmlTags: ['fc_filter'], align: 'center', widthPct: 3 },
  {
    key: 'returnDamp',
    label: 'Return/Damper',
    xmlTags: ['fc_return', 'fc_damper'],
    align: 'center',
    widthPct: 3,
  },
  {
    key: 'filterPos',
    label: 'Filter Pos/Panel',
    xmlTags: ['fc_filter_position', 'fc_wall_panel'],
    align: 'center',
    widthPct: 3,
  },
  { key: 'grille', label: 'Grille', xmlTags: ['fc_grille'], align: 'center', widthPct: 2 },
  { key: 'color', label: 'Color', xmlTags: ['fc_color'], align: 'center', widthPct: 2 },
  { key: 'levelLegs', label: 'Leveling Legs', xmlTags: ['fc_legs'], align: 'center', widthPct: 3 },
  { key: 'locks', label: 'Locks', xmlTags: ['fc_lock_tps'], align: 'center', widthPct: 2 },
  { key: 'hdPanel', label: 'HD Panel', xmlTags: ['fc_front_panel'], align: 'center', widthPct: 2 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 4,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 4 },
];

export const KRUSTANDARDFANCOIL_CONFIG: OrderTypeConfig = {
  id: 'krustandardfancoil',
  brand: 'KRU',
  label: 'KRU Standard Fan Coil',
  groupSelector: 'KRUStandardFancoil > Group',
  columns: KRUSTANDARDFANCOIL_COLUMNS,
  headerRows: [KRUSTANDARDFANCOIL_COLUMNS.map((c) => ({ label: c.label }))],
};

// ── KRU CRFF ──────────────────────────────────────────────────────────────────
const KRUCRFF_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 5 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 10 },
  { key: 'motor', label: 'Motor', xmlTags: ['motor'], align: 'center', widthPct: 7 },
  { key: 'control', label: 'Control', xmlTags: ['control'], align: 'center', widthPct: 7 },
  { key: 'frame', label: 'Frame', xmlTags: ['frame'], align: 'center', widthPct: 6 },
  { key: 'panel', label: 'Panel', xmlTags: ['panel'], align: 'center', widthPct: 6 },
  { key: 'filter', label: 'Filter', xmlTags: ['fc_filter'], align: 'center', widthPct: 6 },
  { key: 'accy1', label: 'Accy 1', xmlTags: ['accy1'], align: 'center', widthPct: 6 },
  { key: 'accy2', label: 'Accy 2', xmlTags: ['accy2'], align: 'center', widthPct: 6 },
  { key: 'accy3', label: 'Accy 3', xmlTags: ['accy3'], align: 'center', widthPct: 6 },
  { key: 'accy4', label: 'Accy 4', xmlTags: ['accy4'], align: 'center', widthPct: 6 },
  { key: 'accy5', label: 'Accy 5', xmlTags: ['accy5'], align: 'center', widthPct: 6 },
  { key: 'finish', label: 'Finish', xmlTags: ['finish'], align: 'center', widthPct: 7 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 8,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 9 },
];

export const KRUCRFF_CONFIG: OrderTypeConfig = {
  id: 'krucrff',
  brand: 'KRU',
  label: 'KRU CRFF',
  groupSelector: 'KRUcrff > Group',
  columns: KRUCRFF_COLUMNS,
  headerRows: [KRUCRFF_COLUMNS.map((c) => ({ label: c.label }))],
};

// ── KRU Displace ──────────────────────────────────────────────────────────────
const KRUDISPLACE_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 4,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 4 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 8 },
  {
    key: 'unitSize',
    label: 'Unit Size / Width',
    xmlTags: ['unitsize_dv'],
    align: 'center',
    widthPct: 7,
  },
  { key: 'width', label: 'Width', xmlTags: ['width'], align: 'center', widthPct: 5 },
  {
    key: 'pattern',
    label: 'Pattern/Height/Face',
    xmlTags: ['pattern_dv', 'height_dv', 'face_dv'],
    align: 'center',
    widthPct: 8,
  },
  { key: 'height', label: 'Height', xmlTags: ['height'], align: 'center', widthPct: 5 },
  { key: 'inlet', label: 'Inlet', xmlTags: ['inlet_dv'], align: 'center', widthPct: 5 },
  {
    key: 'inletLoc',
    label: 'Inlet Loc / Plenum',
    xmlTags: ['inlet_location_dv', 'plenum_dv'],
    align: 'center',
    widthPct: 7,
  },
  { key: 'material', label: 'Material', xmlTags: ['material_dv'], align: 'center', widthPct: 5 },
  {
    key: 'frontPanel',
    label: 'Front Panel',
    xmlTags: ['front_panel_thickness_dv'],
    align: 'center',
    widthPct: 5,
  },
  {
    key: 'trim',
    label: 'Trim / Mounting',
    xmlTags: ['trim_dv', 'mount'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'ductCover',
    label: 'Frame / Duct Cover',
    xmlTags: ['duct_cover_dv', 'frame'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'ductCoverL',
    label: 'Duct Cover Length',
    xmlTags: ['length_duct_cover_dv'],
    align: 'center',
    widthPct: 6,
  },
  {
    key: 'insul',
    label: 'Insul. / Install Base',
    xmlTags: ['difinsul', 'installation_base_dv'],
    align: 'center',
    widthPct: 6,
  },
  { key: 'finish', label: 'Finish', xmlTags: ['finish_dv'], align: 'center', widthPct: 5 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 6,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 6 },
];

export const KRUDISPLACE_CONFIG: OrderTypeConfig = {
  id: 'krudisplace',
  brand: 'KRU',
  label: 'KRU Displace',
  groupSelector: 'KRUdisplace > Group',
  columns: KRUDISPLACE_COLUMNS,
  headerRows: [KRUDISPLACE_COLUMNS.map((c) => ({ label: c.label }))],
};

// ── KRU Repair Parts ──────────────────────────────────────────────────────────
const KRUREPAIRPARTS_COLUMNS: TableColumn[] = [
  {
    key: 'line',
    label: 'Line',
    xmlTags: ['Line', 'EngineeringLineItem'],
    align: 'center',
    widthPct: 5,
  },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 5 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 15 },
  {
    key: 'modelDesc',
    label: 'Model Description',
    xmlTags: ['ModelDesc'],
    align: 'left',
    widthPct: 46,
  },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 15,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 14 },
];

export const KRUREPAIRPARTS_CONFIG: OrderTypeConfig = {
  id: 'krurepairparts',
  brand: 'KRU',
  label: 'KRU Repair Parts',
  groupSelector: 'KRURepairParts > Group',
  columns: KRUREPAIRPARTS_COLUMNS,
  headerRows: [KRUREPAIRPARTS_COLUMNS.map((c) => ({ label: c.label }))],
};

// ── KRU Blower Coil (kru-block) ───────────────────────────────────────────────
const KRUBLOWERCOIL_BLOCK_FIELDS: { label: string; xmlTag: string }[] = [
  { label: 'CFM', xmlTag: 'bc_cfm' },
  { label: 'Arrangement', xmlTag: 'bc_arangement' },
  { label: 'Inlet', xmlTag: 'bc_inlet' },
  { label: 'Mix Box Damp Loc', xmlTag: 'bc_mbdl' },
  { label: 'Outlet', xmlTag: 'bc_outlet' },
  { label: 'Size', xmlTag: 'bc_size' },
  { label: 'Motor', xmlTag: 'bc_motor' },
  { label: 'Motor Hand', xmlTag: 'bc_mhand' },
  { label: 'Conduit', xmlTag: 'bc_conduit' },
  { label: 'Disconnect Switch', xmlTag: 'bc_discon_switch' },
  { label: 'Fan Control Pkg', xmlTag: 'bc_fcp' },
  { label: 'Auto Switch', xmlTag: 'bc_hoas' },
  { label: 'Spare Belts', xmlTag: 'bc_sbelt' },
  { label: 'Door Disconnect', xmlTag: 'bc_door_discon' },
  { label: 'Main Fusing', xmlTag: 'bc_main_fusing' },
  { label: 'Drain Pan', xmlTag: 'bc_drain_pan' },
  { label: 'Drain Location', xmlTag: 'bc_drain_loc' },
  { label: 'Filter', xmlTag: 'bc_filter' },
  { label: 'Filter Rack', xmlTag: 'bc_filter_rack' },
  { label: 'Spare Filter', xmlTag: 'bc_sfilter' },
  { label: 'Base Rails', xmlTag: 'bc_base_rails' },
  { label: 'Foil Options', xmlTag: 'bc_foil' },
  { label: 'Access Door', xmlTag: 'bc_access_door' },
  { label: 'Hinged Door', xmlTag: 'bc_hinged_door' },
  { label: 'Vibration', xmlTag: 'bc_vibration' },
  { label: 'Float', xmlTag: 'bc_condensate_fs' },
  { label: 'Coil 1', xmlTag: 'bc_coil1' },
  { label: 'Coil 1 FPI', xmlTag: 'bc_coil1fpi' },
  { label: 'Coil 1 Hand', xmlTag: 'bc_coil1hand' },
  { label: 'Coil 1 Auto Air Vent', xmlTag: 'bc_coil1aav' },
  { label: 'Coil 1 Casing', xmlTag: 'bc_coil1casing' },
  { label: 'Coil 1 Tube Wall', xmlTag: 'bc_coil1twt' },
  { label: 'Coil 1 Refrigerant', xmlTag: 'bc_coil1refrig' },
  { label: 'Coil 1 Distributor', xmlTag: 'bc_coil1dist' },
  { label: 'Coil 2', xmlTag: 'bc_coil2' },
  { label: 'Coil 2 FPI', xmlTag: 'bc_coil2fpi' },
  { label: 'Coil 2 Auto Air Vent', xmlTag: 'bc_coil2aav' },
  { label: 'Coil 2 Casing', xmlTag: 'bc_coil2casing' },
  { label: 'Coil 2 Tube Wall', xmlTag: 'bc_coil2twt' },
  { label: 'Coil 2 Refrigerant', xmlTag: 'bc_coil2refrig' },
  { label: 'Coil 2 Distributor', xmlTag: 'bc_coil2dist' },
  { label: 'Coil 3', xmlTag: 'bc_coil3' },
  { label: 'Coil 3 FPI', xmlTag: 'bc_coil3fpi' },
  { label: 'Coil 3 Tube Wall', xmlTag: 'bc_coil3twt' },
  { label: 'Coil 3 Hand', xmlTag: 'bc_coil3_hand' },
  { label: 'EH Casing', xmlTag: 'bc_ehcasing' },
  { label: 'EH Voltage', xmlTag: 'bc_ehvolt' },
  { label: 'KW', xmlTag: 'bc_KW' },
  { label: 'EH Hand', xmlTag: 'bc_ehhand' },
  { label: 'Mag Contact', xmlTag: 'bc_magnet_cont' },
  { label: 'Fusing per Step', xmlTag: 'bc_fps' },
  { label: 'Special 1', xmlTag: 'sp1' },
  { label: 'Special 2', xmlTag: 'sp2' },
  { label: 'Special 3', xmlTag: 'sp3' },
  { label: 'Special 4', xmlTag: 'sp4' },
  { label: 'Special 5', xmlTag: 'sp5' },
  { label: 'Special 6', xmlTag: 'sp6' },
];

export const KRUBLOWERCOIL_CONFIG: OrderTypeConfig = {
  id: 'krublowercoil',
  brand: 'KRU',
  label: 'KRU Blower Coil',
  renderMode: 'kru-block',
  groupSelector: 'KRUBlowerCoil > Group',
  blockFields: KRUBLOWERCOIL_BLOCK_FIELDS,
  columns: [
    { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 15 },
    { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 15 },
    { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 30 },
    {
      key: 'priceEach',
      label: 'Price Each',
      xmlTags: ['IndividualPrice'],
      align: 'right',
      widthPct: 20,
    },
    {
      key: 'totalPrice',
      label: 'Total Price',
      xmlTags: ['TotalCost'],
      align: 'right',
      widthPct: 20,
    },
  ],
  headerRows: [],
};

// ── KRU Fan Coil NFC Horz HC (kru-block) ─────────────────────────────────────
const KRUFANCOIL_SHARED_NFC_FIELDS: { label: string; xmlTag: string }[] = [
  { label: 'CFM', xmlTag: 'nfc_cfm' },
  { label: 'Size', xmlTag: 'nfc_size' },
  { label: 'Motor', xmlTag: 'nfc_motor' },
  { label: 'Motor Control', xmlTag: 'nfc_motor_ctl' },
  { label: 'Unit Capacity', xmlTag: 'nfc_uc' },
  { label: 'Coil 1', xmlTag: 'nfc_coil1' },
  { label: 'Coil 1 Diameter', xmlTag: 'nfc_coil1_dia' },
  { label: 'Coil 1 Tube Wall', xmlTag: 'nfc_coil1_twt' },
  { label: 'Coil 1 Air Vent', xmlTag: 'nfc_coil1_av' },
  { label: 'Coil 1 Refrigerant Type', xmlTag: 'bc_coil1refrig' },
  { label: 'Coil 1 Distributor', xmlTag: 'bc_coil1dist' },
  { label: 'Coil 1 Piping Size', xmlTag: 'nfc_pp1_size' },
  { label: 'Coil 1 Piping Valve', xmlTag: 'nfc_pp1_valve' },
  { label: 'Coil 1 Piping Package', xmlTag: 'nfc_pp1_package' },
  { label: 'Coil 1 Fixed GPM', xmlTag: 'nfc_pp1_gpm' },
  { label: 'Coil 1 Unions', xmlTag: 'nfc_pp1_union' },
  { label: 'Coil 1 P/T Ports', xmlTag: 'nfc_pp1_ptport' },
  { label: 'Coil 1 Aquastat Bleed Line', xmlTag: 'nfc_pp1_aqstbl' },
  { label: 'Coil 1 Actuator Type', xmlTag: 'nfc_pp1_act' },
  { label: 'Coil 1 Y-Strainer', xmlTag: 'nfc_pp1_ystrain' },
  { label: 'Manual Reset', xmlTag: 'nfc_man_reset' },
  { label: 'Coil 2', xmlTag: 'nfc_coil2' },
  { label: 'Coil 2 Diameter', xmlTag: 'nfc_coil2_dia' },
  { label: 'Coil 2 Tube Wall', xmlTag: 'nfc_coil2_twt' },
  { label: 'Coil 2 Air Vent', xmlTag: 'nfc_coil2_av' },
  { label: 'Coil 2 Refrigerant Type', xmlTag: 'bc_coil2refrig' },
  { label: 'Coil 2 Distributor', xmlTag: 'bc_coil2dist' },
  { label: 'Coil 2 Piping Size', xmlTag: 'nfc_pp2_size' },
  { label: 'Coil 2 Piping Valve', xmlTag: 'nfc_pp2_valve' },
  { label: 'Coil 2 Piping Package', xmlTag: 'nfc_pp2_package' },
  { label: 'Coil 2 Fixed GPM', xmlTag: 'nfc_pp2_gpm' },
  { label: 'Coil 2 Unions', xmlTag: 'nfc_pp2_union' },
  { label: 'Coil 2 P/T Ports', xmlTag: 'nfc_pp2_ptport' },
  { label: 'Coil 2 Aquastat Bleed Line', xmlTag: 'nfc_pp2_aqstbl' },
  { label: 'Coil 2 Actuator Type', xmlTag: 'nfc_pp2_act' },
  { label: 'Coil 2 Y-Strainer', xmlTag: 'nfc_pp2_ystrain' },
  { label: 'EH Voltage', xmlTag: 'bc_ehvolt' },
  { label: 'KW', xmlTag: 'nfc_kw' },
  { label: 'Silent Relay', xmlTag: 'nfc_silent_relay' },
  { label: 'Filter', xmlTag: 'nfc_filter' },
  { label: 'Spare Filter', xmlTag: 'nfc_spare_filter' },
  { label: 'Insulation', xmlTag: 'nfc_insul' },
  { label: 'Access Panel', xmlTag: 'nfc_access_pan' },
  { label: 'Access Panel Size', xmlTag: 'nfc_access_pan_size' },
  { label: 'Unit Drain Pan', xmlTag: 'nfc_udp' },
  { label: 'Secondary Drain Connect', xmlTag: 'nfc_sec_dc' },
  { label: 'Auxiliary Drip Pan', xmlTag: 'nfc_aux_dp' },
  { label: 'Basic Control Package', xmlTag: 'nfc_bcp' },
  { label: 'Fan Speed Controller', xmlTag: 'nfc_fan_sc' },
  { label: 'Disconnect Switch', xmlTag: 'nfc_disc' },
  { label: 'Main Fusing', xmlTag: 'nfc_mf' },
  { label: 'Float Switch', xmlTag: 'nfc_floats' },
  { label: 'Speed Switch', xmlTag: 'nfc_speeds' },
  { label: 'Solid State Relay', xmlTag: 'nfc_ssr' },
  { label: 'Return Air', xmlTag: 'nfc_ret_air' },
  { label: 'Supply Air', xmlTag: 'nfc_sup_air' },
  { label: 'Paint', xmlTag: 'nfc_paint' },
  { label: 'T-Stat', xmlTag: 'nfc_tstat' },
  { label: 'Aquastat', xmlTag: 'nfc_aquastat' },
  { label: 'FM DDC Manufacturer', xmlTag: 'nfc_ddcmfg' },
  { label: 'FM DDC Model', xmlTag: 'nfc_ddcmodel' },
  { label: 'Special 1', xmlTag: 'sp1' },
  { label: 'Special 2', xmlTag: 'sp2' },
  { label: 'Special 3', xmlTag: 'sp3' },
  { label: 'Special 4', xmlTag: 'sp4' },
  { label: 'Special 5', xmlTag: 'sp5' },
  { label: 'Special 6', xmlTag: 'sp6' },
];

const KRU_BLOCK_SUMMARY_COLS: TableColumn[] = [
  { key: 'line', label: 'Line', xmlTags: ['Line'], align: 'center', widthPct: 15 },
  { key: 'qty', label: 'Qty', xmlTags: ['Qty'], align: 'center', widthPct: 15 },
  { key: 'model', label: 'Model', xmlTags: ['Model'], align: 'left', widthPct: 30 },
  {
    key: 'priceEach',
    label: 'Price Each',
    xmlTags: ['IndividualPrice'],
    align: 'right',
    widthPct: 20,
  },
  { key: 'totalPrice', label: 'Total Price', xmlTags: ['TotalCost'], align: 'right', widthPct: 20 },
];

export const KRUFANCOILNFCHORZCHC_CONFIG: OrderTypeConfig = {
  id: 'krufancoilnfchorzchc',
  brand: 'KRU',
  label: 'KRU Fan Coil NFC Horz HC',
  renderMode: 'kru-block',
  groupSelector: 'KRUFanCoilNFCHorzHC > Group',
  blockFields: [
    ...KRUFANCOIL_SHARED_NFC_FIELDS,
    { label: 'Coil FPI', xmlTag: 'nfc_coil_fpi' },
    { label: 'Coil Casing', xmlTag: 'nfc_coil_cas' },
    { label: 'Coil Hand', xmlTag: 'nfc_coil_hand' },
    { label: 'Bottom Return Duct Conn', xmlTag: 'nfc_bdrc' },
    { label: 'Inlet', xmlTag: 'bc_inlet' },
    { label: 'Mixing Box Damper Loc', xmlTag: 'bc_mbdl' },
    { label: 'Damper Actuator Mount', xmlTag: 'nfc_dactmt' },
  ],
  columns: KRU_BLOCK_SUMMARY_COLS,
  headerRows: [],
};

export const KRUFANCOILNFCHORZSTAND_CONFIG: OrderTypeConfig = {
  id: 'krufancoilnfchorzstand',
  brand: 'KRU',
  label: 'KRU Fan Coil NFC Horz Stand',
  renderMode: 'kru-block',
  groupSelector: 'KRUFanCoilNFCHorzSTAND > Group',
  blockFields: [
    ...KRUFANCOIL_SHARED_NFC_FIELDS,
    { label: 'Coil FPI', xmlTag: 'nfc_coil1_fpi' },
    { label: 'Coil 2 FPI', xmlTag: 'nfc_coil2_fpi' },
    { label: 'Coil 2 Hand', xmlTag: 'nfc_coil2_hand' },
    { label: 'Bottom Return Duct Conn', xmlTag: 'nfc_bdrc' },
    { label: 'Bottom Hinge Elec Encl', xmlTag: 'nfc_bhee' },
  ],
  columns: KRU_BLOCK_SUMMARY_COLS,
  headerRows: [],
};

export const KRUFANCOILNFCVERTSTAND_CONFIG: OrderTypeConfig = {
  id: 'krufancoilnfcvertstand',
  brand: 'KRU',
  label: 'KRU Fan Coil NFC Vert Stand',
  renderMode: 'kru-block',
  groupSelector: 'KRUFanCoilNFCVertStand > Group',
  blockFields: [
    ...KRUFANCOIL_SHARED_NFC_FIELDS,
    { label: 'Coil 1 Hand Config', xmlTag: 'nfc_coil1_handcfg' },
    { label: 'Coil 1 FPI', xmlTag: 'nfc_coil1_fpi' },
    { label: 'Coil 2 Hand Config', xmlTag: 'nfc_coil2_handcfg' },
    { label: 'Coil 2 FPI', xmlTag: 'nfc_coil2_fpi' },
    { label: 'Coil 2 Hand', xmlTag: 'nfc_coil2_hand' },
    { label: 'Coil 2 Balancing Valve', xmlTag: 'nfc_pp2_bv' },
    { label: 'Coil 2 Flow Control', xmlTag: 'nfc_pp2_fc' },
    { label: 'Coil 1 Balancing Valve', xmlTag: 'nfc_pp1_bv' },
    { label: 'Coil 1 Flow Control', xmlTag: 'nfc_pp1_fc' },
    { label: 'Coil 2 Piping Factory Mount', xmlTag: 'nfc_pp2_fm' },
    { label: 'Coil Casing', xmlTag: 'nfc_coil_cas' },
    { label: 'T-Stat Location', xmlTag: 'nfc_tstatloc' },
    { label: 'Outside Air Option', xmlTag: 'nfc_out_air' },
    { label: 'Wall Box', xmlTag: 'nfc_wallbox' },
    { label: 'Wall Recessing Panel', xmlTag: 'nfc_wallrp' },
    { label: 'Additional Height', xmlTag: 'nfc_add_h' },
    { label: 'Additional Width', xmlTag: 'nfc_add_w' },
    { label: 'Extended End Pocket', xmlTag: 'nfc_ext_ep' },
    { label: 'Falseback', xmlTag: 'nfc_falsebk' },
    { label: 'Tamper Proof Fasteners', xmlTag: 'nfc_tpf' },
    { label: '16 Gauge Front Panel', xmlTag: 'nfc_16gafp' },
    { label: 'Leveling Legs', xmlTag: 'nfc_level_leg' },
    { label: 'FM Control Enclosure', xmlTag: 'nfc_ddcenclose' },
    { label: 'Coil 1 Piping Factory Mount', xmlTag: 'nfc_pp1_fm' },
  ],
  columns: KRU_BLOCK_SUMMARY_COLS,
  headerRows: [],
};

export const KRUFANCOILNFCVERTSTACK_CONFIG: OrderTypeConfig = {
  id: 'krufancoilnfcvertstack',
  brand: 'KRU',
  label: 'KRU Fan Coil NFC Vert Stack',
  renderMode: 'kru-block',
  groupSelector: 'KRUFanCoilNFCVertStack > Group',
  blockFields: [
    ...KRUFANCOIL_SHARED_NFC_FIELDS,
    { label: 'Arrangement', xmlTag: 'nfc_argmt' },
    { label: 'T-Stat Location', xmlTag: 'nfc_tstatloc' },
    { label: 'T-Stat Mounting Opt', xmlTag: 'nfc_ts_mo' },
    { label: 'Coil 2 Flow Control', xmlTag: 'nfc_pp2_fc' },
    { label: 'Coil 2 Y-Str. Cleanout', xmlTag: 'nfc_c2ysco' },
    { label: 'Coil 1 Flow Control', xmlTag: 'nfc_pp1_fc' },
    { label: 'Coil 1 Y-Str. Cleanout', xmlTag: 'nfc_c1ysco' },
    { label: 'Coil Casing', xmlTag: 'nfc_coil_cas' },
    { label: '#Supply Grilles', xmlTag: 'nfc_nsg' },
    { label: 'Supply Air Option', xmlTag: 'nfc_sup_air' },
    { label: 'Outside Air Option', xmlTag: 'nfc_out_air' },
    { label: 'Blower Shield', xmlTag: 'nfc_blwrshld' },
    { label: 'Upsize Cabinet', xmlTag: 'nfc_upsize' },
    { label: 'Unit Discharge Option', xmlTag: 'nfc_udo' },
    { label: 'Riser Cover', xmlTag: 'nfc_rc' },
    { label: 'Removable Drain Pan', xmlTag: 'nfc_rdp' },
    { label: 'Short Cabinet', xmlTag: 'nfc_shortcab' },
    { label: 'UL Fire Rated', xmlTag: 'nfc_ulfr' },
    { label: 'Return Air Option', xmlTag: 'nfc_ret_air' },
  ],
  columns: KRU_BLOCK_SUMMARY_COLS,
  headerRows: [],
};

// ── Registry ──────────────────────────────────────────────────────────────────

const ALL_CONFIGS: OrderTypeConfig[] = [
  TITUSGRD_CONFIG,
  TITUSTERMINAL_CONFIG,
  TITUSREPAIRPARTS_CONFIG,
  TITUSCHILDEDCBSYN_CONFIG,
  TITUSFFD_CONFIG,
  TITUSTEC_CONFIG,
  TITUSVSRISERS_CONFIG,
  TITUSEXV_CONFIG,
  TNBHEADER_CONFIG,
  TNBHEADERVAV_CONFIG,
  TNBHEADER7_CONFIG,
  TNBHEADERDV_CONFIG,
  TNBHEADER13_CONFIG,
  TNBHEADER18_CONFIG,
  GENERIC_CONFIG,
  // KRU table-layout configs
  KRUGRD_CONFIG,
  KRUCHILLEDBEAMS_CONFIG,
  KRUSINGLEDUCT_CONFIG,
  KRUDUALDUCT_CONFIG,
  KRUFANPOWERED_CONFIG,
  KRUHEATERRACK_CONFIG,
  KRUSTANDARDFANCOIL_CONFIG,
  KRUCRFF_CONFIG,
  KRUDISPLACE_CONFIG,
  KRUREPAIRPARTS_CONFIG,
  // KRU block-layout configs
  KRUBLOWERCOIL_CONFIG,
  KRUFANCOILNFCHORZCHC_CONFIG,
  KRUFANCOILNFCHORZSTAND_CONFIG,
  KRUFANCOILNFCVERTSTAND_CONFIG,
  KRUFANCOILNFCVERTSTACK_CONFIG,
];

export function getConfigById(id: string): OrderTypeConfig {
  return ALL_CONFIGS.find((c) => c.id === id) ?? TITUSGRD_CONFIG;
}

export function getConfigByFamilyTag(familyTag: string, brand?: string): OrderTypeConfig {
  const tag = familyTag.toLowerCase();
  const found = ALL_CONFIGS.find((cfg) =>
    cfg.groupSelector
      .split(',')
      .map((s) => s.split('>')[0].trim().toLowerCase())
      .some((t) => t === tag),
  );
  if (found) return found;
  // Fall back to the brand's primary table config when no groupSelector matches
  switch ((brand ?? '').toUpperCase()) {
    case 'KRU': return KRUGRD_CONFIG;
    case 'TNB': return TNBHEADER_CONFIG;
    case 'PEN': return GENERIC_CONFIG;
    default:    return TITUSGRD_CONFIG;
  }
}

/**
 * Returns a config for every product-type section found in the parsed TTS element.
 * Preserves the order they appear in the XML (top to bottom).
 */
export function detectAllOrderConfigs(root: Element, brand?: Brand): OrderTypeConfig[] {
  // Narrow to brand-matching configs first; fall back to all if brand is unknown.
  const candidates = brand ? ALL_CONFIGS.filter((cfg) => cfg.brand === brand) : ALL_CONFIGS;

  // Collect lowercase direct-child tag names once, then match case-insensitively against
  // the parent tag extracted from each config's groupSelector.
  // groupSelector format: 'TagName > Group'  or  'Tag1 > Group, Tag2 > Group'
  const childTags = new Set(Array.from(root.children, (el) => el.localName.toLowerCase()));
  const found = candidates.filter((cfg) =>
    cfg.groupSelector
      .split(',')
      .map((s) => s.split('>')[0].trim().toLowerCase())
      .some((tag) => childTags.has(tag)),
  );

  return found.length ? found : [TITUSGRD_CONFIG];
}

/** @deprecated Use detectAllOrderConfigs. Kept for any legacy call sites. */
export function detectOrderConfig(tts: Element): OrderTypeConfig {
  return detectAllOrderConfigs(tts)[0];
}
