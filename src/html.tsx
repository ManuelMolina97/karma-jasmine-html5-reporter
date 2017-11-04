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
        const MAXIMUM_ITEMS_IN_COLUMN = 4;
        const env = options.env || {};
        const getContainer = options.getContainer;
        const onRaiseExceptionsClick = options.onRaiseExceptionsClick || function () { };
        const timer = options.timer || noopTimer;
        const changeableOptions = Object.keys(config.reporterConfig).filter(option => typeof config.reporterConfig[option] === "boolean");
        const cards: Map<string, any> = new Map();
        const succeededs: any[] = [];
        const failures: any[] = [];
        // const skippeds: any[] = [];
        let specsExecuted = 0;
        let failureCount = 0;
        let pendingSpecCount = 0;
        let htmlReporterMain: any;

        function createColumns() {
            let i = 0;
            let isFirst = true;
            const columns = [];

            let slice = changeableOptions.slice(i, i + MAXIMUM_ITEMS_IN_COLUMN);

            while (slice.length > 0) {
                columns.push(
                    (
                        <div className="columns">
                            {
                                slice.map(option => {
                                    const optionString = option.toString();
                                    let div;
                                    if (config.reporterConfig[option]) {
                                        div = (
                                            <div className={isFirst ? "is-offset-1 column" : "column"}>
                                                <input id={optionString} type="checkbox" checked />
                                                <label htmlFor={optionString} > {optionString} </label>
                                            </div>
                                        );
                                    } else {
                                        div = (
                                            <div className={isFirst ? "is-offset-1 column" : "column"}>
                                                <input id={optionString} type="checkbox" />
                                                <label htmlFor={optionString} > {optionString} </label>
                                            </div>
                                        );
                                    }
                                    isFirst = false;
                                    return div;
                                })
                            }
                        </div>
                    ),
                );
                i += MAXIMUM_ITEMS_IN_COLUMN;
                isFirst = true;
                slice = changeableOptions.slice(i, i + MAXIMUM_ITEMS_IN_COLUMN);
            }

            return columns;
        }
        this.initialize = function () {
            htmlReporterMain = (
                <div className="html-reporter">
                    <div className="banner">
                        <p className="">Jasmine {j$.version} </p>
                    </div>
                    {
                        createColumns()
                    }
                    <div className="m-t-md m-b-md">
                        <a className="button is-info is-small is-offset-3"> Show all </a>
                        <a className="button is-success is-small is-offset-3"> Show succeeded </a>
                        <a className="button is-danger is-small is-offset-3"> Show failed </a>
                        <a className="button is-warning is-small is-offset-3"> Show skipped </a>
                    </div>
                    <div id="summary" className="has-text-centered m-b-lg" />
                    <div className="results">
                        <div className="failures columns" />
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

        this.specDone = function (result: any) {
            const card = createCard(result);
            if (result.status !== "disabled") {
                ++specsExecuted;
            }

            if (result.status === "passed") {
                succeededs.push(card);
            }

            if (result.status === "failed") {
                failureCount++;

                /*const failure = (
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
                );*/
                failures.push(card);
            }

            if (result.status === "pending") {
                pendingSpecCount++;
            }
        };

        this.jasmineDone = function () {
            const banner = find(".banner");
            const checkbox = find("input");

            banner.appendChild(<div className="duration">{`Finished in: ${timer.elapsed() / 1000}s`}</div>);

            checkbox.checked = !env.catchingExceptions();
            checkbox.onclick = onRaiseExceptionsClick;

            let statusBarMessage = `${pluralize("spec", specsExecuted)}, ${pluralize("failure", failureCount)}`;

            if (pendingSpecCount) {
                statusBarMessage += `", ${pluralize("pending spec", pendingSpecCount)}`;
            }

            const specsPassing = specsExecuted - failureCount - pendingSpecCount;

            // Set boolean to check if we have permission or not.
            if (config.reporterConfig.htmlNotifications) {
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
                const failureNode = find(".failures");
                succeededs.forEach(succeed => failureNode.appendChild(succeed));
                failures.forEach(failure => failureNode.appendChild(failure));

                /* cards.forEach((value, key) => {
                    const buttonMessage = find(`#${key}message`);

                    buttonMessage.addEventListener("click", () => {
                        const message = createMessage("Error message", value.message);
                        buttonMessage.parentNode.appendChild(message);
                        buttonMessage.parentNode.removeChild(buttonMessage);
                    });
                    const buttonStack = find(`#${key}stack`);

                    buttonStack.addEventListener("click", () => {
                        const message = createMessage("Error stack", value.stack);
                        buttonStack.parentNode.appendChild(message);
                        buttonStack.parentNode.removeChild(buttonStack);
                    });
                });*/
            }

            // scrollToSpec(document.querySelector(".summary li.passed"));
        };

        return this;

        function createCard(result: any) {
            const title = result.description;
            const status = result.status === "passed" ? "is-success" : (result.status === "failed" ? "is-danger" : "is-warning");
            const message = { ...result.passedExpectations[0], ...result.failedExpectations[0] }.message;
            const stack = { ...result.passedExpectations[0], ...result.failedExpectations[0] }.stack;
            const id = result.id;

            if (status === "is-danger") {
                cards.set(id, {
                    message,
                    stack,
                });
            }

            return (
                <div className="card column is-one-quarter">
                    <div className="card-content">
                        <div className={`media notification ${status}`} />
                        <div className="content has-text-centered">
                            <p className="title is-size-7"> {title}</p>
                            {
                                status !== "is-success" && message ? (
                                    createButton(id, "message", "Show error message")
                                ) : ""
                            }
                            {
                                status !== "is-success" && stack ? (
                                    createButton(id, "stack", "Show error stack")
                                ) : ""
                            }
                        </div>
                    </div>
                </div>
            );
        }
        // FIXME - onClick not converted into onclick
        function createButton(id: string, type: string, message: string) {
            return (
                <button id={`${id}${type}`} className="button is-small m-t-md m-b-xxs" onClick={e => {
                    e.preventDefault();
                    const button = find(`#${id}${type}`);
                    button.parentNode.appendChild(createMessage(id, type));
                    button.parentNode.removeChild(button);
                }}>{message}</button>
            );
        }

        function createMessage(id: string, type: string) {
            return (
                <article id={`${id}${type}`} className="message is-small">
                    <div className="message-header">
                        <p>{`${type} error.`}</p>
                        <button className="delete" aria-label="delete" onClick={e => {
                            e.preventDefault();
                            const message = find(`#${id}${type}`);
                            const button = createButton(id, type, type === "message" ? "Show error message" : "Show error stack");
                            message.parentNode.appendChild(button);
                            message.parentNode.removeChild(message);
                        }}></button>
                    </div>
                    <div className="message-body">
                        {type === "message" ? cards.get(id).message : cards.get(id).stack}
                    </div>
                </article>
            );
        }

        function find(selector: string) {
            return getContainer().querySelector(selector);
        }

        /* function scrollToSpec(specEl: any) {
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
        }*/

        function pluralize(singular: string, count: number) {
            const word = count === 1 ? singular : singular + "s";

            return `${count} ${word}`;
        }

        /* function specHref(result: any) {
            return `?spec=${encodeURIComponent(result.fullName)}`;
        }

        function setMenuModeTo(mode: any) {
            htmlReporterMain.setAttribute("class", `html-reporter  ${mode}`);
        }*/
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
