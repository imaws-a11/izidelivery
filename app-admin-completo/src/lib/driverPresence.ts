import type { Driver } from './types';

export const DRIVER_ONLINE_GRACE_MS = 15_000;

export const isDriverOnline = (driver?: Partial<Driver> | null, now = Date.now()) => {
  if (!driver || !driver.is_online || driver.is_deleted) return false;
  if (!driver.last_seen_at) return true;

  const lastSeen = new Date(driver.last_seen_at).getTime();
  if (Number.isNaN(lastSeen)) return true;

  return (now - lastSeen) < DRIVER_ONLINE_GRACE_MS;
};

const getDriverName = (driver: Partial<Driver>) => (driver.name || '').trim();

export const sortDriversByPresence = (drivers: Driver[], now = Date.now()) => (
  [...drivers].sort((a, b) => {
    const onlineDiff = Number(isDriverOnline(b, now)) - Number(isDriverOnline(a, now));
    if (onlineDiff !== 0) return onlineDiff;

    const activeDiff = Number(Boolean(b.is_active)) - Number(Boolean(a.is_active));
    if (activeDiff !== 0) return activeDiff;

    return getDriverName(a).localeCompare(getDriverName(b), 'pt-BR', { sensitivity: 'base' });
  })
);

export const upsertDriverInList = (drivers: Driver[], nextDriver: Driver, now = Date.now()) => {
  const nextList = nextDriver.is_deleted
    ? drivers.filter(driver => driver.id !== nextDriver.id)
    : drivers.some(driver => driver.id === nextDriver.id)
      ? drivers.map(driver => driver.id === nextDriver.id ? { ...driver, ...nextDriver } : driver)
      : [...drivers, nextDriver];

  return sortDriversByPresence(nextList, now);
};

export const removeDriverFromList = (drivers: Driver[], driverId: string, now = Date.now()) => (
  sortDriversByPresence(drivers.filter(driver => driver.id !== driverId), now)
);

export const countOnlineDrivers = (drivers: Driver[], now = Date.now()) => (
  drivers.filter(driver => isDriverOnline(driver, now)).length
);
