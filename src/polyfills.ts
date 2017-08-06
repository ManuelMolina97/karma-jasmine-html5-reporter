import PromisePolyfill from "promise-polyfill";
import "whatwg-fetch";

if (!(window as any).Promise) {
    (window as any).Promise = PromisePolyfill;
}
