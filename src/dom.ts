namespace MyJsxFactory {
    interface AttributeCollection {
        [name: string]: string;
    }

    type childNode = string | Node;

    export function createElement(tagName: string, attributes: AttributeCollection | null, ...children: childNode[]): Element {
        const element = document.createElement(tagName);

        if (attributes) {
            for (const key of Object.keys(attributes)) {
                element.setAttribute(key, attributes[key]);
            }
        }

        for (const child of children) {
            appendChild(element, child);
        }

        return element;
    }

    function appendChild(parent: Node, child: childNode) {
        if (typeof child === "string") {
            parent.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            parent.appendChild(child);
        } else {
            parent.appendChild(document.createTextNode(`${child}`));
            // throw new Error("Unsupported child");
        }
    }
}
