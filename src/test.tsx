const value = 1;
const medom = (
    <div className="html-reporter">
        <div className="banner">
            <span className="title">Jasmine</span>
            <span className="version">{value}</span>
        </div>
        <ul className="symbol-summary" />
        <div className="alert" />
        <div className="results">
            <div className="failures" />
        </div>
    </div>
);
console.log(medom);
