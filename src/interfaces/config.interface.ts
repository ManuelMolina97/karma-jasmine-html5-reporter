import { Message } from "./messages.interface";

export interface ReporterConfig {
    htmlNotifications?: boolean;
    consoleNotifications?: boolean;
    showTimings?: boolean;
    stopAtError?: boolean;
    messages?: Message;
}