/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_NAME: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
    glob(pattern: string, options?: { eager?: boolean }): Record<string, any>;
}

import { Config, RouteParam, RouteParamsWithQueryOverload } from 'ziggy-js';

declare global {
    var route: ((
        name?: string,
        params?: RouteParamsWithQueryOverload | RouteParam,
        absolute?: boolean,
        config?: Config,
    ) => any) & {
        current: (name?: string, params?: RouteParamsWithQueryOverload | RouteParam, config?: Config) => boolean;
        check: (name?: string, params?: RouteParamsWithQueryOverload | RouteParam, config?: Config) => boolean;
        params: any;
    };
}

