import { base, noNextApiRoutes } from '@test/eslint-config';

export default [...base({ tsconfigRootDir: import.meta.dirname }), noNextApiRoutes];
