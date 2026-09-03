import { useEffect, useState } from "react";
import {
  api,
  clearCachedWallet,
  getCachedWallet,
  setCachedWallet,
  type Room,
} from "./api";

export function useWallet() {
  const [wallet, setWallet] = useState(getCachedWallet() ?? "");

  const save = (w: string) => {
    setCachedWallet(w.trim());
    setWallet(w.trim());
  };

  const clear = () => {
    clearCachedWallet();
    setWallet("");
  };

  return { wallet, save, clear, isSet: wallet.length >= 32 };
}

export function useCountdown(endIso: string | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endIso) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const ms = new Date(endIso).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endIso]);

  return remaining;
}

export function useRooms(filters: Record<string, string>) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(filters);
    setLoading(true);
    api<Room[]>(`/rooms?${params}`)
      .then(setRooms)
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { rooms, loading };
}
