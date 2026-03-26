import { BespokeIcons } from "../../lib/BespokeIcons";

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export function Icon({ name, className = "", size = 20 }: IconProps) {
  const icons: Record<string, any> = {
    'home': BespokeIcons.Home,
    'search': BespokeIcons.Search,
    'shopping_bag': BespokeIcons.Bag,
    'shopping_cart': BespokeIcons.Bag,
    'person': BespokeIcons.User,
    'chevron_left': BespokeIcons.ChevronLeft,
    'chevron_right': BespokeIcons.ChevronRight,
    'location_on': BespokeIcons.Pin,
    'pin_drop': BespokeIcons.Pin,
    'bolt': BespokeIcons.Bolt,
    'category': BespokeIcons.Bag,
    'map': BespokeIcons.Map,
    'more_vert': BespokeIcons.Menu,
    'close': BespokeIcons.X,
    'notifications': BespokeIcons.Notifications,
    'shield': BespokeIcons.Shield,
    'support_agent': BespokeIcons.Support,
    'help': BespokeIcons.Help,
    'history': BespokeIcons.History,
    'payments': BespokeIcons.Wallet,
    'wallet': BespokeIcons.Wallet,
    'account_balance_wallet': BespokeIcons.Wallet,
    'credit_card': BespokeIcons.CreditCard,
    'star': BespokeIcons.StarFilled,
    'check_circle': BespokeIcons.Check,
    'check': BespokeIcons.Check,
    'logout': BespokeIcons.Logout,
    'settings': BespokeIcons.User,
    'local_shipping': BespokeIcons.Truck,
    'monetization_on': BespokeIcons.Coins,
    'card_giftcard': BespokeIcons.Gift,
    'expand_more': BespokeIcons.ChevronDown,
    'expand_less': BespokeIcons.ChevronUp,
    'directions_car': BespokeIcons.Car,
    'two_wheeler': BespokeIcons.Motorcycle,
    'schedule': BespokeIcons.Clock,
    'workspace_premium': BespokeIcons.Bolt,
    'stars': BespokeIcons.Star,
    'qr_code_2': BespokeIcons.Check,
    'receipt_long': BespokeIcons.History,
    'smart_toy': BespokeIcons.Bolt,
    'military_tech': BespokeIcons.Shield,
    'sync': BespokeIcons.Clock,
    'diamond': BespokeIcons.Bolt,
    'arrow_back': BespokeIcons.ChevronLeft,
    'arrow_forward': BespokeIcons.ChevronRight,
    'delete': BespokeIcons.X,
    'edit': BespokeIcons.User,
    'local_pizza': BespokeIcons.Pizza,
    'pizza': BespokeIcons.Pizza,
    'fastfood': BespokeIcons.Burger,
    'burger': BespokeIcons.Burger,
    'local_cafe': BespokeIcons.Coffee,
    'coffee': BespokeIcons.Coffee,
    'package': BespokeIcons.Package,
    'inventory_2': BespokeIcons.Package,
  };

  const IconComp = icons[name] || BespokeIcons.Help;
  return <IconComp size={size} className={className} />;
}
