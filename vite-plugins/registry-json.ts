import type { Plugin } from 'vite';
import { getRegistryAsJSON } from '../src/lib/ccs-nodes/registry';
import { getRegistryMetadata } from '../src/lib/ccs-nodes/types';

export function registryJsonPlugin(): Plugin {
  return {
    name: 'registry-json',
    configureServer(server) {
      server.middlewares.use('/registry.json', (_req, res) => {
        const nodes = getRegistryAsJSON();
        const metadata = getRegistryMetadata();

        const registryData = {
          metadata,
          nodes,
        };

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(registryData, null, 2));
      });
    },
  };
}
