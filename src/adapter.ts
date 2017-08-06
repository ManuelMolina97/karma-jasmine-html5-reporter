declare var jasmine: any;

(function (window: any) {
    let canLoadKarma: any;
    const avoidLoadKarmaUntil = new Promise(resolve => {
        canLoadKarma = resolve;
    });

    const loadKarma: any = window.__karma__.loaded.bind(window.__karma__);

    window.__karma__.loaded = () => {
        avoidLoadKarmaUntil.then(
            () => {
                try {
                    loadKarma();
                } catch (err) {
                    console.log(`An error occurred when loaded was called`, err);
                }
            },
        );
    };

    fetch("/config")
        .then(res => res.json())
        .then(config => {
            /**
             * Since this is being run in a browser and the results should populate to an HTML page,
             * require the HTML-specific Jasmine code, injecting the same reference.
             */
            jasmineRequire.html(jasmine, config);
            canLoadKarma();
            /**
             * Create the Jasmine environment. This is used to run all specs
             * in a project.
             */
            const env = jasmine.getEnv();

            /**
             * ## Runner Parameters
             *
             * More browser specific code - wrap the query string in an object and
             * to allow for getting/setting parameters from the runner user interface.
             */

            const queryString = new jasmine.QueryString({
                getWindowLocation() { return window.location; },
            });

            const catchingExceptions = queryString.getParam("catch");
            env.catchExceptions(typeof catchingExceptions === "undefined" ? true : catchingExceptions);

            /**
             * ## Reporters
             * The `HtmlReporter` builds all of the HTML UI for the runner page.
             * This reporter paints the dots, stars, and x's for specs, as well as all spec names and all failures (if any).
             */
            const htmlReporter = new jasmine.HtmlReporter({
                env,
                onRaiseExceptionsClick() { queryString.setParam("catch", !env.catchingExceptions()); },
                getContainer() { return document.body; },
                createElement() { return document.createElement.apply(document, arguments); },
                createTextNode() { return document.createTextNode.apply(document, arguments); },
                timer: new jasmine.Timer(),
            });

            /**
             * The `jsApiReporter` also receives spec results,
             * and is used by any environment that needs to extract the results  from JavaScript.
             */

            env.addReporter(htmlReporter);

            /**
             * Filter which specs will be run by matching the start of the full name against the `spec` query param.
             */
            const specFilter = new jasmine.HtmlSpecFilter({
                filterString() { return queryString.getParam("spec"); },
            });

            env.specFilter = function (spec: any) {
                return specFilter.matches(spec.getFullName());
            };

            htmlReporter.initialize();

        })
        .catch(err => console.log(err));

})(window);
