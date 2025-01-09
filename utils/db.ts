import {Vault} from "obsidian";
import initSqlJs, { Database } from 'sql.js'
import {Entry} from "./app-types"

//const SQLWASM = require("sql.js/dist/sql-wasm.wasm");

const MYPLUGINDBPATH = "MyBudget/mybudget.db";

const CREATEENTRIESTABLE = 'CREATE TABLE IF NOT EXISTS Entries (' +
	'Id INTEGER PRIMARY KEY AUTOINCREMENT,' +
	'Value FLOAT(24),' +
	'LinkedPage VARCHAR(255),' +
	'Description MEDIUMTEXT,' +
	'ApplicationDate DATE,' +
	'CreationDate DATE' + ')'

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

const saveDB = async (db: Database, vault: Vault): Promise<void> => {
	const dbFile = vault.getFileByPath(MYPLUGINDBPATH);

	try {
		if(dbFile){
			return await vault.modifyBinary(dbFile, db.export());

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

	try {
		if(dbFile){
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

const getSQLDate = (jsDate : Date) => {
	return `${jsDate.getFullYear()}-${jsDate.getMonth() + 1}-${jsDate.getDate()}`
}

const getLastEntryId = (db: Database): number => {
	const result = db.exec('SELECT LAST_INSERT_ROWID();');
	const id = result[0].values[0][0];
	return Number(id);
}

export const addEntry = async (db: Database, vault: Vault, entry: Entry): Promise<number> => {
	if(entry.id !== -1)
		console.warn("Id is supposed to be empty when adding an entry")

	try {
		db.run("INSERT INTO entries VALUES (NULL,?,?,?,?,?);", [entry.value, entry.linkedPage, entry.description, getSQLDate(entry.applicationDate), getSQLDate(entry.creationDate)])
		await saveDB(db,vault)
		return new Promise (
			(resolve, reject) => resolve(getLastEntryId(db))
		)
	} catch (e) {
		return new Promise(
			(resolve, reject) => reject(e)
		)
	}
}
