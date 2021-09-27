

import { addInPriorityOrder, FunctionQueueArray, FunctionQueueSet} from "screeps-ai-utils";


//used for internal tick count so we dont' need game.time
export let ticksRunning = 0;

export enum tickPhases {
  PRE_TICK,
  POST_TICK
}

export class taskQueue {

  private tasks:FunctionQueueArray = new FunctionQueueArray()
  private microTasks: FunctionQueueSet = new FunctionQueueSet();

  name: string;
  tickPhase: tickPhases;
  /**
   * high priority queues go first.
   */
  priority: number = 0;

  constructor(name: string, priority: number = 0, tickPhase: tickPhases = tickPhases.POST_TICK) {
    this.name = name;
    this.tickPhase = tickPhase;
    this.priority = priority;
    addQueue(this);

  }

  queueTask(task:Function) {
    this.tasks.addFunc(task);
  }
  queueMicroTask(microTask:Function) {
    this.microTasks.addFunc(microTask);
  }

  run() {
    console.log("running queue", this.name)
    this.runTasks();
    this.runMicroTasks();
  }
  private runTasks() {
    this.tasks.processCurrentQueueWithDone();
  }


  private runMicroTasks() {
    this.microTasks.processFullQueue();
  }

}


let preTickQueues = new Array<taskQueue>();
let postTickQueues = new Array<taskQueue>();
let queueLookup = new Map<string, taskQueue>();

export enum builtInQueues {
  TICK_INIT="tickInit", // create everything
  TICK_DONE="tickDone",
}

enum TaskPriorities {
  FIRST = 10000,
  DEFAULT = 0,
  LAST = -10000
}

let tickInitQueue = new taskQueue(builtInQueues.TICK_INIT, TaskPriorities.FIRST, tickPhases.PRE_TICK);
let tickDoneQueue = new taskQueue(builtInQueues.TICK_DONE, TaskPriorities.LAST, tickPhases.POST_TICK);


let currentQueue:taskQueue|false = false;



/**
 * Queue a Microtask to be executed inbetween or after tasks, as cpu allows
 *
 * These run first at the end of the main loop, then again inbetween tasks.
 */
export function queueMicroTask(microTask:Function, queue:string|taskQueue|false=false) {
  if(queue===false) {
    if(currentQueue) {
      queue = currentQueue;
    } else {
      queue = tickDoneQueue;
    }
  } else if(!(queue instanceof taskQueue)) {
    //string name for queue, check our built in queues first
    // (mostly just to use the objects so ts doesn't think they're unused)
    if(queue == tickInitQueue.name) {
      queue = tickInitQueue;
    } else if (queue == tickDoneQueue.name) {
      queue = tickDoneQueue;
    } else {
      queue = getQueue(queue);
    }
  }
  queue.queueMicroTask(microTask);
}

/**
 * Queue a Task to be executed at the end of the tick, as cpu allows
 *
 * These run at the end of the tick, after the microtasks are run.
 */
export function queueTask(task:Function, queue:string|taskQueue|false=false) {
  if(queue===false) {
    if(currentQueue) {
      queue = currentQueue;
    } else {
      queue = tickDoneQueue;
    }
  } else if(!(queue instanceof taskQueue)) {
      queue = getQueue(queue);
  }
  queue.queueTask(task);
}

export function addQueue(queue:taskQueue) {
  if(queueLookup.has(queue.name)) {
    throw new Error("Queue names must be unique!"+queue.name)
  }
  queueLookup.set(queue.name, queue);
  if(queue.tickPhase == tickPhases.PRE_TICK) {
    addInPriorityOrder(preTickQueues, queue);
  } else {
    addInPriorityOrder(postTickQueues, queue);
  }
}

export function getQueue(queueName:string):taskQueue {
  if(!queueLookup.has(queueName)) {
    throw new Error("Trying to add func to non-existant queue")
  }
  //@ts-ignore complaining about returning undefined, but we throw an error in that case
  return queueLookup.get(queueName);
}

export function runPreTickQueues() {
  for(let queue of preTickQueues) {
    currentQueue = queue;
    queue.run();
    currentQueue = false;
  }
}
export function runPostTickQueues() {
  for(let queue of postTickQueues) {
    currentQueue = queue;
    queue.run();
    currentQueue = false;
  }
}


