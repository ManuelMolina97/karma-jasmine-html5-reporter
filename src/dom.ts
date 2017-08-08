namespace MyJsxFactory {
    interface AttributeCollection {
        [name: string]: string;
    }

    type childNode = string | Node;

    export function createElement(tagName: string, attributes: AttributeCollection | null, ...children: childNode[]): HTMLElement {
        const element = document.createElement(tagName);

        if (attributes) {
            for (const [attrName, attrValue] of Object.entries(attributes)) {
                (element as any)[attrName] = attrValue;
            }
        }

        for (const child of children) {
            appendChild(element, child);
        }

        return element;
    }

    function appendChild(parent: Node, child: childNode | childNode[]) {
        if (typeof child === "string") {
            parent.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            parent.appendChild(child);
        } else if (Array.isArray(child)) {
            child.forEach(realChild => appendChild(parent, realChild));
        } else {
            parent.appendChild(document.createTextNode(`${child}`));
            // throw new Error("Unsupported child");
        }
    }
}
