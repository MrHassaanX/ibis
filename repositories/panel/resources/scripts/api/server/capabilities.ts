import type { Server } from './types';

export const SERVER_CAPABILITIES = [
    'minecraft.java',
    'minecraft.bedrock',
    'minecraft.properties',
    'minecraft.plugins',
    'minecraft.mods',
    'service.http',
    'service.background-worker',
] as const;

export type ServerCapability = (typeof SERVER_CAPABILITIES)[number];

export const hasServerCapability = (server: Server | undefined, capability: ServerCapability): boolean =>
    server?.attributes.capabilities.includes(capability) ?? false;
