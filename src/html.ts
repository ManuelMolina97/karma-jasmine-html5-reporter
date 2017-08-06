declare var jasmineRequire: any;


jasmineRequire.html = function (j$: any, config: any) {
    console.log(config || "No config");

    j$.ResultsNode = jasmineRequire.ResultsNode();
    j$.HtmlReporter = jasmineRequire.HtmlReporter(j$);
    j$.QueryString = jasmineRequire.QueryString();
    j$.HtmlSpecFilter = jasmineRequire.HtmlSpecFilter();
};

jasmineRequire.HtmlReporter = function (j$: any) {

    const noopTimer = {
        start() { },
        elapsed() { return 0; },
    };

    function HtmlReporter(options: any) {
        const env = options.env || {};
        const getContainer = options.getContainer;
        const createElement = options.createElement;
        const createTextNode = options.createTextNode;
        const onRaiseExceptionsClick = options.onRaiseExceptionsClick || function () { };
        const timer = options.timer || noopTimer;
        // const results = [];
        let specsExecuted = 0;
        let failureCount = 0;
        let pendingSpecCount = 0;
        let htmlReporterMain: any;
        let symbols: any;

        this.initialize = function () {
            htmlReporterMain = createDom("div", { className: "html-reporter" },
                createDom("div", { className: "banner" },
                    createDom("span", { className: "title" }, "Jasmine"),
                    createDom("span", { className: "version" }, j$.version),
                ),
                createDom("ul", { className: "symbol-summary" }),
                createDom("div", { className: "alert" }),
                createDom("div", { className: "results" },
                    createDom("div", { className: "failures" }),
                ),
            );
            getContainer().appendChild(htmlReporterMain);

            symbols = find(".symbol-summary");
        };

        let totalSpecsDefined: any;
        this.jasmineStarted = (_options: any) => {
            totalSpecsDefined = _options.totalSpecsDefined || 0;
            timer.start();
        };

        const summary = createDom("div", { className: "summary" });

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

            symbols.appendChild(createDom("li", {
                className: result.status,
                id: "spec_" + result.id,
                title: result.fullName,
            },
            ));

            if (result.status === "failed") {
                failureCount++;

                const failure =
                    createDom("div", { className: "spec-detail failed" },
                        createDom("div", { className: "description" },
                            createDom("a", { title: result.fullName, href: specHref(result) }, result.fullName),
                        ),
                        createDom("div", { className: "messages" }),
                    );
                const messages = failure.childNodes[1];

                for (let i = 0; i < result.failedExpectations.length; i++) {
                    const expectation = result.failedExpectations[i];
                    messages.appendChild(createDom("div", { className: "result-message" }, expectation.message));
                    messages.appendChild(createDom("div", { className: "stack-trace" }, expectation.stack));
                }

                failures.push(failure);
            }

            if (result.status === "pending") {
                pendingSpecCount++;
            }
        };

        this.jasmineDone = function () {
            let specSuiteId = "";
            const banner = find(".banner");
            banner.appendChild(createDom("span", { className: "duration" }, "finished in " + timer.elapsed() / 1000 + "s"));

            const alert = find(".alert");

            alert.appendChild(createDom("span", { className: "exceptions" },
                createDom("label", { className: "label", for: "raise-exceptions" }, "raise exceptions"),
                createDom("input", {
                    className: "raise",
                    id: "raise-exceptions",
                    type: "checkbox",
                }),
            ));
            const checkbox = find("input");

            checkbox.checked = !env.catchingExceptions();
            checkbox.onclick = onRaiseExceptionsClick;

            if (specsExecuted < totalSpecsDefined) {
                const skippedMessage = "Ran " + specsExecuted + " of " + totalSpecsDefined + " specs - run all";
                alert.appendChild(
                    createDom("span", { className: "bar skipped" },
                        createDom("a", { href: "?", title: "Run all specs" }, skippedMessage),
                    ),
                );
            }
            let statusBarMessage = "" + pluralize("spec", specsExecuted) + ", " + pluralize("failure", failureCount);
            if (pendingSpecCount) { statusBarMessage += ", " + pluralize("pending spec", pendingSpecCount); }

            const statusBarClassName = "bar " + ((failureCount > 0) ? "failed" : "passed");
            alert.appendChild(createDom("span", { className: statusBarClassName }, statusBarMessage));

            const results = find(".results");
            results.appendChild(summary);

            summaryList(topResults, summary);

            function summaryList(resultsTree: any, domParent: any) {
                let specListNode;
                for (let i = 0; i < resultsTree.children.length; i++) {
                    const resultNode = resultsTree.children[i];
                    if (resultNode.type === "suite") {
                        specSuiteId = resultNode.result.id;

                        const suiteListNode = createDom("ul", { className: "suite", id: "suite-" + specSuiteId },
                            createDom("li", { className: "suite-detail" },
                                createDom("a", { href: specHref(resultNode.result) }, resultNode.result.description),
                            ),
                        );

                        summaryList(resultNode, suiteListNode);
                        domParent.appendChild(suiteListNode);
                    }
                    if (resultNode.type === "spec") {
                        if (domParent.getAttribute("class") !== "specs") {
                            specListNode = createDom("ul", { className: "specs" });
                            domParent.appendChild(specListNode);
                        }

                        const attributesObj: any = {
                            className: resultNode.result.status,
                            id: "spec-" + resultNode.result.id,
                        };

                        if (specSuiteId) {
                            attributesObj["spec-suite-id"] = specSuiteId;
                        }

                        specListNode.appendChild(
                            createDom("li", attributesObj,
                                createDom("a", { href: specHref(resultNode.result) }, resultNode.result.description),
                            ),
                        );
                    }
                }
            }

            if (failures.length) {
                alert.appendChild(
                    createDom("span", { className: "menu bar spec-list" },
                        createDom("span", {}, "Spec List | "),
                        createDom("a", { className: "failures-menu", href: "#" }, "Failures")));
                alert.appendChild(
                    createDom("span", { className: "menu bar failure-list" },
                        createDom("a", { className: "spec-list-menu", href: "#" }, "Spec List"),
                        createDom("span", {}, " | Failures ")));

                find(".failures-menu").onclick = function () {
                    setMenuModeTo("failure-list");
                };
                find(".spec-list-menu").onclick = function () {
                    setMenuModeTo("spec-list");
                };

                setMenuModeTo("failure-list");

                const failureNode = find(".failures");
                for (let i = 0; i < failures.length; i++) {
                    failureNode.appendChild(failures[i]);
                }
            }

            scrollToSpec(document.querySelector(".summary li.passed"));
        };

        return this;

        function find(selector: any) {
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

        function createDom(type: any, attrs: any, ...childrenVarArgs: any[]) {
            const el = createElement(type);

            for (let i = 2; i < arguments.length; i++) {
                const child = arguments[i];

                if (typeof child === "string") {
                    el.appendChild(createTextNode(child));
                } else {
                    if (child) {
                        el.appendChild(child);
                    }
                }
            }

            for (const attr in attrs) {
                if (attr === "className") {
                    el[attr] = attrs[attr];
                } else {
                    el.setAttribute(attr, attrs[attr]);
                }
            }

            return el;
        }

        function pluralize(singular: any, count: any) {
            const word = (count === 1 ? singular : singular + "s");

            return "" + count + " " + word;
        }

        function specHref(result: any) {
            return "?spec=" + encodeURIComponent(result.fullName);
        }

        function setMenuModeTo(mode: any) {
            htmlReporterMain.setAttribute("class", "html-reporter " + mode);
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
            const qStrPairs = [];
            for (const prop of Object.keys(paramMap)) {
                qStrPairs.push(encodeURIComponent(prop) + "=" + encodeURIComponent(paramMap[prop]));
            }
            return "?" + qStrPairs.join("&");
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
