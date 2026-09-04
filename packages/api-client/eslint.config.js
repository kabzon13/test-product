import { base, noEditGeneratedClient } from '@test/eslint-config';

export default [...base({ tsconfigRootDir: import.meta.dirname }), noEditGeneratedClient];
