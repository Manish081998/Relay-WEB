import { PlannerOrder } from '../models/planner-order.model';
import { PlannerPlant } from '../models/planner-plant.model';

// Centralized mock data — swap each service method's `of(...)` call for a real
// ApiService call once the backend is live.  No component or store references
// this file directly; only PlannerService does.

export const MOCK_PLANTS: PlannerPlant[] = [
  { id: 'PLT-01', name: 'PLT-01 Shanghai',  location: 'APAC · China',       region: 'APAC',  monthlyCapacity: 5000  },
  { id: 'PLT-02', name: 'PLT-02 Munich',    location: 'EMEA · Germany',     region: 'EMEA',  monthlyCapacity: 2500  },
  { id: 'PLT-03', name: 'PLT-03 Houston',   location: 'NA · United States', region: 'NA',    monthlyCapacity: 6000  },
  { id: 'PLT-04', name: 'PLT-04 Monterrey', location: 'LATAM · Mexico',     region: 'LATAM', monthlyCapacity: 4000  },
  { id: 'PLT-05', name: 'PLT-05 Chennai',   location: 'APAC · India',       region: 'APAC',  monthlyCapacity: 1500  },
];

export const MOCK_ORDERS: PlannerOrder[] = [
  { id: 'ORD-2025-0841', product: 'Industrial Hydraulic Pump', sku: 'HYD-PMP-7X', qty: 1200, unit: 'pcs', shipDate: '2025-06-06', region: 'APAC',  recommendedPlant: 'PLT-01', allowedPlants: ['PLT-01', 'PLT-05'], status: 'pending',  notes: '' },
  { id: 'ORD-2025-0842', product: 'Pneumatic Actuator 80mm',   sku: 'ACT-PNE-80', qty:  640, unit: 'pcs', shipDate: '2025-06-04', region: 'EMEA',  recommendedPlant: 'PLT-02', allowedPlants: ['PLT-02'],            status: 'pending',  notes: '' },
  { id: 'ORD-2025-0843', product: 'Electric Motor 75kW',       sku: 'MTR-75K-2R', qty:  320, unit: 'pcs', shipDate: '2025-06-11', region: 'NA',    recommendedPlant: 'PLT-03', allowedPlants: ['PLT-03', 'PLT-04'], status: 'pending',  notes: '' },
  { id: 'ORD-2025-0844', product: 'Compressor Unit Type-C',    sku: 'CMP-TC-09',  qty:  500, unit: 'pcs', shipDate: '2025-06-10', region: 'LATAM', recommendedPlant: 'PLT-04', allowedPlants: ['PLT-04', 'PLT-03'], status: 'pending',  notes: '' },
  { id: 'ORD-2025-0845', product: 'Sensor Array Module',       sku: 'SEN-ARR-11', qty:  900, unit: 'pcs', shipDate: '2025-06-18', region: 'APAC',  recommendedPlant: 'PLT-05', allowedPlants: ['PLT-05', 'PLT-01'], status: 'released', notes: '' },
  { id: 'ORD-2025-0846', product: 'Precision Valve Assembly',  sku: 'VLV-ASM-4B', qty:  850, unit: 'pcs', shipDate: '2025-06-04', region: 'EMEA',  recommendedPlant: 'PLT-02', allowedPlants: ['PLT-02'],            status: 'released', notes: '' },
  { id: 'ORD-2025-0847', product: 'Control Panel Assembly',    sku: 'CTL-PNL-3C', qty:  500, unit: 'pcs', shipDate: '2025-06-12', region: 'NA',    recommendedPlant: 'PLT-03', allowedPlants: ['PLT-03', 'PLT-04'], status: 'released', notes: '' },
  { id: 'ORD-2025-0848', product: 'Stainless Pipe Fittings',   sku: 'PIP-FIT-SS', qty: 2300, unit: 'pcs', shipDate: '2025-06-12', region: 'LATAM', recommendedPlant: 'PLT-04', allowedPlants: ['PLT-04'],            status: 'released', notes: '' },
  { id: 'ORD-2025-0849', product: 'Bearing Set 6200 Series',   sku: 'BRG-6200-X', qty: 2800, unit: 'pcs', shipDate: '2025-06-04', region: 'APAC',  recommendedPlant: 'PLT-01', allowedPlants: ['PLT-01', 'PLT-05'], status: 'released', notes: '' },
  { id: 'ORD-2025-0850', product: 'Gearbox Housing XL',        sku: 'GBX-HSG-XL', qty:  920, unit: 'pcs', shipDate: '2025-06-06', region: 'EMEA',  recommendedPlant: 'PLT-02', allowedPlants: ['PLT-02'],            status: 'released', notes: '' },
];
