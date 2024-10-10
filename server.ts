/*
 * Marble Blast Rating Race
 * Speedrun because I lost data and had no backup L.O.L.! ! !
 */

import path from "path";
import express from "express";
const app = express();

const PORT = 7800;
const POLL_INTERVAL = 15 * 1000; // milliseconds

interface Mission {
	id: number;
	game_id: number;
	game_name: string; // Added by us
	difficulty_id: number;
	difficulty_name: string; // Added by us
	name: string;
	// I don't think we care about the rest
}


/*
 * Get level data from marbleblast.com
 */

let missionReference: Record<number, Mission> | undefined = undefined;

async function getMissions(): Promise<Record<string, Mission> | undefined> {
	let missions: Record<string, Mission> = {}
	const res = await fetch("https://marbleblast.com/pq/leader/api/Mission/GetMissionList.php");
	if (res.status !== 200)
		return undefined;

	const json = await res.json();

	json.games.forEach((game: any) => {
		game.difficulties.forEach((diff: any) => {
			diff.missions.forEach((mission: Mission) => {
				mission.game_name = game["display"];
				mission.difficulty_name = diff["display"];
				missions[mission.id] = mission;
			});
		});
	});

	return missions;
}


/*
 * Poll server for scores and calulate ratings
 */

let lastUpdated = new Date();
let missions: Record<string, Record<string, Array<Mission>>>; // {game_name: {difficulty_name: [mission]}}
let pollInterval: NodeJS.Timeout | undefined = undefined;

function calcMissions(missionList: Array<number>): Record<string, Record<string, Array<Mission>>> {
	if (missionReference === undefined)
		return {}

	let missions: Record<string, Record<string, Array<Mission>>> = {}
	let lastGame: string | undefined = undefined;
	let lastDifficulty: string | undefined = undefined;
	let currentGame: Record<string, Array<Mission>> | undefined = undefined;
	let currentDifficulty: Array<Mission> | undefined = undefined;

	missionList.forEach(missionId => {
		const mission = (missionReference as Record<number, Mission>)[missionId];
		if (currentGame === undefined || mission.game_name !== lastGame) {
			lastDifficulty = undefined;
			currentDifficulty = undefined;
			lastGame = mission.game_name;
			if (!(lastGame in missions))
				missions[lastGame] = {};
			currentGame = missions[lastGame];
		}
		if (currentDifficulty === undefined || mission.difficulty_name !== lastDifficulty) {
			lastDifficulty = mission.difficulty_name;
			if (!(lastDifficulty in currentGame))
				currentGame[lastDifficulty] = [];
			currentDifficulty = currentGame[lastDifficulty];
		}
		currentDifficulty.push(mission);
	});
	return missions;
}

async function pollScores() {
	if (!missionReference) {
		missionReference = await getMissions();
		if (!missionReference) {
			// ruh roh...
			console.error("Failed to get missions!!");
			return;
		}
	}

	const res = await fetch("https://marbleblast.com/pq/leader/api/Score/GetGlobalScoresRatingRace.php");
	if (res.status !== 200) {
		console.error("Failed to get scores!!");
		return;
	}
	const json = await res.json();

	missions = calcMissions(json.missionList);

	lastUpdated = new Date();
}

pollInterval = setInterval(pollScores, POLL_INTERVAL);
pollScores();


/*
 * Run HTTP server
 */

app.use(express.static(path.join(__dirname, "static")));

app.get("/missions", (req, res) => {
	res.json(missions);
});

app.listen(PORT, () => {
	console.log(`Started HTTP server on port ${PORT}`);
});
