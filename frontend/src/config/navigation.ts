import {
  Bot,
  MessageSquare,
  Send,
  Tag,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import type { NavigationPage } from '@/types';

export interface NavigationItem {
  id: string;
  page: NavigationPage;
  labelKey: string;
  route: string;
  icon: LucideIcon;
  group: 'orchestration' | 'intelligence' | 'communication' | 'growth';
  mobileVisible?: boolean;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'campaigns',
    page: 'campaigns',
    labelKey: 'navbar.campaigns',
    route: '/app/campaigns',
    icon: Bot,
    group: 'orchestration',
    mobileVisible: true,
  },
  {
    id: 'ai-agents',
    page: 'ai-agents',
    labelKey: 'navbar.aiAgents',
    route: '/app/ai-agents',
    icon: Bot,
    group: 'intelligence',
    mobileVisible: true,
  },
  {
    id: 'conversations',
    page: 'conversations',
    labelKey: 'navbar.conversations',
    route: '/app/conversations',
    icon: MessageSquare,
    group: 'communication',
    mobileVisible: true,
  },
  {
    id: 'shipments',
    page: 'shipments',
    labelKey: 'navbar.shipments',
    route: '/app/shipments',
    icon: Send,
    group: 'communication',
    mobileVisible: true,
  },
  {
    id: 'gamification',
    page: 'gamification',
    labelKey: 'navbar.gamification',
    route: '/app/gamification',
    icon: Trophy,
    group: 'growth',
    mobileVisible: true,
  },
  {
    id: 'tags',
    page: 'tags',
    labelKey: 'navbar.tags',
    route: '/app/tags',
    icon: Tag,
    group: 'growth',
    mobileVisible: true,
  },
];

export const NAVIGATION_GROUPS: Record<NavigationItem['group'], string> = {
  orchestration: 'navbar.groups.orchestration',
  intelligence: 'navbar.groups.intelligence',
  communication: 'navbar.groups.communication',
  growth: 'navbar.groups.growth',
};
