import {Vault} from "obsidian";
import initSqlJs, { Database } from 'sql.js'

//const SQLWASM = require("sql.js/dist/sql-wasm.wasm");

const MYPLUGINDBPATH = "MyBudget/mybudget.db";

const CREATEENTRIESTABLE = 'CREATE TABLE IF NOT EXISTS entries (' +
	'Id varchar(255),' +
	'Value float(24),' +
	'LinkedPage varchar(255),' +
	'Description mediumtext,' +
	'ApplicationDate date,' +
	'CreationDate date' + ')'

const createTables = (db: Database) => {
	db.run(CREATEENTRIESTABLE);
}

export class DatabaseNotFoundError extends Error {
	constructor() {
		super();
		this.message = 'Database not found';
	}
}

const thisPluginId = require('../manifest.json').id
const wasmFile = (vault: Vault) =>  {
	const path = [
		vault.configDir,
		'plugins',
		thisPluginId,
		"sql-wasm.wasm"
	]
	path.unshift(vault.adapter.basePath)
	return path.join('/')
}

export const createDB = async (vault: Vault): Promise<Database> => {
	const wasmFilePath = wasmFile(vault);

	const SQL = await initSqlJs({
		locateFile: (_file: any) => wasmFilePath
	})

	try {
		if(!vault.getFolderByPath('MyBudget')){
			await vault.createFolder('MyBudget');
		}

		const db = new SQL.Database();
		createTables(db);
		await vault.createBinary(MYPLUGINDBPATH,db.export());
		db.close();
		return new Promise(
			(resolve, reject) => resolve(db)
		)
	} catch (e) {
		return new Promise(
			(resolve, reject) => reject(e)
		)
	}
}

export const loadDB = async (vault: Vault): Promise<Database> => {
	const dbFile = vault.getFileByPath(MYPLUGINDBPATH);

	const SQL = await initSqlJs({
		locateFile: (_file: any) => wasmFile(vault)
	})
	console.log(`Loaded ${dbFile}`, vault);

	try {
		if(dbFile){
			console.log(`Loaded test`);
			const dbBuffer = await vault.readBinary(dbFile);
			return new Promise(
				(resolve, reject) => resolve(new SQL.Database(Buffer.from(dbBuffer)))
			)

		} else {
			throw new DatabaseNotFoundError();
		}
	}
	catch(e) {
		return new Promise(
			(resolve, reject) => reject(e)
		)
	}
}

