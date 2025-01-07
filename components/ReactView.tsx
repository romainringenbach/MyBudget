import {useApp} from "../hooks/use-app";
import {createDB, loadDB} from "../utils/db";
import {useEffect, useState} from "react";

export const ReactView = () => {
	const [dbState, setDbState] = useState("Loading DB...")

	const app = useApp();

	useEffect(() => {

		if(app){
			const {vault} = app;

			loadDB(vault).then(
				(db) => {
					setDbState("DB loaded with success")
				},
				(err) => {
					console.log(err)
					setDbState("Failed to load DB, creating new DB")
					createDB(vault).then(
						(db) => setDbState("DB created with success"),
						(err) => {
							console.log(err)
							setDbState("Failed to create DB")
						}
					)
				}
			)
		}

	}, [app])
	return <h4>{dbState}</h4>;
};
