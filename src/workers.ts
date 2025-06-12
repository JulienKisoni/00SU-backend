import cluster from 'cluster';
import os from 'os';
import { EventEmitter } from 'node:events';

import Logger from './utils/logger';

const eventEmitter = new EventEmitter();
const cpuCount = os.cpus().length;

cluster.setupPrimary({
  exec: __dirname + '/index.ts',
});

if (cluster.isPrimary) {
  Logger.warn(`The total number of CPUs is ${cpuCount}`);
  Logger.info(`Primary pid=${process.pid}`);

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }
  eventEmitter.on('PING', () => {
    const workers = Object.keys(cluster.workers || {});
    Logger.info(`Current running workers ${workers.length}`);
  });
}

cluster.on('exit', (worker) => {
  Logger.error(`worker ${worker.process.pid} has been killed`);
  eventEmitter.emit('PING');
  Logger.info('Starting another worker');
  cluster.fork();
});

cluster.on('listening', () => {
  eventEmitter.emit('PING');
});
