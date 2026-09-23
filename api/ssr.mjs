// Vercel Function: every request that isn't a static file (see vercel.json)
// is rendered by the Angular SSR server built into dist/.
import { reqHandler } from '../dist/carmexio-web/server/server.mjs';

export default reqHandler;
