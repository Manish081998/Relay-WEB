import { Role } from '../../models/role.enum';
import { NAV_ICONS } from './nav-icons';

export interface NavChild {
  label: string;
  route: string;
  icon: string;
  color?: string;
}

export interface NavGroup {
  label: string;
  icon: string;
  color?: string;
  roles: Role[] | 'all';
  children: NavChild[];
}

export interface NavStandaloneItem {
  label: string;
  route: string;
  icon: string;
  roles: Role[] | 'all';
}

export const DASHBOARD_NAV: NavStandaloneItem = {
  label: 'Dashboard',
  route: '/dashboard',
  icon: NAV_ICONS.dashboard,
  roles: 'all',
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Intranet',
    icon: NAV_ICONS.intranet,
    color: '#60a5fa',
    roles: [Role.SuperAdmin, Role.Admin, Role.User],
    children: [
      {
        label: 'Edge Orders Search',
        route: '/intranet/Edge-Orders-Search',
        icon: NAV_ICONS.users,
        color: '#60a5fa',
      },
      { label: 'EDI', route: '/intranet/edi', icon: NAV_ICONS.selections, color: '#a78bfa' },
    ],
  },
  {
    label: 'Documentum',
    icon: NAV_ICONS.documentum,
    color: '#34d399',
    roles: [Role.SuperAdmin, Role.Admin, Role.User],
    children: [
      { label: 'Search', route: '/documentum/search', icon: NAV_ICONS.search, color: '#34d399' },
      {
        label: 'Queue Search',
        route: '/documentum/queue-search',
        icon: NAV_ICONS.queue,
        color: '#fbbf24',
      },
    ],
  },
  {
    label: 'Administration',
    icon: NAV_ICONS.settings,
    color: '#f97316',
    roles: [Role.SuperAdmin],
    children: [
      {
        label: 'Manage Queue',
        route: '/admin/manage-queue',
        icon: NAV_ICONS.manageQueue,
        color: '#f97316',
      },
      {
        label: 'Manage Users',
        route: '/admin/manage-users',
        icon: NAV_ICONS.manageUsers,
        color: '#a78bfa',
      },
      {
        label: 'Brand - Queue Mapping',
        route: '/admin/brand-queue-mapping',
        icon: NAV_ICONS.brandQueueMapping,
        color: '#f472b6',
      },
    ],
  },
  // {
  //   label: 'Planner Dashboard',
  //   icon: NAV_ICONS.plannerDashboard,
  //   roles: [Role.SuperAdmin, Role.Admin],
  //   children: [
  //     {
  //       label: 'Orders',
  //       route: '/planner/orders',
  //       icon: NAV_ICONS.plannerorders,
  //       color: '#f97316',
  //     },
  //     {
  //       label: 'Plant Capacity',
  //       route: '/planner/plant-capacity',
  //       icon: NAV_ICONS.plantCapacity,
  //       color: '#34d399',
  //     },
  //     {
  //       label: 'Released Orders',
  //       route: '/planner/released-orders',
  //       icon: NAV_ICONS.releasedOrders,
  //       color: '#a78bfa',
  //     },
  //   ],
  // },
];

export const ADMIN_NAV: NavStandaloneItem[] = [];

export const USER_NAV: NavStandaloneItem[] = [
  { label: 'User Settings', route: '/profile', icon: NAV_ICONS.userSettings, roles: 'all' },
  { label: 'Help Desk', route: '/help-desk', icon: NAV_ICONS.helpDesk, roles: 'all' },
  { label: 'User Guide', route: '/user-guide', icon: NAV_ICONS.userGuide, roles: 'all' },
];
