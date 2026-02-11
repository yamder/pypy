import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { appParams } from '@/lib/app-params';
import { pagesConfig } from '@/pages.config';

const hasValidBase44Config = () => {
    const appId = appParams.appId;
    if (!appId) return false;
    const normalized = String(appId).trim().toLowerCase();
    return normalized !== '' && normalized !== 'null' && normalized !== 'undefined';
};

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    useEffect(() => {
        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                key => key.toLowerCase() === pathSegment.toLowerCase()
            );
            pageName = matchedKey || null;
        }

        // Only load and call Base44 tracking when config is truly valid.
        // This prevents analytics calls like /api/apps/null/... in Supabase-only deployments.
        if (hasValidBase44Config() && isAuthenticated && pageName) {
            import('@/api/base44Client')
                .then(({ base44 }) => base44.appLogs.logUserInApp(pageName))
                .catch(() => {});
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    return null;
}