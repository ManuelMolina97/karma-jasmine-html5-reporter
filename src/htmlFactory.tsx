export class HtmlFactory {

    readonly MAXIMUM_CARDS_IN_COLUMN = 5;
    readonly MAXIMUM_CHECKBOXS_IN_COLUMN = 4;
    private _cards: any = {};
    private _config: any;
    private _results: Element;

    constructor(config: any) {
        this._cards = {};
        this._config = config;
    }

    public createCard(result: any) {
        const title = result.description;
        const status = result.status === "passed" ? "is-success" : (result.status === "failed" ? "is-danger" : "is-warning");
        const message = { ...result.passedExpectations[0], ...result.failedExpectations[0] }.message;
        const stack = { ...result.passedExpectations[0], ...result.failedExpectations[0] }.stack;
        const id = result.id;
        console.log(this);
        this._cards[id] = {
            message,
            stack,
        };

        return (
            <div className="card column is-one-fifth">
                <div className="card-content">
                    <div className={`media notification ${status}`} />
                    <div className="content has-text-centered">
                        <p className="title is-size-7"> {title} </p>
                        {
                            status !== "is-success" && message ? (
                                this.createButton(id, "message")
                            ) : ""
                        }
                        {
                            status !== "is-success" && stack ? (
                                this.createButton(id, "stack")
                            ) : ""
                        }
                    </div>
                </div>
            </div>
        );
    }

    public createCheckbox(checkbox: string) {
        return (
            <div className="is-offset-1 column">
                <input id={checkbox} type="checkbox" checked={this._config.reporterConfig[checkbox]} />
                <label htmlFor={checkbox} > {checkbox} </label>
            </div>
        );
    }

    public createMessage(id: string, type: string) {
        return (
            <article id={`${id}${type}`} className="message is-small">
                <div className="message-header">
                    <p>{`${type} error.`}</p>
                    <button className="delete" aria-label="delete" onClick={e => {
                        e.preventDefault();
                        const message = this.find(`#${id}${type}`);
                        const button = this.createButton(id, type);

                        if (type === "message") {
                            message.parentNode.insertBefore(button, message.parentNode.childNodes[1]);
                        } else {
                            message.parentNode.appendChild(button);
                        }

                        message.parentNode.removeChild(message);
                    }}></button>
                </div>
                <div className="message-body">
                    {type === "message" ? this._cards[id].message : this._cards[id].stack}
                </div>
            </article>
        );
    }

    public createButton(id: string, type: string) {
        return (
            <button id={`${id}${type}`} className="button is-small m-t-md m-b-xxs" onClick={e => {
                e.preventDefault();
                const button = this.find(`#${id}${type}`);
                button.parentNode.appendChild(this.createMessage(id, type));
                button.parentNode.removeChild(button);
            }}>{type === "message" ? "Show error message" : "Show error stack"}</button>
        );
    }

    public createColumns(elements: any[], limit: number, htmlFactory: (element: string | any) => JSX.Element): JSX.Element[] {
        let i = 0;
        const columns: JSX.Element[] = [];

        let slice = elements.slice(i, i + limit);

        while (slice.length > 0) {
            columns.push(
                (
                    <div className="columns">
                        {
                            slice.map(htmlFactory)
                        }
                    </div>
                ),
            );
            i += limit;
            slice = elements.slice(i, i + limit);
        }

        return columns;
    }

    get results(): Element {
        return this._results;
    }

    set results(resultsNode: Element) {
        this._results = resultsNode;
    }

    public showCards(_cards: any[]) {
        this.clean(this._results);
        this.createColumns(_cards, this.MAXIMUM_CARDS_IN_COLUMN, this.createCard)
        .forEach((column: JSX.Element) => this._results.appendChild(column));
    }

    private clean(node: Element) {
        node.innerHTML = "";
    }

    public find(selector: string): any {
        return this.getContainer().querySelector(selector);
    }

    private getContainer(): any {
        return document.body;
    }
}
