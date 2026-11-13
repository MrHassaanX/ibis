import { useEffect, useState } from 'react';
import { Layers, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, UserCog } from 'lucide-react';
import {
    Avatar,
    DropdownMenu,
    Icon,
    NamedIcon,
    PanelLink,
    SpinnerOverlay,
    Tooltip,
    http,
    httpErrorToHuman,
    toast,
    usePersistedState,
} from '@/sdk';
import {
    Main,
    Navigation,
    NavigationLink,
    Slot,
    View,
    type AppLayoutLink,
    type AppLayoutModel,
    type NavigationModel,
    type ViewProps,
} from '@/sdk/theme';
import { chooseAppearanceMode, currentAppearanceMode, panelAppearance, type AppearanceMode } from '../appearance';

const navItemClass = [
    'flex h-full shrink-0 items-center px-3 sm:px-6 no-underline text-muted-foreground cursor-pointer',
    'transition-[background-color,border-color,color,box-shadow] duration-150 hover:bg-popover hover:border-border active:bg-popover/80',
    'hover:text-foreground active:text-foreground',
    'hover:shadow-navigation-active active:shadow-navigation-active',
    'data-[status=active]:shadow-navigation-active',
].join(' ');

const modeLabels = { system: 'System', oled: 'Dark OLED', light: 'Light', legacy: 'Ibis Legacy' } as const;

function LinkIcon({ link, user }: { link: AppLayoutLink; user: AppLayoutModel['user'] }) {
    if (link.id === 'account') {
        return (
            <span className='flex items-center w-5 h-5'>
                <Avatar name={user.uuid} />
            </span>
        );
    }

    return <Icon icon={link.id === 'admin' ? UserCog : Layers} />;
}

/** Only rendered when the theme offers more than one scheme. */
function SchemeMenu({
    model,
    setScheme,
}: {
    model: AppLayoutModel;
    setScheme: NonNullable<AppLayoutModel['setScheme']>;
}) {
    const [mode, setMode] = useState<AppearanceMode>(currentAppearanceMode);
    const [saving, setSaving] = useState(false);
    const appearance = panelAppearance();

    if (appearance.allow_user_override === false) {
        return null;
    }

    return (
        <DropdownMenu
            triggerClassName={navItemClass}
            triggerContent={
                <>
                    <Icon icon={model.scheme === 'light' ? Sun : Moon} aria-hidden />
                    <span className='sr-only'>Color scheme</span>
                </>
            }
        >
            {(appearance.available_modes ?? ['system', 'oled', 'light', 'legacy']).map((choice) => (
                <DropdownMenu.Item
                    key={choice}
                    checked={choice === mode}
                    disabled={saving}
                    onClick={async () => {
                        setSaving(true);
                        try {
                            await http.put('/api/client/account/preferences', { appearance_mode: choice });
                            chooseAppearanceMode(choice, setScheme);
                            setMode(choice);
                        } catch (error) {
                            toast.error(httpErrorToHuman(error));
                        } finally {
                            setSaving(false);
                        }
                    }}
                >
                    {modeLabels[choice]}
                </DropdownMenu.Item>
            ))}
        </DropdownMenu>
    );
}

// oxlint-disable-next-line eslint/complexity -- The shared header adapts to server, admin and top-navigation modes.
function NavigationBar({
    model,
    leftMode,
    showMobileMenu,
    toggleMenu,
}: {
    model: AppLayoutModel;
    leftMode: boolean;
    showMobileMenu: boolean;
    toggleMenu: () => void;
}) {
    const appearance = panelAppearance();
    const navLogo = model.scheme === 'light' ? appearance.assets?.nav_logo_light : appearance.assets?.nav_logo;

    return (
        <div className='ibis-app-topbar w-full overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden'>
            <SpinnerOverlay visible={model.signingOut} />
            <div className='mx-auto flex h-14 w-full max-w-panel items-center'>
                {leftMode && showMobileMenu && (
                    <button
                        type='button'
                        className='ml-3 rounded-md p-2 lg:hidden'
                        aria-label='Open navigation'
                        onClick={toggleMenu}
                    >
                        <Icon icon={Menu} />
                    </button>
                )}
                {!leftMode && (
                    <div id='logo' className='flex-1 min-w-0'>
                        <PanelLink
                            destination={{ to: '/' }}
                            className='flex items-center gap-2 truncate text-xl sm:text-2xl font-header font-medium px-4 no-underline text-foreground hover:text-accent transition-colors duration-150'
                        >
                            <img
                                src={navLogo ?? '/brand/ibis-icon-192.png'}
                                alt=''
                                className='h-8 w-8 shrink-0 object-contain'
                            />
                            <span className='truncate'>{model.brand.name}</span>
                        </PanelLink>
                    </div>
                )}
                {leftMode && (
                    <div id='logo' className='ibis-mobile-brand min-w-0 flex-1 lg:hidden'>
                        <PanelLink
                            destination={{ to: '/' }}
                            className='flex items-center gap-2 truncate no-underline text-foreground'
                        >
                            <img
                                src={navLogo ?? '/brand/ibis-icon-192.png'}
                                alt=''
                                className='h-7 w-7 shrink-0 object-contain'
                            />
                            <span className='truncate font-header font-semibold'>{model.brand.name}</span>
                        </PanelLink>
                    </div>
                )}
                {leftMode && (
                    <div className='ibis-header-search-wrap hidden min-w-0 flex-1 lg:flex'>
                        <View name='app.search' className='ibis-header-search' />
                    </div>
                )}
                <div className={`flex h-full items-center justify-center ${leftMode ? 'ml-auto' : 'shrink-0'}`}>
                    <Slot name='nav.items.before' />
                    {!leftMode && <View name='app.search' className={navItemClass} />}
                    {leftMode && (
                        <div className='lg:hidden'>
                            <View name='app.search' className={navItemClass} />
                        </div>
                    )}
                    {!leftMode &&
                        model.links.map((link) => (
                            <Tooltip key={link.id} placement='bottom' content={link.label}>
                                <PanelLink
                                    destination={link.destination}
                                    exact={link.exact}
                                    className={navItemClass}
                                    aria-label={link.label}
                                >
                                    <LinkIcon link={link} user={model.user} />
                                </PanelLink>
                            </Tooltip>
                        ))}
                    {model.setScheme && <SchemeMenu model={model} setScheme={model.setScheme} />}
                    {leftMode &&
                        model.links
                            .filter((link) => link.id === 'account')
                            .map((link) => (
                                <Tooltip key={link.id} placement='bottom' content={link.label}>
                                    <PanelLink
                                        destination={link.destination}
                                        className={navItemClass}
                                        aria-label={link.label}
                                    >
                                        <LinkIcon link={link} user={model.user} />
                                    </PanelLink>
                                </Tooltip>
                            ))}
                    <Tooltip placement='bottom' content='Sign Out'>
                        <button type='button' aria-label='Sign Out' onClick={model.signOut} className={navItemClass}>
                            <Icon icon={LogOut} />
                        </button>
                    </Tooltip>
                    <Slot name='nav.items.after' />
                </div>
            </div>
        </div>
    );
}

function AreaNavigation({ nav, close }: { nav: NavigationModel; close: () => void }) {
    const groups = nav.items.reduce<Record<string, typeof nav.items>>((result, item) => {
        const group = item.group ?? 'Other';

        result[group] = [...(result[group] ?? []), item];

        return result;
    }, {});
    const order = [
        'General',
        'Management',
        'Minecraft',
        ...Object.keys(groups).filter((group) => !['General', 'Management', 'Minecraft'].includes(group)),
    ].filter((group) => groups[group]?.length);

    return (
        <nav aria-label='Area navigation' className='flex flex-col gap-1 p-2'>
            {order.map((group) => (
                <div key={group} className='ibis-side-group'>
                    {group !== 'General' && <h2 className='ibis-side-heading'>{group}</h2>}
                    <Navigation items={groups[group]}>
                        {(item, state) => (
                            <NavigationLink
                                item={item}
                                key={item.id}
                                title={item.label}
                                className='ibis-side-link'
                                aria-label={item.label}
                                onClick={close}
                            >
                                {item.icon && <NamedIcon name={item.icon} size={17} className='shrink-0' aria-hidden />}
                                <span className='ibis-side-text'>{item.label}</span>
                                {state.badge}
                            </NavigationLink>
                        )}
                    </Navigation>
                </div>
            ))}
        </nav>
    );
}

function activeAreaNavigation(model: AppLayoutModel): NavigationModel | null {
    return model.area.kind === 'server' || model.area.kind === 'account' ? model.area.nav : null;
}

function sidebarLogo(model: AppLayoutModel): string | null | undefined {
    const assets = panelAppearance().assets;

    return model.scheme === 'light' ? assets?.nav_logo_light : assets?.nav_logo;
}

// oxlint-disable-next-line eslint/complexity -- The existing shell preserves responsive and permission-aware navigation.
export default function AppLayout({ model, className, children }: ViewProps<'layout.app'>) {
    const leftMode = panelAppearance().navigation_position === 'left' && model.area.kind !== 'admin';
    const adminSidebarMode = panelAppearance().navigation_position === 'left' && model.area.kind === 'admin';
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsedSetting, setCollapsed] = usePersistedState('ibis:sidebar-collapsed-e5', false);
    const collapsed = collapsedSetting ?? false;
    const areaNav = activeAreaNavigation(model);
    const navLogo = sidebarLogo(model);

    useEffect(() => {
        if (!mobileOpen) {
            return;
        }

        const close = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMobileOpen(false);
            }
        };

        window.addEventListener('keydown', close);

        return () => window.removeEventListener('keydown', close);
    }, [mobileOpen]);

    return (
        <div
            className={`${className ?? ''} ${leftMode ? 'ibis-app-frame' : ''} ${adminSidebarMode ? 'ibis-admin-frame' : ''}`}
        >
            <NavigationBar
                model={model}
                leftMode={leftMode || adminSidebarMode}
                showMobileMenu={!adminSidebarMode}
                toggleMenu={() => setMobileOpen((open) => !open)}
            />
            {leftMode ? (
                <div className='ibis-app-with-sidebar'>
                    {mobileOpen && (
                        <button
                            type='button'
                            className='ibis-sidebar-scrim'
                            aria-label='Close navigation'
                            onClick={() => setMobileOpen(false)}
                        />
                    )}
                    <aside
                        className={`ibis-app-sidebar ${mobileOpen ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}
                        aria-label='Panel navigation'
                    >
                        <div className='flex items-center justify-between gap-2 px-3 py-3'>
                            <PanelLink
                                destination={{ to: '/' }}
                                className='flex min-w-0 items-center gap-2 text-foreground no-underline'
                                title={model.brand.name}
                            >
                                <img
                                    src={navLogo ?? '/brand/ibis-icon-192.png'}
                                    alt=''
                                    className='h-8 w-8 shrink-0 object-contain'
                                />
                                <strong className='ibis-sidebar-brand-name truncate text-base'>
                                    {model.brand.name}
                                </strong>
                            </PanelLink>
                            <button
                                type='button'
                                className='hidden rounded-md p-2 text-muted-foreground hover:bg-popover hover:text-foreground lg:block'
                                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                onClick={() => setCollapsed((value) => !value)}
                            >
                                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                            </button>
                        </div>
                        <div className='ibis-sidebar-scroll'>
                            <nav aria-label='Main navigation' className='flex flex-col gap-1 p-2'>
                                <h2 className='ibis-side-heading'>General</h2>
                                {model.links
                                    .filter((link) => link.id === 'dashboard')
                                    .map((link) => (
                                        <PanelLink
                                            key={link.id}
                                            destination={link.destination}
                                            exact={link.exact}
                                            title={link.label}
                                            className='ibis-side-link'
                                            aria-label={link.label}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <LinkIcon link={link} user={model.user} />
                                            <span className='ibis-side-text'>{link.label}</span>
                                        </PanelLink>
                                    ))}
                            </nav>
                            {areaNav && <AreaNavigation nav={areaNav} close={() => setMobileOpen(false)} />}
                            <nav
                                aria-label='Account navigation'
                                className='mt-auto flex flex-col gap-1 border-t border-border p-2'
                            >
                                {model.links
                                    .filter((link) => link.id !== 'dashboard')
                                    .map((link) => (
                                        <PanelLink
                                            key={link.id}
                                            destination={link.destination}
                                            exact={link.exact}
                                            title={link.label}
                                            className='ibis-side-link'
                                            aria-label={link.label}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <LinkIcon link={link} user={model.user} />
                                            <span className='ibis-side-text'>{link.label}</span>
                                        </PanelLink>
                                    ))}
                            </nav>
                        </div>
                    </aside>
                    <div className='min-w-0 flex-1'>
                        <Main>{children}</Main>
                    </div>
                </div>
            ) : (
                <Main>{children}</Main>
            )}
        </div>
    );
}
