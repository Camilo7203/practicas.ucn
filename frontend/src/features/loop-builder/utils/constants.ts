import {
  Monitor,
  BarChart3,
  MessageSquare,
  Award
} from 'lucide-react';

// Available modules with model classes defined
// Note: Only showing implemented types. Other triggers (onClick, scheduled, webhook, idle, onTag) are not yet implemented in backend
export const AVAILABLE_MODULES = {
  trigger: [
    // Temporarily disabled - backend models not implemented yet:
    // { title: 'On Click', description: 'Triggered by button/link click', icon: MousePointer, type: 'onClick' },
    // { title: 'Scheduled', description: 'Triggered on schedule', icon: Clock, type: 'scheduled' },
    // { title: 'Webhook', description: 'Triggered by HTTP request', icon: Webhook, type: 'webhook' },
    { title: 'On Arrival', description: 'Triggered on page arrival', icon: Monitor, type: 'onArrival' },
    // { title: 'Idle', description: 'Triggered when user is idle', icon: Timer, type: 'idle' },
    // { title: 'On Tag', description: 'Triggered by user tagging', icon: Tag, type: 'onTag' }
  ],
  task: [
    { title: 'Info', description: 'Send informational message', icon: MessageSquare, type: 'info' },
    { title: 'Survey', description: 'Send survey to users', icon: BarChart3, type: 'survey' }
  ],
  incentive: [
    { title: 'Points Incentive', description: 'Award points to users', icon: Award, type: 'points' }
  ]
};
