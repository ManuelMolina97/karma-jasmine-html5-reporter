declare var jasmineRequire: any;


jasmineRequire.html = function (j$: any, config: any) {
    j$.ResultsNode = jasmineRequire.ResultsNode();
    j$.HtmlReporter = jasmineRequire.HtmlReporter(j$, config);
    j$.QueryString = jasmineRequire.QueryString();
    j$.HtmlSpecFilter = jasmineRequire.HtmlSpecFilter();
};

jasmineRequire.HtmlReporter = function (j$: any, config: any) {

    const webSocketClient = new WebSocket(`ws://localhost:${config.reporterConfig.portListening}`);

    const noopTimer = {
        start() { },
        elapsed() { return 0; },
    };

    function HtmlReporter(options: any) {
        const env = options.env || {};
        const getContainer = options.getContainer;
        const onRaiseExceptionsClick = options.onRaiseExceptionsClick || function () { };
        const timer = options.timer || noopTimer;
        const changeableOptions = Object.keys(config.reporterConfig).filter(option => typeof config.reporterConfig[option] === "boolean");
        let specsExecuted = 0;
        let failureCount = 0;
        let pendingSpecCount = 0;
        let htmlReporterMain: any;
        let symbols: any;

        this.initialize = function () {
            htmlReporterMain = (
                <div className="html-reporter">
                    <div className="banner">
                        <span className="title">Jasmine {j$.version} </span>
                    </div>
                    <div className="reporter-options">
                        {
                            changeableOptions.map(option => {
                                const optionString = option.toString();
                                if (config.reporterConfig[option]) {
                                    return (
                                        <div>
                                            <input id={optionString} type="checkbox" checked />
                                            <label htmlFor={optionString} > {optionString} </label>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div>
                                            <input id={optionString} type="checkbox" />
                                            <label htmlFor={optionString} > {optionString} </label>
                                        </div>
                                    );
                                }
                            })
                        }
                    </div>
                    <ul className="symbol-summary" />
                    <div className="alert" />
                    <div className="results">
                        <div className="failures" />
                    </div>
                </div>
            );
            getContainer().appendChild(htmlReporterMain);
            this.addEventHandlers();

            if (config.reporterConfig.htmlNotifications) {
                if (("Notification" in window)) {
                    Notification.requestPermission()
                        .then(response => {
                            if (response !== "granted") {
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

            if (config.reporterConfig.htmlNotifications) {
                if (("Notification" in window)) {
                    Notification.requestPermission()
                        .then(response => {
                            if (response !== "granted") {
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

            symbols = find(".symbol-summary");
        };

        this.addEventHandlers = () => {
            changeableOptions
                .forEach(option => {
                    const checkboxOption = find(`#${option.toString()}`);
                    checkboxOption.addEventListener("click", () => {
                        webSocketClient.send(JSON.stringify({
                            [option.toString()]: checkboxOption.checked,
                        }));
                    });
                });
        };

        let totalSpecsDefined: any;
        this.jasmineStarted = (_options: any) => {
            totalSpecsDefined = _options.totalSpecsDefined || 0;
            timer.start();
        };

        const summary = (<div className="summary"></div>);

        const topResults = new j$.ResultsNode({}, "", null);
        let currentParent = topResults;

        this.suiteStarted = function (result: any) {
            currentParent.addChild(result, "suite");
            currentParent = currentParent.last();
        };

        this.suiteDone = function (result: any) {
            if (currentParent === topResults) {
                return;
            }

            currentParent = currentParent.parent;
        };

        this.specStarted = function (result: any) {
            currentParent.addChild(result, "spec");
        };

        const failures: any[] = [];
        this.specDone = function (result: any) {
            if (result.status !== "disabled") {
                specsExecuted++;
            }
            symbols.appendChild(
                <li className={result.status} id={`spec_${result.id}`} title={result.fullName} />,
            );

            if (result.status === "failed") {
                failureCount++;

                const failure = (
                    <div className="spec-detail failed">
                        <div className="description">
                            <a title={result.fullName} href={specHref(result)}>{result.fullName}</a>
                        </div>
                        <div className="messages">
                            {
                                result.failedExpectations.map((failedExpectation: any) => (
                                    <div>
                                        <div className="result-message">{failedExpectation.message}</div>
                                        <div className="stack-trace">{failedExpectation.stack}</div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                );
                failures.push(failure);
            }

            if (result.status === "pending") {
                pendingSpecCount++;
            }
        };

        this.jasmineDone = function () {
            let specSuiteId = "";
            const banner = find(".banner");

            banner.appendChild(<div className="duration">{`Finished in: ${timer.elapsed() / 1000}s`}</div>);

            const alert = find(".alert");

            alert.appendChild(
                <span className="exceptions">
                    <label className="label">Raise exceptions</label>
                    <input className="raise" id="raise-exceptions" type="checkbox" />
                </span>,
            );
            const checkbox = find("input");

            checkbox.checked = !env.catchingExceptions();
            checkbox.onclick = onRaiseExceptionsClick;

            if (specsExecuted < totalSpecsDefined) {
                const skippedMessage = `Ran ${specsExecuted}  of  ${totalSpecsDefined} specs - run all`;
                alert.appendChild(
                    <span className="bar skipped">
                        <a href="?" title="Run all specs">{skippedMessage}</a>
                    </span>,
                );
            }
            let statusBarMessage = `${pluralize("spec", specsExecuted)}, ${pluralize("failure", failureCount)}`;

            if (pendingSpecCount) {
                statusBarMessage += `", ${pluralize("pending spec", pendingSpecCount)}`;
            }
            if (config.reporterConfig.htmlNotifications) {
                new Notification(statusBarMessage);
            }

            const statusBarClassName = `bar ${failureCount > 0 ? "failed" : "passed"}`;
            alert.appendChild(
                <span className={statusBarClassName}>{statusBarMessage}</span>,
            );
            const results = find(".results");
            results.appendChild(summary);

            summaryList(topResults, summary);

            function summaryList(resultsTree: any, domParent: any) {
                let specListNode;
                for (let i = 0; i < resultsTree.children.length; i++) {
                    const resultNode = resultsTree.children[i];
                    if (resultNode.type === "suite") {
                        specSuiteId = resultNode.result.id;

                        const suiteListNode = (
                            <ul className="suite" id={`suite-${specSuiteId}`}>
                                <li className="suite-detail">
                                    <a href={specHref(resultNode.result)}>{resultNode.result.description}</a>
                                </li>
                            </ul>
                        );

                        summaryList(resultNode, suiteListNode);
                        domParent.appendChild(suiteListNode);
                    }
                    if (resultNode.type === "spec") {
                        if (domParent.getAttribute("class") !== "specs") {
                            specListNode = (
                                <ul className="specs">
                                    <li className={resultNode.result.status} id={`spec-${resultNode.result.id}`}>
                                        <a href={specHref(resultNode.result)}>{resultNode.result.description}</a>
                                    </li>
                                </ul>
                            );
                            domParent.appendChild(specListNode);
                        }

                        const attributesObj: any = {
                            className: resultNode.result.status,
                            id: "spec-" + resultNode.result.id,
                        };

                        if (specSuiteId) {
                            attributesObj["spec-suite-id"] = specSuiteId;
                        }
                    }
                }
            }

            if (failures.length) {
                alert.appendChild(
                    <span className="menu bar spec-list">
                        <span>Spec list | </span>
                        <a className="failures-menu" href="#">Failures</a>
                    </span>,
                );
                alert.appendChild(
                    <span className="menu bar failure-list">
                        <a className="spec-list-menu" href="#">Spec list</a>
                        <span> | Failures</span>
                    </span>,
                );
                find(".failures-menu").onclick = function () {
                    setMenuModeTo("failure-list");
                };
                find(".spec-list-menu").onclick = function () {
                    setMenuModeTo("spec-list");
                };

                setMenuModeTo("failure-list");

                const failureNode = find(".failures");
                failures.forEach(failure => failureNode.appendChild(failure));
            }

            scrollToSpec(document.querySelector(".summary li.passed"));
        };

        return this;

        function find(selector: string) {
            return getContainer().querySelector(selector);
        }

        function scrollToSpec(specEl: any) {
            let scroll = 0;
            const windowInnerHeight = window.innerHeight;

            if (specEl) {
                const suiteId = specEl.getAttribute("spec-suite-id"),
                    parent = getParentById(specEl, "suite-" + suiteId);


                if (parent && (parent.offsetTop > 0)) {
                    const parentHeight = parent.offsetHeight;

                    scroll = (parent.offsetTop + parentHeight) > windowInnerHeight ?
                        parent.offsetTop - windowInnerHeight / 2 : 0;
                }
            }

            document.body.scrollTop = scroll;
        }

        function getParentById(el: any, id: any) {
            let found = false,
                parent = el;

            while (!found) {
                if (parent && parent.parentNode) {
                    if (parent.parentNode.id === id) {
                        found = true;
                    }

                    parent = parent.parentNode;
                } else {
                    found = true;
                    parent = null;
                }
            }

            return parent;
        }

        function pluralize(singular: string, count: number) {
            const word = count === 1 ? singular : singular + "s";

            return `${count} ${word}`;
        }

        function specHref(result: any) {
            return `?spec=${encodeURIComponent(result.fullName)}`;
        }

        function setMenuModeTo(mode: any) {
            htmlReporterMain.setAttribute("class", `html-reporter  ${mode}`);
        }
    }

    return HtmlReporter;
};

jasmineRequire.HtmlSpecFilter = function () {
    function HtmlSpecFilter(options: any) {
        const filterString = options && options.filterString() && options.filterString().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const filterPattern = new RegExp(filterString);

        this.matches = function (specName: any) {
            return filterPattern.test(specName);
        };
    }

    return HtmlSpecFilter;
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

        addChild = function (_result: any, _type: any) {
            const child = new ResultsNode(_result, _type, this);
            this.children.push(child);
        };

        last = function () {
            return this.children[this.children.length - 1];
        };
    }

    return ResultsNode;
};

jasmineRequire.QueryString = function () {
    function QueryString(options: any) {

        this.setParam = function (key: any, value: any) {
            const paramMap: any = queryStringToParamMap();
            paramMap[key] = value;
            options.getWindowLocation().search = toQueryString(paramMap);
        };

        this.getParam = function (key: any) {
            return queryStringToParamMap()[key];
        };

        return this;

        function toQueryString(paramMap: any) {
            const qStrPairs = Object.keys(paramMap).map(prop => `${encodeURIComponent(prop)}=${encodeURIComponent(paramMap[prop])}`);
            return `?${qStrPairs.join("&")}`;
        }

        function queryStringToParamMap(): any {
            const paramStr: string = options.getWindowLocation().search.substring(1);
            let params: any[] = [];
            const paramMap: any = {};

            if (paramStr.length > 0) {
                params = paramStr.split("&");
                for (let i = 0; i < params.length; i++) {
                    const p = params[i].split("=");
                    let value = decodeURIComponent(p[1]);
                    if (value === "true" || value === "false") {
                        value = JSON.parse(value);
                    }
                    paramMap[decodeURIComponent(p[0])] = value;
                }
            }

            return paramMap;
        }

    }

    return QueryString;
};
