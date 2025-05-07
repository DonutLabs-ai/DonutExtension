export interface Command {
  id: string;
  label: string;
  value: string;
  action?: () => void;
  multiStep?: boolean;
}

export const commands: Command[] = [
  {
    id: 'search',
    label: 'Search',
    value: 'Search',
    action: () => window.open('https://google.com', '_blank'),
  },
  { id: 'help', label: 'Help', value: 'Help', action: () => alert('Help documentation') },
  { id: 'settings', label: 'Settings', value: 'Settings', action: () => alert('Settings opened') },
  {
    id: 'swap',
    label: 'Swap',
    value: 'Swap',
    multiStep: true,
    action: () => alert('Swap started'),
  },
];
