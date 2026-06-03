<script lang="ts">
	import { onMount } from 'svelte';

	import {
		Scheduler,
		SchedulerSJF,
		SchedulerRR,
		SchedulerPriority,
		SchedulerPriorityAge,
		Process,
		stringifyStatus
	} from '$lib/process.svelte';

	let duration: number = $state(1);
	let priority: number = $state(1);
	let time: number = $state(0);
	let auto: boolean = $state(false);
	let speed: number = $state(200);

	let scheduler = $state(new Scheduler());
	let interval: NodeJS.Timeout;

	function changeScheduler(event: Event) {
		const value = (event.target as HTMLSelectElement).value;

		if (value === 'Scheduler') {
			scheduler = new Scheduler();
		} else if (value === 'SchedulerSJF') {
			scheduler = new SchedulerSJF();
		} else if (value === 'SchedulerRR') {
			scheduler = new SchedulerRR();
		} else if (value === 'SchedulerPriority') {
			scheduler = new SchedulerPriority();
		} else if (value === 'SchedulerPriorityAge') {
			scheduler = new SchedulerPriorityAge();
		}
	}

	function randomizeParameters() {
		duration = Math.floor(Math.random() * 20) + 1;
		priority = Math.floor(Math.random() * 20) + 1;
	}

	function newProcess() {
		scheduler.addProcess(new Process(duration, priority));
		randomizeParameters();
	}

	function nextTime() {
		const dt = scheduler.next();
		time += dt;
		scheduler.addWaitTime(dt);
	}

	function toggleAuto() {
		auto = !auto;
		interval && clearInterval(interval);
		if (auto) {
			interval = setInterval(() => {
				if (!auto) {
					clearInterval(interval);
					return;
				}
				nextTime();
			}, speed);
		}
	}

	function changeSpeed(event: Event) {
		interval && clearInterval(interval);
		if (auto) {
			interval = setInterval(() => {
				if (!auto) {
					clearInterval(interval);
					return;
				}
				nextTime();
			}, speed);
		}
	}

	onMount(() => {
		randomizeParameters();
	});
</script>

<div class="buttons">
	<div>
		<button id="random" onclick={randomizeParameters}>Randomize</button>
	</div>
	<div>
		<button id="new" onclick={newProcess}>New</button>
	</div>
	<div>
		<button id="next" onclick={nextTime} disabled={auto}>Next</button>
	</div>
	<div>
		<button id="toggle-auto" onclick={toggleAuto}>Auto</button>
	</div>
	<div>
		<select onchange={changeScheduler} id="scheduler">
			<option value="Scheduler">FCFS</option>
			<option value="SchedulerSJF">SJF</option>
			<option value="SchedulerRR">Round Robin</option>
			<option value="SchedulerPriority">Priority</option>
			<option value="SchedulerPriorityAge">Priority with Aging</option>
		</select>
	</div>
	<div>
		<input
			type="range"
			id="speed"
			placeholder="Speed"
			bind:value={speed}
			min="1"
			max="1000"
			step="1"
			onchange={changeSpeed}
		/>
	</div>
</div>
<div>
	<div>
		현재 시간: {time}
	</div>
	<div>
		실행 시간
		<input
			id="duration"
			type="range"
			placeholder="Duration"
			bind:value={duration}
			min="1"
			max="20"
		/>
		{duration}
	</div>
	<div>
		우선 순위
		<input
			id="priority"
			type="range"
			placeholder="Priority"
			bind:value={priority}
			min="1"
			max="20"
		/>
		{priority}
	</div>
</div>
<div class="processes">
	{#each [...scheduler.processes, ...scheduler.removedProcesses] as process}
		<div class="process">
			<div class="pid">
				#{process.pid}
			</div>
			<div
				class="duration"
				style="background-image: linear-gradient(to right, #4caf50 {process.duration *
					5}%, #ddd {process.duration * 5}%);"
			>
				{process.duration} ut
			</div>
			<div
				class="priority"
				style="background-image: linear-gradient(to right, #2196f3 {process.priority *
					5}%, #ddd {process.priority * 5}%);"
			>
				{process.priority}
			</div>
			<div
				class="status"
				style="background-color: {process.status === 'running'
					? '#4caf50'
					: process.status === 'ready'
						? '#2196f3'
						: '#ddd'};"
			>
				{stringifyStatus(process.status)}
			</div>
			<div>
				Wait: {process.waitTime} ut
			</div>
		</div>
	{/each}
</div>
<div>
	Average Wait Time: {scheduler.getAverageWaitTime().toFixed(2)} ut
</div>

<style>
	.processes {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 20px;
	}

	.process {
		display: flex;
		gap: 10px;
	}

	.duration,
	.priority,
	.status {
		padding: 5px 10px;
		border-radius: 5px;
	}

	.pid,
	.duration,
	.priority,
	.status {
		width: 100px;
	}

	.buttons {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
	}
</style>
