declare var jasmineRequire: any;
import { HtmlFactory } from "./htmlFactory";

jasmineRequire.html = function (j$: any, config: any) {
    j$.ResultsNode = jasmineRequire.ResultsNode();
    j$.HtmlReporter = jasmineRequire.HtmlReporter(j$, config);
    j$.QueryString = jasmineRequire.QueryString();
    j$.HtmlSpecFilter = jasmineRequire.HtmlSpecFilter();
};
// This could return a class instead of a function
jasmineRequire.HtmlReporter = function (j$: any, config: any) {
    const webSocketClient = new WebSocket(`ws://localhost:${config.reporterConfig.portListening}`);
    const htmlFactory = new HtmlFactory(config);

    const noopTimer = {
        start() { },
        elapsed() { return 0; },
    };

    function HtmlReporter(options: any) {
        const getContainer = options.getContainer;
        const timer = options.timer || noopTimer;
        const changeableOptions = Object.keys(config.reporterConfig).filter(option => typeof config.reporterConfig[option] === "boolean");
        const succeededs: any[] = [];
        const failures: any[] = [];
        const skippeds: any[] = [];

        let permissionShowNotifications = false;
        let specsExecuted = 0;
        let failureCount = 0;
        let pendingSpecCount = 0;

        this.initialize = function () {
            getContainer().appendChild((
                <div className="html-reporter">
                    <div className="banner">
                        <p className="">Jasmine {j$.version} </p>
                    </div>
                    {
                        htmlFactory.createColumns(changeableOptions, htmlFactory.MAXIMUM_CHECKBOXS_IN_COLUMN, createCheckbox)
                    }
                    <div className="m-t-md m-b-md m-l-md">
                        <a className="button is-info is-small is-offset-3" onClick={e => {
                            e.preventDefault();
                            htmlFactory.showCards([...succeededs, ...failures, ...skippeds]);
                        }}> Show all </a>
                        <a className="button is-success is-small is-offset-3" onClick={e => {
                            e.preventDefault();
                            htmlFactory.showCards(succeededs);
                        }}> Show succeeded </a>
                        <a className="button is-danger is-small is-offset-3" onClick={e => {
                            e.preventDefault();
                            htmlFactory.showCards(failures);
                        }}> Show failed </a>
                        <a className="button is-warning is-small is-offset-3" onClick={e => {
                            e.preventDefault();
                            htmlFactory.showCards(skippeds);
                        }}> Show skipped </a>
                    </div>
                    <div id="summary" className="has-text-centered m-b-lg" />
                    <div className="results">
                    </div>
                </div>
            ));

            htmlFactory.results = find(".results");
        };

        function addEventHandlers() {
            changeableOptions
                .forEach(option => {
                    const checkboxOption = find(`#${option.toString()}`);
                    checkboxOption.addEventListener("click", () => {
                        webSocketClient.send(JSON.stringify({
                            [option.toString()]: checkboxOption.checked,
                        }));
                    });
                });
        }

        this.jasmineStarted = (_options: any) => {
            addEventHandlers();

            if (config.reporterConfig.htmlNotifications) {
                if (("Notification" in window)) {
                    Notification.requestPermission()
                        .then(response => {
                            if (response === "granted") {
                                permissionShowNotifications = true;
                            } else {
                                find(".alert").appendChild((
                                    <div className="alert"> Your html5-reporter was configured to show notifications! </div>
                                ));
                            }
                        });
                } else {
                    find(".alert").appendChild((
                        <div className="alert"> Your browser does not support Notifications! </div>
                    ));
                }
            }
            timer.start();
        };

        const topResults = new j$.ResultsNode({}, "", null);
        let currentParent = topResults;

        this.suiteStarted = function (result: any) {
            currentParent.addChild(result, "suite");
            currentParent = currentParent.last();
        };

        this.suiteDone = function (result: any) {
            if (currentParent !== topResults) {
                currentParent = currentParent.parent;
            }
        };

        this.specStarted = function (result: any) {
            currentParent.addChild(result, "spec");
        };

        this.specDone = function (result: any) {
            if (result.status !== "disabled") {
                ++specsExecuted;
            }

            if (result.status === "passed") {
                succeededs.push(result);
            } else if (result.status === "failed") {
                ++failureCount;
                failures.push(result);
            } else if (result.status === "pending") {
                ++pendingSpecCount;
                skippeds.push(result);
            }
        };

        this.jasmineDone = function () {
            let statusBarMessage = `${pluralize("spec", specsExecuted)}, ${pluralize("failure", failureCount)}`;

            if (pendingSpecCount) {
                statusBarMessage += `, ${pluralize("pending spec", pendingSpecCount)}`;
            }

            const specsPassing = specsExecuted - failureCount - pendingSpecCount;

            if (permissionShowNotifications) {
                new Notification(statusBarMessage);
            }

            const summary = find("#summary");

            if (specsExecuted !== 0) {
                summary.appendChild(
                    <span className="is-info fa-2x">{pluralize("spec", specsExecuted)} executed - </span>,
                );
            }

            if (specsPassing !== 0) {
                summary.appendChild(
                    <span className="is-success fa-2x">{specsPassing} <i className="fa fa-check"></i> </span>,
                );
            }

            if (failureCount !== 0) {
                summary.appendChild(
                    <span className="is-danger fa-2x">{failureCount} <i className="fa fa-times"></i> </span>,
                );
            }

            if (pendingSpecCount !== 0) {
                summary.appendChild(
                    <span className="is-warning fa-2x">{pendingSpecCount} <i className="fa fa-question"></i></span>,
                );
            }

            if (failures.length) {
                htmlFactory.showCards(failures);
            }
        };

        function createCheckbox(checkbox: string) {
            return (
                <div className="is-offset-1 column">
                    <input id={checkbox} type="checkbox" checked={config.reporterConfig[checkbox]} />
                    <label htmlFor={checkbox} > {checkbox} </label>
                </div>
            );
        }

        function find(selector: string) {
            return getContainer().querySelector(selector);
        }

        function pluralize(singular: string, count: number): string {
            return `${count} ${count === 1 ? singular : singular + "s"}`;
        }

        return this;
    }

    return HtmlReporter;
};

jasmineRequire.HtmlSpecFilter = function () {
    return (options: any) => {
        const filterString = options && options.filterString() && options.filterString().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const filterPattern = new RegExp(filterString);

        this.matches = filterPattern.test;
    };
};

jasmineRequire.ResultsNode = function () {
    class ResultsNode {
        result: any;
        type: any;
        parent: any;
        children: ResultsNode[];

        constructor(result: any, type: any, parent: any) {
            this.result = result;
            this.type = type;
            this.parent = parent;
            this.children = [];
        }
        // TODO -> Is possible to return an anonymous class and create it like -> new this()
        addChild = (_result: any, _type: any) => this.children.push(new ResultsNode(_result, _type, this));

        last = () => this.children[this.children.length - 1];
    }

    return ResultsNode;
};

jasmineRequire.QueryString = function () {
    // WOULD BE TE SAME RETURNING AN ANONYMOUS CLASS WITH STATIC METHODS (?)
    return (options: any) => {

        this.setParam = (key: any, value: any) => {
            const paramMap: any = queryStringToParamMap();
            const qStrPairs = Object.keys(paramMap).map(prop => `${encodeURIComponent(prop)}=${encodeURIComponent(paramMap[prop])}`);

            paramMap[key] = value;

            options.getWindowLocation().search = `?${qStrPairs.join("&")}`;
        };

        this.getParam = (key: any) => queryStringToParamMap()[key];

        return this;

        function queryStringToParamMap(): any {
            const paramStr: string = options.getWindowLocation().search.substring(1);
            const paramMap: any = {};

            if (paramStr.length > 0) {
                const params = paramStr.split("&");
                const paramsLength = params.length;

                for (let i = 0; i < paramsLength; i++) {
                    const param = params[i].split("=");
                    const value = decodeURIComponent(param[1]);

                    paramMap[decodeURIComponent(param[0])] = value === "true" || value === "false" ?
                        JSON.parse(value) :
                        decodeURIComponent(param[1]);
                }
            }

            return paramMap;
        }
    };
};
