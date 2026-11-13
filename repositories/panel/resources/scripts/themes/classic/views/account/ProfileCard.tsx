import { useEffect, useState, type FormEvent } from 'react';
import { Avatar, http, httpErrorToHuman, toast, updateCurrentUser, useCurrentUser } from '@/sdk';

const fieldClass = 'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground';
const modeNames = { system: 'System', oled: 'Dark OLED', light: 'Light', legacy: 'Ibis Legacy' } as const;

function validProfile(firstName: string, lastName: string, username: string): boolean {
    return (
        firstName.trim().length > 0 &&
        firstName.length <= 191 &&
        lastName.trim().length > 0 &&
        lastName.length <= 191 &&
        username.length <= 191 &&
        /^[a-z0-9][a-z0-9_.-]+[a-z0-9]$/i.test(username)
    );
}

function profileChanged(
    firstName: string,
    lastName: string,
    username: string,
    user: { firstName?: string; lastName?: string; username: string }
): boolean {
    return firstName !== (user.firstName ?? '') || lastName !== (user.lastName ?? '') || username !== user.username;
}

function saveDisabled(
    changed: boolean,
    valid: boolean,
    busy: boolean,
    usernameChanged: boolean,
    password: string
): boolean {
    return !changed || !valid || busy || (usernameChanged && !password);
}

export default function ProfileCard() {
    const user = useCurrentUser();
    const [firstName, setFirstName] = useState(user.firstName ?? '');
    const [lastName, setLastName] = useState(user.lastName ?? '');
    const [username, setUsername] = useState(user.username);
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const changed = profileChanged(firstName, lastName, username, user);
    const usernameChanged = username.toLowerCase() !== user.username;
    const valid = validProfile(firstName, lastName, username);

    useEffect(() => {
        setFirstName(user.firstName ?? '');
        setLastName(user.lastName ?? '');
        setUsername(user.username);
    }, [user.firstName, user.lastName, user.username]);

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setBusy(true);
        try {
            const body = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                username,
                current_password: usernameChanged ? password : undefined,
            };

            const response = await http.put<{
                attributes: { first_name: string; last_name: string; username: string };
            }>('/api/client/account/profile', body);
            const updated = response.data.attributes;

            updateCurrentUser({
                firstName: updated.first_name,
                lastName: updated.last_name,
                username: updated.username,
            });
            setPassword('');
            toast.success('Profile updated');
        } catch (cause) {
            setError(httpErrorToHuman(cause));
        } finally {
            setBusy(false);
        }
    };

    const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username;
    const mode = user.appearanceMode ? modeNames[user.appearanceMode] : 'Panel default';

    return (
        <section
            className='ibis-account-card overflow-hidden rounded-lg border border-border bg-card'
            aria-label='Account identity'
        >
            <div className='ibis-account-hero flex items-center gap-4 border-b border-border p-5'>
                <span className='h-16 w-16 shrink-0'>
                    <Avatar name={user.uuid} size={64} />
                </span>
                <div className='min-w-0'>
                    <h2 className='truncate font-header text-xl font-semibold'>{displayName}</h2>
                    <p className='text-sm text-muted-foreground'>
                        @{user.username} · {user.rootAdmin ? 'Administrator' : 'User'}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                        Language: {user.language.toUpperCase()} · Appearance: {mode}
                    </p>
                </div>
            </div>
            <form className='space-y-4 p-5' onSubmit={(event) => void save(event)}>
                <h3 className='font-semibold'>Profile information</h3>
                <div className='grid gap-4 sm:grid-cols-2'>
                    <label className='block text-sm'>
                        First name
                        <input
                            className={fieldClass}
                            autoComplete='given-name'
                            maxLength={191}
                            value={firstName}
                            onChange={(event) => setFirstName(event.target.value)}
                            required
                        />
                    </label>
                    <label className='block text-sm'>
                        Last name
                        <input
                            className={fieldClass}
                            autoComplete='family-name'
                            maxLength={191}
                            value={lastName}
                            onChange={(event) => setLastName(event.target.value)}
                            required
                        />
                    </label>
                </div>
                <label className='block text-sm'>
                    Username
                    <input
                        className={fieldClass}
                        aria-label='Username'
                        autoComplete='username'
                        maxLength={191}
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        required
                    />
                    <span className='mt-1 block text-xs text-muted-foreground'>
                        Usernames are stored lowercase. Use letters, numbers, dots, dashes or underscores.
                    </span>
                </label>
                {usernameChanged && (
                    <label className='block text-sm'>
                        Current password to change username
                        <input
                            className={fieldClass}
                            type='password'
                            autoComplete='current-password'
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </label>
                )}
                {error && (
                    <p role='alert' className='text-sm text-destructive'>
                        {error}
                    </p>
                )}
                <button
                    type='submit'
                    disabled={saveDisabled(changed, valid, busy, usernameChanged, password)}
                    className='rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50'
                >
                    {busy ? 'Saving…' : 'Save profile'}
                </button>
            </form>
        </section>
    );
}
