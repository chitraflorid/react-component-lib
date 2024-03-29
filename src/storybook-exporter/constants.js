export const API_URL =
localStorage.getItem("api_url") || "<locofy-app-url>";
export const PARAM_KEY = "export-stories";
export const EVENT_CODE_RECEIVED = "EVENT_CODE_RECEIVED";
export const IFRAME_RENDERER_CLICK = "IFRAME_RENDERER_CLICK";

export const ON_AUTH = "ON_AUTH";

export const EXPORT_START = "EXPORT_START";
export const EXPORT_END = "EXPORT_END";
export const EXPORT_SINGLE_STORY = "EXPORT_SINGLE_STORY";
export const EXPORT_ALL_STORIES = "EXPORT_ALL_STORIES";

export const EXPORT_PROGRESS = "EXPORT_PROGRESS";
export const TOGGLE_EXPORT_STATUS = "TOGGLE_EXPORT_STATUS";
export const ADDON_ID = "storybook/locofy";
export const STORYBOOK_LOCOFY_TOKEN = process.env.STORYBOOK_LOCOFY_TOKEN;