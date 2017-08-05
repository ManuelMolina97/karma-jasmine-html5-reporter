function ManuReporter(baseReporterDecorator: Function, config: any, logger: any, helper: any, formatError: any) {
    baseReporterDecorator(this);

    this.config = config.manuReporter || {
        success: 'Test passed',
        fail: 'Tests failed'
    };

    this.adapter = function (message: string) {
        process.stdout.write.bind(process.stdout)(`${message} \n`);
    }

    this.adapters = [
        this.adapter
    ];

    this.onRunStart = function (browsers: any) {
        this.write('heyyyyyyyyy');
    }

    this.onBrowserStart = function (browser: any) {
        this.write(`You're using ${browser}!`)
    }

    this.specSuccess = function (browser: any, result: any) {
        this.write(`${this.config.success}`);
    }

    this.specFailure = function (browser: any, result: any) {
        this.write(`${this.config.fail}`);
    }

    this.onSpecComplete = function (browser: any, result: any) {
        if (result.skipped)
            this.specSkipped(browser, result);
        else if (result.success)
            this.specSuccess(browser, result);
        else
            this.specFailure(browser, result);

        this.write(`${result.description}`);
    }

    this.onRunComplete = function (brosersCollection: any, results: any) {
        this.write('END OF ');
    }
}

(ManuReporter as any).$inject = ['baseReporterDecorator', 'config', 'logger', 'helper', 'formatError'];

module.exports = {
    'reporter:manu': ['type', ManuReporter]
}