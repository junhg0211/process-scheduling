enum ProcessState {
	Ready,
	Running,
	Terminated
}

export function stringifyStatus(status: ProcessState): string {
	switch (status) {
		case ProcessState.Ready:
			return 'Ready';
		case ProcessState.Running:
			return 'Running';
		case ProcessState.Terminated:
			return 'Terminated';
		default:
			return 'Unknown';
	}
}

let nextId = 1;

export class Process {
	public status = $state(ProcessState.Ready);
	public waitingSince = $state(0);
	public duration = $state(0);
	public priority = $state(0);
	public pid: number;

	public waitTime = $state(0);

	constructor(duration: number, priority: number) {
		this.duration = duration;
		this.priority = priority;
		this.pid = nextId++;
	}

	toJSON() {
		return {
			status: this.status,
			waitingSince: this.waitingSince,
			duration: this.duration,
			priority: this.priority
		};
	}
}

// FCFS Scheduler
export class Scheduler {
	public processes = $state<Process[]>([]);
	public removedProcesses = $state<Process[]>([]);

	public addProcess(process: Process): void {
		this.processes.push(process);
	}

	public addWaitTime(amount: number = 1): void {
		for (const process of this.processes) {
			if (process.status === ProcessState.Ready) {
				process.waitTime += amount;
			}
		}
	}

	public getAverageWaitTime(): number {
		if (this.removedProcesses.length === 0) {
			return 0;
		}
		const totalWaitTime = this.removedProcesses.reduce((sum, process) => sum + process.waitTime, 0);
		return totalWaitTime / this.removedProcesses.length;
	}

	public removeProcess(process: Process): void {
		const index = this.processes.indexOf(process);
		if (index > -1) {
			this.processes.splice(index, 1);
		}

		this.removedProcesses.push(process);
	}

	toJSON() {
		return {
			processes: this.processes
		};
	}

	public next(): number {
		if (this.processes.length === 0) {
			return 0;
		}

		const process = this.processes[0];
		if (process.status === ProcessState.Ready) {
			process.status = ProcessState.Running;
		}

		if (process.duration <= 0) {
			process.status = ProcessState.Terminated;
			this.removeProcess(process);
			return 0;
		}

		process.duration -= 1;
		return 1;
	}
}

export class SchedulerSJF extends Scheduler {
	public next(): number {
		if (this.processes.length === 0) {
			return 0;
		}

		const process = this.processes[0];

		if (process.status === ProcessState.Ready) {
			this.processes.sort((a, b) => a.duration - b.duration);
			this.processes[0].status = ProcessState.Running;
			return 0;
		}

		process.status = ProcessState.Running;

		if (process.duration <= 0) {
			process.status = ProcessState.Terminated;
			this.removeProcess(process);
			return 0;
		}

		process.duration -= 1;
		return 1;
	}
}

// RoundRobin
export class SchedulerRR extends Scheduler {
	constructor(public quantum: number = 1) {
		super();
	}

	public next(): number {
		if (this.processes.length === 0) {
			return 0;
		}

		const process = this.processes[0];

		if (process.status === ProcessState.Running) {
			process.status = ProcessState.Ready;
			return 0;
		}

		if (process.status === ProcessState.Ready) {
			process.status = ProcessState.Running;
		}

		const timeSlice = Math.min(this.quantum, process.duration);
		process.duration -= timeSlice;

		if (process.duration <= 0) {
			process.status = ProcessState.Terminated;
			this.removeProcess(process);
		} else {
			// Move the process to the end of the queue
			this.processes.push(this.processes.shift()!);
		}

		return timeSlice;
	}
}

// Priority Scheduling
export class SchedulerPriority extends Scheduler {
	public next(): number {
		if (this.processes.length === 0) {
			return 0;
		}

		// Sort processes by priority (higher priority first)
		this.processes[0].status = ProcessState.Ready;
		this.processes.sort((a, b) => b.priority - a.priority);
		const process = this.processes[0];
		this.processes[0].status = ProcessState.Running;

		if (process.status === ProcessState.Ready) {
			process.status = ProcessState.Running;
			return 0;
		}

		if (process.duration <= 0) {
			process.status = ProcessState.Terminated;
			this.removeProcess(process);
			return 0;
		}

		process.duration -= 1;
		return 1;
	}
}

// Priority + Age Scheduling
export class SchedulerPriorityAge extends Scheduler {
	constructor(public agingFactor: number = 0.125) {
		super();
	}

	public next(): number {
		if (this.processes.length === 0) {
			return 0;
		}

		// Age processes and sort by priority
		const process = this.processes[0];

		if (process.status === ProcessState.Ready) {
			process.status = ProcessState.Running;
			return 0;
		}

		this.processes.sort((a, b) => b.priority - a.priority);

		for (let i = 1; i < this.processes.length; i++) {
			const process = this.processes[i];
			process.priority += this.agingFactor;
		}

		if (process.duration <= 0) {
			process.status = ProcessState.Terminated;
			this.removeProcess(process);
			return 0;
		}

		process.duration -= 1;
		return 1;
	}
}
