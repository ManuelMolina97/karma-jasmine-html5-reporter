import { ReporterConfig, KarmaReporterConfig } from "./interfaces/config.interface";

function HtmlReporter(baseReporterDecorator: Function, _config: KarmaReporterConfig, logger: any, helper: any, formatError: any) {
    baseReporterDecorator(this);

    const config: ReporterConfig = {
        messages: {
            failure: "Test failed",
            skipped: "Test skipped",
            success: "Test ok",
            ..._config.reporterConfig.messages,
        },
        consoleNotifications: true,
        htmlNotifications: false,
        showTimings: false,
        stopAtError: false,
        ..._config.reporterConfig,
    };

    this.adapter = function (message: string): void {
        process.stdout.write.bind(process.stdout)(`${message} \n`);
    };

    this.adapters = [
        this.adapter,
    ];

    this.onRunStart = function (browsers: string): void {
        this.write("heyyyyyyyyy");
    };

    this.onBrowserStart = function (browser: string): void {
        this.write(`You're using ${browser}!`);
    };

    this.specSuccess = function (browser: string, result: any): void {
        this.write(`${config.messages.success}`);
    };

    this.specFailure = function (browser: string, result: any): void {
        this.write(`${this.config.fail}`);
    };

    this.onSpecComplete = function (browser: string, result: any): void {
        if (result.skipped) {
            this.specSkipped(browser, result);
        } else if (result.success) {
            this.specSuccess(browser, result);
        } else {
            this.specFailure(browser, result);
        }


        this.write(`${result.description}`);
    };

    this.onRunComplete = function (brosersCollection: any, results: any): void {
        this.write("END OF ");
    };
}

(HtmlReporter as any).$inject = ["baseReporterDecorator", "config", "logger", "helper", "formatError"];

module.exports = {
    "reporter:manu": [
        "type",
        HtmlReporter,
    ],
};
