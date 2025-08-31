// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types/types.d.ts" />

import 'express-async-errors';

import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

import './sentry/instrument';
import { app } from './app';
import { startServer } from './utils/server';

const TEST_ENABLED = process.env.TEST_ENABLED === 'true';
const TEST_PORT = process.env.TEST_PORT;

const port = TEST_ENABLED && TEST_PORT ? TEST_PORT : process.env.PORT || '8000';
app.set('port', port);

startServer(port, app);
