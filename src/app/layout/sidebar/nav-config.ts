import { Role } from '../../models/role.enum';
import { NAV_ICONS } from './nav-icons';

export interface NavChild {
  label: string;
  route: string;
  icon: string;
}

export interface NavGroup {
  label: string;
  icon: string;
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
    roles: [Role.SuperAdmin, Role.Admin, Role.User],
    children: [
      { label: 'Edge Orders Search', route: '/intranet/Edge-Orders-Search', icon: NAV_ICONS.users },
    ],
  },
  {
    label: 'Documentum',
    icon: NAV_ICONS.documentum,
    roles: [Role.SuperAdmin, Role.Admin, Role.User],
    children: [
      { label: 'Search', route: '/documentum/search', icon: NAV_ICONS.search },
      { label: 'Queue Search', route: '/documentum/queue-search', icon: NAV_ICONS.queue },
      { label: 'Annotation', route: '/documentum/test-annotation', icon: NAV_ICONS.annotation },
    ],
  },
  {
    label: 'Settings',
    icon: NAV_ICONS.settings,
    roles: 'all',
    children: [
      { label: 'Manage Queue', route: '/admin/manage-queue', icon: NAV_ICONS.manageQueue },
      { label: 'Manage Users', route: '/admin/manage-users', icon: NAV_ICONS.manageUsers },
    ],
  },
];

export const ADMIN_NAV: NavStandaloneItem[] = [
  {
    label: 'Reports',
    route: '/reports',
    icon: NAV_ICONS.reports,
    roles: [Role.SuperAdmin, Role.Admin],
  },
  { label: 'Admin', route: '/admin', icon: NAV_ICONS.admin, roles: [Role.SuperAdmin] },
];

export const USER_NAV: NavStandaloneItem[] = [
  { label: 'User Settings', route: '/profile', icon: NAV_ICONS.userSettings, roles: 'all' },
  { label: 'Help Desk', route: '/help-desk', icon: NAV_ICONS.helpDesk, roles: 'all' },
  { label: 'User Guide', route: '/user-guide', icon: NAV_ICONS.userGuide, roles: 'all' },
];
