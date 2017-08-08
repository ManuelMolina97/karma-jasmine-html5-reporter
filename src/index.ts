import { KarmaReporterConfig } from "./interfaces/config.interface";
import { KarmaCollection, CustomReporter, Browser, KarmaResult, Results } from "./karma.types";

const JASMINE_CORE_PATTERN = /([\\/]karma-jasmine[\\/])/i;

function createPattern(path: string) {
    return { pattern: path, included: true, served: true, watched: false };
}


function ManuReporter(
    this: CustomReporter,
    baseReporterDecorator: Function,
    config: KarmaReporterConfig,
    logger: any,
    helper: any,
    formatError: any,
) {
    baseReporterDecorator(this);

    const defaultConfig = {
        messages: {
            failure: "Test failed",
            skipped: "Test skipped",
            success: "Test ok",
        },
        consoleNotifications: true,
        htmlNotifications: false,
        showTimings: false,
        stopAtError: false,
    };

    const customConfig = config.reporterConfig;
    if (!customConfig) {
        config.reporterConfig = defaultConfig;
    } else {
        config.reporterConfig = {
            ...defaultConfig,
            ...customConfig,
            messages: {
                ...defaultConfig.messages,
                ...customConfig.messages,
            },
        };
    }

    this.config = config;

    let jasmineCoreIndex = 0;

    baseReporterDecorator(this);

    const files = config.files || [];

    files.forEach((file, index) => {
        const pattern = typeof file === "string" ? file : file.pattern;

        if (JASMINE_CORE_PATTERN.test(pattern)) {
            jasmineCoreIndex = index;
        }
    });

    // To generate this file use:
    // yarn browserify -- dist/polyfills.js -o dist/polyfills.b.js
    files.splice(++jasmineCoreIndex, 0, createPattern(__dirname + "/dom.js"));
    files.splice(++jasmineCoreIndex, 0, createPattern(__dirname + "/polyfills.b.js"));
    files.splice(++jasmineCoreIndex, 0, createPattern(__dirname + "/styles.css"));
    files.splice(++jasmineCoreIndex, 0, createPattern(__dirname + "/html.js"));
    files.splice(++jasmineCoreIndex, 0, createPattern(__dirname + "/adapter.js"));

    this.adapter = function (message: string) {
        process.stdout.write.bind(process.stdout)(`${message} \n`);
    };

    this.adapters = [
        this.adapter,
    ];

    this.onRunStart = (browsers: KarmaCollection) => {
        this.write("hello");
    };

    this.onBrowserStart = (browser: Browser) => {
        /* this.write(`You're using ${browser}!`); */
    };

    this.specSuccess = (browser: Browser, result: KarmaResult) => {
        this.write(browser, result);
        this.write(`${this.config.success}`);
    };

    this.specFailure = (browser: Browser, result: KarmaResult) => {
        /* this.write(`${this.config.fail}`); */
    };

    this.onSpecComplete = (browser: Browser, result: KarmaResult) => {
        /* if (result.skipped) {
            this.specSkipped(browser, result);
        } else if (result.success) {
            this.specSuccess(browser, result);

        } else {
            this.specFailure(browser, result);

        }

        this.write(`${result.description}`); */
    };

    this.onRunComplete = (browsersCollection: KarmaCollection, results: Results) => {
        /* this.write("END OF "); */
    };


}

(ManuReporter as any).$inject = ["baseReporterDecorator", "config", "logger", "helper", "formatError"];


function middleware(config: any) {
    return (req: any, res: any, next: any) => {
        if (req.url === "/config") {
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(config));
        } else {
            next();
        }
    };
}

module.exports = {
    "reporter:manu": ["type", ManuReporter],
    "middleware:manu": ["factory", middleware],
};
