// src/types/capacitor-plugins.d.ts
declare module '@capgo/background-geolocation' {
  export interface Location {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number | null;
    bearing: number | null;
    time: number;
    altitude: number | null;
  }

  export interface WatcherOptions {
    backgroundMessage: string;
    backgroundTitle: string;
    requestPermissions: boolean;
    stale: boolean;
    distanceFilter: number;
    interval?: number;
    fastestInterval?: number;
    priority?: number;
  }

  export const BackgroundGeolocation: {
    addWatcher(
      options: WatcherOptions,
      callback: (location: Location | null, error: Error | null) => void
    ): Promise<string>;
    removeWatcher(options: { id: string }): Promise<void>;
    start(options?: Partial<WatcherOptions>): Promise<void>;
    stop(): Promise<void>;
  };
}
