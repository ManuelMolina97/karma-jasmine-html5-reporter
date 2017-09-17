import { notify } from "node-notifier";
import { KarmaResult } from "../interfaces/karma.types";
import * as path from "path";

export class NotificationService {

    constructor() { }

    notify(result: KarmaResult) {
        const color = this.chooseColor(result);
        console.log(result);
        notify({
            title: result.description,
            message: `
            suites: ${result.suite.toString()},
            time: ${result.time}ms,
            `,
            icon: path.join(`${__dirname}/../assets/${color}-icon.png`),
        });
    }

    private chooseColor(result: KarmaResult) {
        let color;
        if (result.pending || result.skipped) {
            color = "yellow";
        } else if (result.success) {
            color = "green";
        } else {
            color = "red";
        }

        return color;
    }

}
