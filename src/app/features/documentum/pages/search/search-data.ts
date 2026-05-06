export interface QueueItem {
  id: string;
  purchaseOrder: string;
  salesOrder: string;
  priority: number;
  accountNumber: string;
  repName: string;
  queueName: string;
  product: string;
  region: string;
  jobName: string;
  createdDate: string;
  dateInQueue: string;
  packageOwner: string;
  brand: string;
}

export interface SearchFilter {
  salesOrderNumber: string;
  purchaseOrderNumber: string;
  accountNumber: string;
  priority: string | null;
  brand: string;
  queueName: string | null;
  productType: string | null;
  region: string | null;
  captureDateFrom: Date | null;
  captureDateTo: Date | null;
  jobName: string;
  packageOwner: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export const PRIORITY_OPTIONS: SelectOption[] = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
];

export const QUEUE_NAME_OPTIONS: SelectOption[] = [
  { label: 'Release to Production', value: 'Release to Production' },
  { label: 'AM', value: 'AM' },
  { label: 'AE Hold', value: 'AE Hold' },
];

export const PRODUCT_TYPE_OPTIONS: SelectOption[] = [
  { label: 'GRD', value: 'GRD' },
  { label: 'TU', value: 'TU' },
  { label: 'FC', value: 'FC' },
];

export const REGION_OPTIONS: SelectOption[] = [
  { label: 'CENTRAL', value: 'CENTRAL' },
  { label: 'EAST', value: 'EAST' },
  { label: 'WEST', value: 'WEST' },
];

export const TOTAL_ACTIVE_ITEMS = 8833;

export const MOCK_QUEUE_ITEMS: QueueItem[] = [
  {
    id: '1',
    purchaseOrder: 'SS24-289',
    salesOrder: 'H78303',
    priority: 2,
    accountNumber: '742400',
    repName: 'SWANEY SALES',
    queueName: 'Release to Production',
    product: 'GRD',
    region: 'CENTRAL',
    jobName: 'PAULR...',
    createdDate: '10/13/24 09:48 pm',
    dateInQueue: '12/22/25 06:42 pm',
    packageOwner: '',
    brand: 'Krueger',
  },
  {
    id: '2',
    purchaseOrder: 'MP19087',
    salesOrder: 'H93680',
    priority: 3,
    accountNumber: '809800',
    repName: 'HERMAN H...',
    queueName: 'Release to Production',
    product: 'TU',
    region: 'EAST',
    jobName: '220820...',
    createdDate: '11/27/24 08:07 pm',
    dateInQueue: '11/27/25 08:35 pm',
    packageOwner: '',
    brand: 'Krueger',
  },
  {
    id: '3',
    purchaseOrder: 'LPT-2400519-006',
    salesOrder: 'J03505',
    priority: 1,
    accountNumber: '927',
    repName: 'MECH PROD',
    queueName: 'Release to Production',
    product: 'GRD',
    region: 'WEST',
    jobName: '',
    createdDate: '01/06/25 08:43 pm',
    dateInQueue: '01/15/26 06:54 pm',
    packageOwner: '',
    brand: 'Krueger',
  },
  {
    id: '4',
    purchaseOrder: '53473',
    salesOrder: 'J04051',
    priority: 1,
    accountNumber: '702',
    repName: 'JEDCO',
    queueName: 'Release to Production',
    product: 'GRD',
    region: 'EAST',
    jobName: '',
    createdDate: '01/07/25 10:03 pm',
    dateInQueue: '01/15/26 06:51 pm',
    packageOwner: '',
    brand: 'Krueger',
  },
  {
    id: '5',
    purchaseOrder: '20250115VL',
    salesOrder: 'J07356',
    priority: 3,
    accountNumber: '999902',
    repName: 'AIR DISTRI...',
    queueName: 'Release to Production',
    product: 'GRD',
    region: 'EAST',
    jobName: 'LINEAR...',
    createdDate: '01/16/25 03:21 am',
    dateInQueue: '01/13/26 06:57 pm',
    packageOwner: '',
    brand: 'Krueger',
  },
  {
    id: '6',
    purchaseOrder: 'P-2012441',
    salesOrder: 'J17734',
    priority: 1,
    accountNumber: '774200',
    repName: 'CIS',
    queueName: 'AM',
    product: 'FC',
    region: 'CENT...',
    jobName: '',
    createdDate: '02/14/25 12:33 am',
    dateInQueue: '02/20/25 07:50 pm',
    packageOwner: '',
    brand: 'Krueger',
  },
  {
    id: '7',
    purchaseOrder: '1011322',
    salesOrder: 'J18434',
    priority: 1,
    accountNumber: '774200',
    repName: 'CIS MECHA...',
    queueName: 'AM',
    product: 'FC',
    region: 'WEST',
    jobName: 'ARKAN...',
    createdDate: '02/15/25 03:11 am',
    dateInQueue: '02/22/25 01:07 am',
    packageOwner: '',
    brand: 'Krueger',
  },
  {
    id: '8',
    purchaseOrder: '2559593737',
    salesOrder: 'J20828',
    priority: 3,
    accountNumber: '800',
    repName: 'CRITICAL S...',
    queueName: 'AM',
    product: 'FC',
    region: 'EAST',
    jobName: 'COMBU...',
    createdDate: '02/22/25 01:42 am',
    dateInQueue: '02/27/25 07:54 pm',
    packageOwner: '',
    brand: 'Krueger',
  },
  {
    id: '9',
    purchaseOrder: '2559593737A',
    salesOrder: 'J20829',
    priority: 2,
    accountNumber: '800',
    repName: 'CRITICAL S...',
    queueName: 'AM',
    product: 'FC',
    region: 'EAST',
    jobName: 'COMBU...',
    createdDate: '02/22/25 01:45 am',
    dateInQueue: '02/27/25 07:04 pm',
    packageOwner: '',
    brand: 'Krueger',
  },
  {
    id: '10',
    purchaseOrder: '129935',
    salesOrder: 'J25512',
    priority: 3,
    accountNumber: '755401',
    repName: 'CYPRESS...',
    queueName: 'AM',
    product: 'FC',
    region: 'EAST',
    jobName: 'CITY OF...',
    createdDate: '03/06/25 09:57 pm',
    dateInQueue: '03/13/25 01:27 am',
    packageOwner: '',
    brand: 'Krueger',
  },
  {
    id: '11',
    purchaseOrder: 'TBD',
    salesOrder: 'J27929',
    priority: 3,
    accountNumber: '742901',
    repName: 'ACES',
    queueName: 'AE Hold',
    product: 'GRD',
    region: 'EAST',
    jobName: '',
    createdDate: '03/13/25 01:11 am',
    dateInQueue: '07/29/25 07:52 pm',
    packageOwner: '',
    brand: 'Krueger',
  },
];
