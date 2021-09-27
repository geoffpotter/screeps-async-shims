import { queueTask, queueMicroTask, builtInQueues } from "./taskQueue"

import { uuid } from "screeps-ai-utils";

import {ticksRunning} from './core';



interface intervalInstance {
  id: string;
  func: Function;
  ticks: number;
  startTick: any;
  cpuUsed: number;
  queueName: string;
}



let intervals: Map<string, intervalInstance> = new Map();

function processIntervals() {
  //let profilerName = "setInterval:processIntervals";
  //profiler.startCall(profilerName);


  intervals.forEach((interval)=>{
    //starting an interval before loop in arean
    if (!(interval.startTick >= 0)) {
      interval.startTick = 0;
    }
    let ticksSinceStart = ticksRunning - interval.startTick;
    //console.log("checking interval", currentTick, ticksSinceStart)
    //compare ticks since start to ticks we were asked to wait.
    if (ticksSinceStart >= interval.ticks) {
      //queue our callback as a microTask to run this tick
      queueMicroTask(interval.func, interval.queueName);
      //reset "timer"
      interval.startTick = ticksRunning;
    }
  })
  //add our process back in to the task list. Gotta add every tick if you wanna run next tick.
  //queueTask(processIntervals);
  //profiler.endCall(profilerName);

  return false; //can return false to rerun now
}
//check intervals at tick init and schedule microtasks in the proper queue for resolution
queueTask(processIntervals, builtInQueues.TICK_INIT);



export function clearInterval(intervalId: string) {
  if (intervals.has(intervalId)) {
    console.log("deleting interval:", intervalId)
    intervals.delete(intervalId);
  }
}


export function setInterval(callback: Function, ticks: number, queueName:string=builtInQueues.TICK_DONE):string {
  //let profilerName = "setInterval";
  //profiler.startCall(profilerName);
  if (!(ticks > 0)) {
    throw new Error("Interval ticks must be greater than 0!")
  }


  //setup new instance and add it to the array
  let intervalId = uuid();
  //intervals[intId] = new intervalInstance(intId, callback, ticks, getTick());
  intervals.set(intervalId, {
    id: intervalId,
    func: callback,
    ticks: ticks,
    startTick: ticksRunning,
    cpuUsed: 0,
    queueName: queueName
  });
  //profiler.endCall(profilerName);

  return intervalId;
}