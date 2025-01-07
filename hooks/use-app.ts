import { useContext } from 'react';
import { AppContext } from '../store/app-context';
import {App} from "obsidian";

export const useApp = (): App | undefined => {
	return useContext(AppContext);
};
