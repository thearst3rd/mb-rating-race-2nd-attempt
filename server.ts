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

let missions: Record<number, Mission> | undefined = undefined;

async function getMissions(): Promise<Record<string, Mission> | undefined> {
	let missions: Record<string, Mission> = {}
	//const res = await fetch("https://marbleblast.com/pq/leader/api/Score/GetGlobalScoresRatingRace.php");
	const res = await fetch("https://marbleblast.com/pq/leader/api/Mission/GetMissionList.php");
	if (res.status != 200)
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

let pollInterval: NodeJS.Timeout | undefined = undefined;

async function pollScores() {
	if (!missions)
		missions = await getMissions();
	if (!missions) {
		console.error("Failed to get missions!!");
		return; // ruh roh...
	}

	//console.log(missions);
}

pollInterval = setInterval(pollScores, POLL_INTERVAL);
pollScores();


/*
 * Run HTTP server
 */

app.use(express.static(path.join(__dirname, "static")));

app.listen(PORT, () => {
	console.log(`Started HTTP server on port ${PORT}`);
});
