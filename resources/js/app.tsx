import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = import.meta.env.VITE_APP_NAME || 'ArchiteX';

import { route } from 'ziggy-js';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Standard Ziggy initialization for Inertia
        const ziggyConfig = (props.initialPage.props as any).ziggy || (window as any).Ziggy;
        
        // @ts-expect-error
        window.route = (name, params, absolute, config = ziggyConfig) => route(name, params, absolute, config);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#06b6d4',
        showSpinner: true,
    },
});

