import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { normalizePanelSounds, type UserData } from '@/api/account/types';
import { getBootstrapUser } from '@/bootstrap';
import {
    clientUpdateAccountEmailMutation,
    clientUpdateAccountPasswordMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import { clientGetAccount, type ClientUserResource } from '@/api/generated';
import { notifyHttpError } from '@/plugins/notifications';

export const currentUserQueryKey = ['account', 'current-user'] as const;

type CurrentUserUpdater = Partial<UserData>;

const getBootstrapCurrentUser = (): UserData => {
    const user = getBootstrapUser();

    if (!user) {
        throw new Error('Current user has not been hydrated.');
    }

    return user;
};

/** Keeps the fields the account endpoint does not return. */
const withAccount = (user: UserData, { attributes }: ClientUserResource): UserData => ({
    ...user,
    username: attributes.username,
    firstName: attributes.first_name,
    lastName: attributes.last_name,
    email: attributes.email,
    language: attributes.language,
    appearanceMode: (['system', 'oled', 'light', 'legacy'].includes(attributes.appearance_mode ?? '')
        ? attributes.appearance_mode
        : null) as UserData['appearanceMode'],
    soundPreferences: normalizePanelSounds(attributes.sound_preferences),
    rootAdmin: attributes.admin,
});

export const currentUserQueryOptions = () =>
    queryOptions({
        queryKey: currentUserQueryKey,
        queryFn: async ({ client, signal }): Promise<UserData> => {
            const { data } = await clientGetAccount({ signal });

            return withAccount(client.getQueryData<UserData>(currentUserQueryKey) ?? getBootstrapCurrentUser(), data);
        },
        initialData: getBootstrapCurrentUser,
        staleTime: Infinity,
    });

export const useCurrentUser = () => useQuery(currentUserQueryOptions()).data;

export const setCurrentUserQueryData = (queryClient: QueryClient, updater: CurrentUserUpdater) => {
    queryClient.setQueryData<UserData>(currentUserQueryKey, (user) => {
        const current = user ?? getBootstrapCurrentUser();

        return { ...current, ...updater };
    });
};

export const useUpdateAccountEmail = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...clientUpdateAccountEmailMutation(),
        onSuccess: (_data, variables) => {
            setCurrentUserQueryData(queryClient, { email: variables.body.email });
            toast.success('Email address updated');
        },
        onError: (error) => notifyHttpError(error, 'Unable to update email address'),
    });
};

export const useUpdateAccountPassword = () =>
    useMutation({
        ...clientUpdateAccountPasswordMutation(),
        onSuccess: () => window.location.assign('/auth/login'),
        onError: (error) => notifyHttpError(error, 'Unable to update password'),
    });
