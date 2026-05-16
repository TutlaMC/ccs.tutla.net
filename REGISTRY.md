# CCS Node Registry JSON Endpoint

The entire CCS node registry is now available as a JSON endpoint, allowing external tools and documentation to consume the complete syntax reference.

## Endpoint

- **URL**: `/registry.json`
- **Method**: `GET`
- **Content-Type**: `application/json`
- **Dev**: `http://localhost:5173/registry.json`
- **Prod**: `https://ccs.tutla.net/registry.json` (or your production domain)

## Response Format

```json
{
  "metadata": {
    "categories": {
      "module": "MODULE",
      "event": "EVENT",
      "flow": "FLOW",
      "condition": "CONDITION",
      "client": "CLIENT",
      "macro": "MACRO",
      "packet": "PACKET",
      "unknown": "UNKNOWN"
    },
    "categoryColors": { /* ... */ },
    "categoryDescriptions": { /* ... */ },
    "events": [ /* list of event names */ ],
    "conditions": [ /* list of condition names */ ],
    "conditionArgShapes": { /* ... */ },
    "handleTypeColors": { /* ... */ }
  },
  "nodes": [
    {
      "command": "def_module",
      "label": "Module",
      "description": "Declares a custom CCS module",
      "category": "module",
      "argHints": [ /* ... */ ],
      "inputs": [ /* ... */ ],
      "outputs": [ /* ... */ ],
      "palette": true
    },
    /* ... 45 more nodes ... */
  ]
}
```

## Usage Examples

### Fetch all nodes
```javascript
const response = await fetch('/registry.json');
const { metadata, nodes } = await response.json();
console.log(`Total nodes: ${nodes.length}`);
```

### Filter by category
```javascript
const response = await fetch('/registry.json');
const { nodes } = await response.json();
const flowNodes = nodes.filter(n => n.category === 'flow');
```

### Get all events
```javascript
const response = await fetch('/registry.json');
const { metadata } = await response.json();
console.log(metadata.events);
```

## Implementation Details

- **Dev Mode**: The endpoint is served dynamically via a Vite plugin (`vite-plugins/registry-json.ts`)
- **Functions**: 
  - `getRegistryAsJSON()` - Converts NODE_REGISTRY to JSON-safe format
  - `getRegistryMetadata()` - Exports all metadata (categories, events, conditions, etc.)
- **Source Files**:
  - Node definitions: `src/lib/ccs-nodes/registry.ts`
  - Types & metadata: `src/lib/ccs-nodes/types.ts`
