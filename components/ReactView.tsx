import {useApp} from "../hooks/use-app";
import {addEntry, createDB, loadDB} from "../utils/db";
import {useEffect, useState} from "react";
import {Database} from "sql.js";

export const ReactView = () => {
	const [dbState, setDbState] = useState("Loading DB...")
	const [db, setDb] = useState<Database | null>(null);

	const app = useApp();

	useEffect(() => {

		if(app){
			const {vault} = app;

			loadDB(vault).then(
				(db) => {
					setDbState("DB loaded with success")
					console.log(db.exec("SELECT * FROM Entries"))
					setDb(db)
				},
				(err) => {
					console.log(err)
					setDbState("Failed to load DB, creating new DB")
					createDB(vault).then(
						(db) => {
							setDbState("DB created with success")
							console.log(db.exec("SELECT * FROM Entries"))
							setDb(db)
						},
						(err) => {
							console.log(err)
							setDbState("Failed to create DB")
						}
					)
				}
			)
		}

	}, [app])

	const addEntryHandler = () => {
		if(db && app) {
			const {vault} = app;
			addEntry(db, vault, {
				id: -1,
				value: 10,
				linkedPage: "",
				description: "",
				creationDate: new Date(),
				applicationDate: new Date(),
			}).then(() => {
				console.log(db.exec("SELECT * FROM entries"))
			}).catch(err => console.error(err))
		} else {
			console.warn("DB or App is not ready", db, app);
		}
	}

	return (
		<>
			<h4>{dbState}</h4>
			<button onClick={addEntryHandler}>Add entry</button>
		</>
	);
};
