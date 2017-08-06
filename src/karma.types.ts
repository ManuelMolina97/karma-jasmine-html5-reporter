
export interface KarmaResult {
    description: string;
    id: string;
    log: any[];
    skipped: boolean;
    disabled: boolean;
    pending: boolean;
    success: boolean;
    suite: string[];
    time: number;
    executedExpectationsCount: number;
}

export interface Results {
    success?: number;
    failed?: number;
    skipped?: number;
    error: boolean;
    disconnected: boolean;
    exitCode?: number;
}

export interface BrowserResult extends Results {
    total: number;
    totalTime: number;
    netTime: number;
    totalTimeEnd: Function;
    add: Function;
}

export interface Browser {
    id: string;
    fullName: string;
    name: string;
    state: number;
    lastResult: BrowserResult;
    disconnectsCount: number;
    init: Function;
    isReady: Function;
    toString: Function;
    onKarmaError: Function;
    onInfo: Function;
    onStart: Function;
    onComplete: Function;
    onDisconnect: Function;
    reconnect: Function;
    onResult: Function;
    serialize: Function;
    execute: Function;
}

export interface BaseReporter {
    adapters: any[];
    USE_COLORS: boolean;
    EXCLUSIVELY_USE_COLORS: boolean;
    LOG_SINGLE_BROWSER: string;
    LOG_MULTI_BROWSER: string;

    SPEC_FAILURE: string;
    SPEC_SLOW: string;
    ERROR: string;
    FINISHED_ERROR: string;
    FINISHED_SUCCESS: string;
    FINISHED_DISCONNECTED: string;

    X_FAILED: string;

    TOTAL_SUCCESS: string;
    TOTAL_FAILED: string;
    adapter(message: string): void;
    write(...args: any[]): void;
    writeCommonMsg(...args: any[]): void;
    onRunStart(browsers: KarmaCollection): void;
    onBrowserStart(browser: Browser): void;
    specSuccess(browser: Browser, result: KarmaResult): void;
    specFailure(browser: Browser, result: KarmaResult): void;
    onSpecComplete(browser: Browser, result: KarmaResult): void;
    onRunComplete(brosersCollection: KarmaCollection, results: Results): void;
    renderBrowser(browser: Browser): void;
    onBrowserError(browser: Browser, error: any): void;
    onBrowserLog(browser: Browser, log: any, type: any): void;
}

export interface CustomReporter extends BaseReporter {
    config: any;
}

export interface KarmaCollection {
    add: Function;
    remove: Function;
    getById: Function;
    setAllToExecuting: Function;
    areAllReady: Function;
    serialize: Function;
    getResults: Function;
    clearResults: Function;
    clone: Function;
    map: Function;
    forEach: Function;
}
