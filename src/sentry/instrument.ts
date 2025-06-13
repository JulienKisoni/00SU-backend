/* import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { SENTRY_DNS } from '../../private/constants';
import Logger from '../utils/logger';

const TEST_ENABLED = process.env.TEST_ENABLED === 'true';
const LOAD_TEST_ENABLED = process.env.LOAD_TEST_ENABLED === 'true';

if (!TEST_ENABLED && !LOAD_TEST_ENABLED && Sentry) {
  Sentry.init({
    dsn: SENTRY_DNS,
    integrations: [nodeProfilingIntegration()],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
  });
} else {
  Logger.warn('Sentry profiling disabled');
}
 */
