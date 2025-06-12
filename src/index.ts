/// <reference path="./types/types.d.ts" />

import 'express-async-errors';

import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

import './sentry/instrument';
import { app } from './app';
import { startServer } from './utils/server';

const port = process.env.PORT || '8000';
app.set('port', port);

startServer(port, app);
