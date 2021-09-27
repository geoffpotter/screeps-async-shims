import { queueTask, queueMicroTask, builtInQueues } from "./taskQueue"

import { uuid } from "screeps-ai-utils";

import {ticksRunning} from './core';

interface timeoutInstance {
  id: string;
  func: Function;
  ticks: number;
  startTick: any;
  cpuUsed: number;
  queueName: string;
}



let timeouts: Map<string, timeoutInstance> = new Map();

function processTimeouts() {
  //let profilerName = "setTimeout:processTimeouts";
  //profiler.startCall(profilerName);


  timeouts.forEach((timeout)=>{
    if (!(timeout.startTick >= 0)) {
      timeout.startTick = 0;
    }
    let ticksSinceStart = ticksRunning - timeout.startTick;
    //compare ticks since start to ticks we were asked to wait.
    //queue task should queue a task to run next tick.
    if (ticksSinceStart >= timeout.ticks) {
      //queue our callback as a microTask to run this tick
      queueMicroTask(timeout.func, timeout.queueName);
      timeouts.delete(timeout.id);
    }
  })

  //add our process back in to the task list. Gotta add every tick if you wanna run next tick.
  //queueTask(processTimeouts);
  //profiler.endCall(profilerName);

  return false;//can return false now to rerun
}

queueTask(processTimeouts, builtInQueues.TICK_INIT);



export function clearTimeout(timeoutId: string) {
  if (timeouts.has(timeoutId)) {
    console.log("deleting timeout:", timeoutId)
    timeouts.delete(timeoutId)
  }
}


export function setTimeout(callback: Function, ticks: number, queueName:string=builtInQueues.TICK_DONE) {
  //let profilerName = "setTimeout";
  //profiler.startCall(profilerName);
  if (!(ticks > -1)) {
    throw new Error("Timeout ticks must be greater than -1!")
  }



  //setup new instance and add it to the array
  let timeoutId = uuid();
  //timeouts[intId] = new timeoutInstance(intId, callback, ticks, getTick());
  timeouts.set(timeoutId, {
    id: timeoutId,
    func: callback,
    ticks: ticks,
    startTick: ticksRunning,
    cpuUsed: 0,
    queueName: queueName
  });
  //profiler.endCall(profilerName);

  return timeoutId;
}
