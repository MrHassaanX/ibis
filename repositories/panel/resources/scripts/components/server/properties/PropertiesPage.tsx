import { useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, FileText, RotateCcw, Save, Search } from 'lucide-react';
import { httpErrorToHuman } from '@/api/http';
import { readProperties, writeProperties, type PropertiesFile } from '@/api/server/properties';
import { useCurrentServer } from '@/api/server/queries';
import { relationshipData } from '@/api/relationships';
import Button from '@/components/elements/Button';
import Card from '@/components/elements/Card';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Switch from '@/components/ui/Switch';
import { encodePathSegments } from '@/helpers';
import {
    applyPropertyChanges,
    parseProperties,
    PROPERTY_CATEGORIES,
    PROPERTY_DEFINITIONS,
    validateProperty,
    type PropertyCategory,
    type PropertyDefinition,
} from '@/lib/minecraftProperties';
import { useNavigationBlocker } from '@/plugins/useNavigationBlocker';
import { usePermissions } from '@/plugins/usePermissions';

const inputClass =
    'w-full min-h-10 rounded-md border border-input-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60';
const definitions = new Map(PROPERTY_DEFINITIONS.map((definition) => [definition.key, definition]));

function optionLabel(option: string): string {
    if (option === 'true') {
        return 'Enabled';
    }

    if (option === 'false') {
        return 'Disabled';
    }

    return option;
}

function PropertyControl({
    definition,
    value,
    onChange,
    disabled,
    id,
}: {
    definition: PropertyDefinition;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    id: string;
}) {
    if (definition.field === 'boolean' && (value === 'true' || value === 'false')) {
        return (
            <div className='flex min-h-10 items-center gap-3'>
                <Switch
                    id={id}
                    aria-label={definition.label}
                    checked={value === 'true'}
                    disabled={disabled}
                    onChange={(checked) => onChange(checked ? 'true' : 'false')}
                />
                <span className='text-sm text-muted-foreground'>{value === 'true' ? 'Enabled' : 'Disabled'}</span>
            </div>
        );
    }

    if (definition.field === 'select' || definition.field === 'boolean') {
        const options = definition.field === 'boolean' ? ['true', 'false'] : (definition.options ?? []);

        return (
            <select
                id={id}
                className={inputClass}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {optionLabel(option)}
                    </option>
                ))}
                {!options.includes(value) && <option value={value}>{value} (custom)</option>}
            </select>
        );
    }

    return (
        <input
            id={id}
            className={inputClass}
            type={definition.field === 'number' ? 'number' : 'text'}
            min={definition.min}
            max={definition.max}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}

function Setting({
    definition,
    value,
    onChange,
    disabled,
    error,
}: {
    definition: PropertyDefinition;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    error: string | null;
}) {
    const id = `property-${definition.key}`;

    return (
        <div className='flex min-w-0 flex-col justify-between gap-4 rounded-md border border-border bg-background/30 p-4'>
            <div>
                <label htmlFor={id} className='font-medium text-sm'>
                    {definition.label}
                </label>
                <p className='mt-1 text-xs text-muted-foreground'>{definition.description}</p>
                <code className='text-xs text-muted-foreground'>{definition.key}</code>
                {definition.warning && (
                    <p className='mt-2 text-xs text-warning'>
                        <AlertTriangle size={13} className='mr-1 inline' />
                        {definition.warning}
                    </p>
                )}
            </div>
            <div>
                <PropertyControl
                    definition={definition}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    id={id}
                />
                {error && (
                    <p role='alert' className='mt-1 text-xs text-destructive'>
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}

// oxlint-disable-next-line complexity -- The page combines loading, permission, validation, and conflict states.
export default function PropertiesPage() {
    const server = useCurrentServer();
    const [canRead, canUpdate] = usePermissions(['file.read', 'file.update']);
    const uuid = server?.attributes.uuid ?? '';
    const id = server?.attributes.identifier ?? '';
    const supported =
        !!server?.attributes.capabilities.includes('minecraft.properties') && !!server.attributes.properties_file;
    const queryClient = useQueryClient();
    const queryKey = useMemo(() => ['minecraft-properties', uuid], [uuid]);
    const file = useQuery({
        queryKey,
        queryFn: () => readProperties(uuid),
        enabled: !!uuid && supported && canRead,
        retry: false,
        refetchOnWindowFocus: false,
    });
    const [category, setCategory] = useState<PropertyCategory>('General');
    const [search, setSearch] = useState('');
    const [changes, setChanges] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [conflict, setConflict] = useState(false);
    const parsed = useMemo(() => parseProperties(file.data?.content ?? ''), [file.data?.content]);
    const editable = parsed.properties.filter((property) => property.editable && definitions.has(property.key));
    const dirty = editable.some(
        (property) => changes[property.key] !== undefined && changes[property.key] !== property.value
    );
    const errors = Object.fromEntries(
        editable.map((property) => {
            const definition = definitions.get(property.key)!;

            return [
                property.key,
                changes[property.key] !== undefined && changes[property.key] !== property.value
                    ? validateProperty(definition, changes[property.key])
                    : null,
            ];
        })
    );
    const invalid = Object.values(errors).some(Boolean);

    useNavigationBlocker(dirty);

    const reload = async () => {
        setChanges({});
        setConflict(false);
        setSaveError(null);
        await file.refetch();
    };

    const save = async () => {
        if (!file.data || !dirty || invalid || !canUpdate || saving) {
            return;
        }

        setSaving(true);
        setSaveError(null);
        setConflict(false);
        const content = applyPropertyChanges(file.data.content, changes);

        try {
            const result = await writeProperties(uuid, content, file.data.hash);

            queryClient.setQueryData<PropertiesFile>(queryKey, { ...file.data, content, hash: result.hash });
            setChanges({});
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                setConflict(true);
            } else {
                setSaveError(httpErrorToHuman(error));
            }
        } finally {
            setSaving(false);
        }
    };

    const term = search.trim().toLocaleLowerCase();
    const visible = editable.filter((property) => {
        const definition = definitions.get(property.key)!;

        return term
            ? `${definition.label} ${definition.key} ${definition.description}`.toLocaleLowerCase().includes(term)
            : definition.category === category;
    });
    const raw = parsed.properties.filter((property) => !definitions.has(property.key) || !property.editable);
    const primaryPort = relationshipData(server?.attributes.relationships?.allocations).find(
        (allocation) => allocation.attributes.is_default
    )?.attributes.port;

    return (
        <ServerContentBlock title='Properties'>
            <div className='space-y-4'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                        <h1 className='text-2xl font-semibold'>Minecraft Properties</h1>
                        <p className='text-sm text-muted-foreground'>
                            Edit settings in the server’s existing server.properties file.
                        </p>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        <Button
                            isSecondary
                            disabled={!dirty || saving}
                            onClick={() => {
                                setChanges({});
                                setSaveError(null);
                            }}
                        >
                            <RotateCcw size={15} className='mr-2 inline' />
                            Revert
                        </Button>
                        <Button
                            disabled={!dirty || invalid || saving || !canUpdate}
                            isLoading={saving}
                            onClick={() => void save()}
                        >
                            <Save size={15} className='mr-2 inline' />
                            Save changes
                        </Button>
                    </div>
                </div>
                {dirty && (
                    <p role='status' className='text-sm text-warning'>
                        Unsaved changes
                    </p>
                )}
                {changes['server-port'] !== undefined &&
                    primaryPort !== undefined &&
                    Number(changes['server-port']) !== primaryPort && (
                        <p role='alert' className='text-sm text-warning'>
                            The server port differs from the primary allocation ({primaryPort}). Saving properties will
                            not change the panel allocation.
                        </p>
                    )}
                {!supported && (
                    <Card>
                        <p role='alert' className='p-5 text-sm'>
                            This server’s Egg does not provide a supported Java server.properties file.
                        </p>
                    </Card>
                )}
                {supported && !canRead && (
                    <Card>
                        <p role='alert' className='p-5 text-sm'>
                            You need file read permission to view properties.
                        </p>
                    </Card>
                )}
                {file.isPending && supported && canRead && (
                    <Card loading>
                        <p className='p-5'>Loading server.properties…</p>
                    </Card>
                )}
                {file.error && (
                    <Card>
                        <div className='p-5 text-sm'>
                            <p role='alert'>{httpErrorToHuman(file.error)}</p>
                            <p className='mt-2 text-muted-foreground'>
                                The file may not exist yet. Start the Minecraft server to generate it, then reload. No
                                file was created.
                            </p>
                            <Button className='mt-3' isSecondary onClick={() => void reload()}>
                                Retry
                            </Button>
                        </div>
                    </Card>
                )}
                {conflict && (
                    <Card>
                        <div role='alert' className='p-5 text-sm text-warning'>
                            The file changed on the server. Reload it before saving. Your unsaved values remain on this
                            page until you reload.
                            <Button className='ml-3' isSecondary onClick={() => void reload()}>
                                Reload file
                            </Button>
                        </div>
                    </Card>
                )}
                {saveError && (
                    <p role='alert' className='text-sm text-destructive'>
                        {saveError}
                    </p>
                )}
                {file.data && (
                    <>
                        <Card
                            title='Settings'
                            actions={<span className='text-xs text-muted-foreground'>{file.data.path}</span>}
                        >
                            <div className='relative mb-4'>
                                <Search size={16} className='absolute left-3 top-3 text-muted-foreground' />
                                <input
                                    aria-label='Search properties'
                                    className={`${inputClass} pl-9`}
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder='Search settings…'
                                />
                            </div>
                            <div
                                className='flex flex-wrap gap-2 border-b border-border pb-3'
                                role='tablist'
                                aria-label='Property categories'
                            >
                                {PROPERTY_CATEGORIES.map((item) => (
                                    <button
                                        key={item}
                                        role='tab'
                                        aria-selected={category === item && !term}
                                        className={`rounded-md px-3 py-2 text-sm ${category === item && !term ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => {
                                            setCategory(item);
                                            setSearch('');
                                        }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                            {visible.length ? (
                                <>
                                    <p className='py-3 text-xs text-muted-foreground'>
                                        {term
                                            ? `Search results: ${visible.length}`
                                            : `${category} settings: ${visible.length}`}
                                    </p>
                                    <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
                                        {visible.map((property) => (
                                            <Setting
                                                key={property.line}
                                                definition={definitions.get(property.key)!}
                                                value={changes[property.key] ?? property.value}
                                                onChange={(value) =>
                                                    setChanges((current) => ({ ...current, [property.key]: value }))
                                                }
                                                disabled={!canUpdate || saving}
                                                error={errors[property.key]}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className='py-8 text-center text-sm text-muted-foreground'>
                                    No settings in this group match the current file.
                                </p>
                            )}
                        </Card>
                        <Card title='Advanced / Raw file' icon={FileText}>
                            <p className='text-sm text-muted-foreground'>
                                Unknown, custom, duplicate and complex lines are preserved. Use the existing file editor
                                to edit the full text.
                            </p>
                            {parsed.warnings.length > 0 && (
                                <ul className='mt-3 space-y-1 text-xs text-warning'>
                                    {parsed.warnings.map((warning) => (
                                        <li key={warning}>{warning}</li>
                                    ))}
                                </ul>
                            )}
                            {raw.length > 0 && (
                                <p className='mt-3 text-xs text-muted-foreground'>
                                    {raw.length} setting(s) available in the raw file editor.
                                </p>
                            )}
                            <details className='mt-3 text-xs'>
                                <summary className='cursor-pointer'>Preview full file</summary>
                                <pre className='mt-2 max-h-72 overflow-auto rounded bg-muted p-3 whitespace-pre-wrap break-all'>
                                    {file.data.content}
                                </pre>
                            </details>
                            <Link
                                className='mt-3 inline-block text-sm text-primary underline'
                                to='/server/$id/files/$action'
                                params={{ id, action: 'edit' }}
                                hash={encodePathSegments(file.data.path)}
                            >
                                Open server.properties in Files
                            </Link>
                        </Card>
                        <p className='text-xs text-muted-foreground'>
                            Some changes take effect only after a manual server restart. Saving does not restart the
                            server. The panel checks for external edits before writing; simultaneous writes cannot be
                            made atomic by the Wings file API.
                        </p>
                    </>
                )}
            </div>
        </ServerContentBlock>
    );
}
