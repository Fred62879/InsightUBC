import {Element} from "parse5";

export default class InsightParse5Selector {
    public static isTag(node: Element, tagName: string) {
        return "tagName" in node && node.tagName === tagName;
    }

    public static isNode(node: Element, nodeName: string) {
        return "nodeName" in node && node.nodeName === nodeName;
    }

    public static hasClassName(node: Element, className: string) {
        if (!("attrs" in node)) {
            return false;
        } else {
            for (let attr of node.attrs) {
                if ("value" in attr && attr.value.includes(className)) {
                    return true;
                }
            }
        }
        return false;
    }

    public static findNodeInChildNodes(nodes: Element[], filter?: (node: Element) => boolean,
                                       findAll: boolean = false): Element[] {
        let result: Element[] = [];
        for (let node of nodes) {
            result = result.concat(this.parse5selector(node, filter, findAll));
        }
        return result;
    }

    public static parse5selector(node: Element, filter?: (node: Element) => boolean,
                                 findAll: boolean = false): Element[] {
        let result: Element[] = [];
        if (filter(node)) {
            result.push(node);
            if (!findAll) {
                return result;
            }
        } else if ("childNodes" in node) {
            return result.concat(this.findNodeInChildNodes(node.childNodes, filter, findAll));
        } else {
            return result;
        }
    }

    public static hasTableHeader(node: Element, header: string): boolean {
        if ("childNodes" in node) {
            for (let tableNode of node.childNodes) {
                if (InsightParse5Selector.isTag(tableNode, "thead")) {
                    let tableNodeElement: Element = tableNode as Element;
                    if ("childNodes" in tableNodeElement) {
                        for (let headNode of tableNodeElement.childNodes) {
                            if (InsightParse5Selector.isTag(headNode, "tr")) {
                                let headNodeElement: Element = headNode as Element;
                                if ("childNodes" in headNodeElement) {
                                    for (let trNode of headNodeElement.childNodes) {
                                        if (InsightParse5Selector.isTag(trNode, "th")) {
                                            let trNodeElement: Element = trNode as Element;
                                            if ("childNodes" in trNodeElement) {
                                                for (let thNode of trNodeElement.childNodes) {
                                                    if (InsightParse5Selector.isNode(thNode, "#text")) {
                                                        let thNodeElement: Element = thNode as Element;
                                                        if ("value" in thNodeElement) {
                                                            if (String(thNodeElement["value"]).includes(header)) {
                                                                return true;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    public static isBuildingLink(node: Element): boolean {
        return InsightParse5Selector.isTag(node, "a") && "childNodes" in node &&
            InsightParse5Selector.isNode(node.childNodes[0], "#text");
    }

    public static isTableBodyRow(node: Element): boolean {
        return InsightParse5Selector.isTag(node, "tr");
    }

    public static isTableBody(node: Element): boolean {
        return InsightParse5Selector.isTag(node, "tbody");
    }

    public static getTextFromFirstChildTextNode(node: Element): string {
        if ("childNodes" in node) {
            for (let textNode of node.childNodes) {
                if (InsightParse5Selector.isNode(textNode, "#text")) {
                    if ("value" in textNode) {
                        return String(textNode["value"]).trim();
                    }
                }
            }
        }
        return "";
    }

    public static getAttrValue(node: Element, attrName: string): string {
        if ("attrs" in node) {
            for (let attr of node.attrs) {
                if ("name" in attr && attr.name === attrName && "value" in attr) {
                    return attr.value;
                }
            }
        }
        return "";
    }

    public static getTextFromFirstATag(node: Element) {
        let aTag: Element = InsightParse5Selector.parse5selector(node, (sNode: Element) => {
            return InsightParse5Selector.isTag(sNode, "a");
        })[0];
        return InsightParse5Selector.getTextFromFirstChildTextNode(aTag);
    }

}
