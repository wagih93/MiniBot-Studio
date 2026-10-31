import { initializeRobotLab } from './robot-lab.js';
import { registerOfflineSupport } from './features/offline/index.js';
import { createDefaultRuntimeConfig } from './shared/runtime-config.js';

initializeRobotLab(createDefaultRuntimeConfig());
void registerOfflineSupport();
