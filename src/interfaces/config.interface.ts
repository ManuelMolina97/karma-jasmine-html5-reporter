import { Message } from "./messages.interface";
import { ConfigOptions } from "karma";

export interface ReporterConfig {
    htmlNotifications?: boolean;
    systemNotifications?: boolean;
    consoleNotifications?: boolean;
    showTimings?: boolean;
    stopAtError?: boolean;
    messages?: Message;
}

export interface KarmaReporterConfig extends ConfigOptions {
    reporterConfig: ReporterConfig;
}
