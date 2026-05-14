import React from 'react';
import { BespokeIcons } from '../../lib/BespokeIcons';

export interface IconProps {
 name: string;
 className?: string;
 size?: number;
}

const Icon: React.FC<IconProps> = ({ name, className = "", size = 20 }) => {
 const icons: Record<string, any> = {
 'grid_view': BespokeIcons.Home,
 'stars': BespokeIcons.Star,
 'event': BespokeIcons.Calendar,
 'history': BespokeIcons.History,
 'payments': BespokeIcons.Wallet,
 'person': BespokeIcons.User,
 'menu': BespokeIcons.Menu,
 'star': BespokeIcons.StarFilled,
 'account_balance_wallet': BespokeIcons.Wallet,
 'package_2': BespokeIcons.Bag,
 'two_wheeler': BespokeIcons.Motorcycle,
 'directions_car': BespokeIcons.Car,
 'local_shipping': BespokeIcons.Truck,
 'schedule': BespokeIcons.Clock,
 'location_on': BespokeIcons.Pin,
 'check_circle': BespokeIcons.Check,
 'verified': BespokeIcons.Check,
 'chat': BespokeIcons.Support,
 'power_off': BespokeIcons.Logout,
 'power_settings_new': BespokeIcons.Power,
 'radar': BespokeIcons.Bolt,
 'check': BespokeIcons.Check,
 'close': BespokeIcons.X,
 'analytics': BespokeIcons.Coins,
 'today': BespokeIcons.Clock,
 'route': BespokeIcons.Map,
 'military_tech': BespokeIcons.Shield,
 'workspace_premium': BespokeIcons.Shield,
 'event_available': BespokeIcons.Check,
 'history_edu': BespokeIcons.History,
 'sentiment_dissatisfied': BespokeIcons.Help,
 'satellite_alt': BespokeIcons.Map,
 'navigation': BespokeIcons.Pin,
 'map': BespokeIcons.Map,
 'emergency': BespokeIcons.Help,
 'moped': BespokeIcons.Motorcycle,
 'chevron_right': BespokeIcons.ChevronRight,
 'pedal_bike': BespokeIcons.Motorcycle,
 'support_agent': BespokeIcons.Support,
 'badge': BespokeIcons.User,
 'settings': BespokeIcons.Menu,
 'volume_up': BespokeIcons.Notifications,
 'notifications': BespokeIcons.Notifications,
 'notifications_active': BespokeIcons.Notifications,
 'notifications_off': BespokeIcons.Notifications,
 'visibility': BespokeIcons.Eye,
 'visibility_off': BespokeIcons.EyeOff,
 'arrow_back': BespokeIcons.ChevronLeft,
 'arrow_forward': BespokeIcons.ChevronRight,
 'delete': BespokeIcons.Trash || BespokeIcons.X,
 };

 const BespokeIcon = icons[name];

 if (!BespokeIcon) {
 return <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>{name}</span>;
 }

 return <BespokeIcon className={className} size={size} />;
};

export default Icon;
