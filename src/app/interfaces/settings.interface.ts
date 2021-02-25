// ========================================================
// SETTINGS
// ========================================================

export interface Settings {
	id_company: string,
	bl_spm: boolean, // terraza, patio, etc
	bl_schedule: boolean,
	bl_queue: boolean,
	__v?: number;
	_id?: string;
}

export interface SettingsResponse {
	ok: boolean;
	msg: string;
	settings: Settings | null;
}

