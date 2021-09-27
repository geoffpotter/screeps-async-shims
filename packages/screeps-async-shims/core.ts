
import {runPostTickQueues, runPreTickQueues} from './taskQueue'

export let ticksRunning = 0;

export function startTick() {
  runPreTickQueues();
}

export function endTick() {
  runPostTickQueues();
  ticksRunning++;
}

export function wrapLoop(fn:Function) {
  return () => {
    startTick();
    fn();
    endTick();
  }
}