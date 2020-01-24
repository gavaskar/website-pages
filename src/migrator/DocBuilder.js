// @flow
import MigrationError, {ConversionIssueCode} from "./MigrationError";
import {omit} from "lodash";

export default class DocBuilder {
    doc: Object;

    constructor() {
        this.doc = {title: "", body: "", sections: []};
    }

    add(item: Object) {
        switch (item.type) {
            case "section": this.addNewSectionWithTitle(item.title); break;
            case "disclaimer": this.addDisclaimer(item); break;
            case "references": this.addReferences(item); break;
            case "faq": this.addFAQ(item); break;
            default: this.addElement(item);
        }
    }

    addNewSectionWithTitle(title: string) {
        this.doc.sections.push({type: "section", title, body: "", elements: []});
    }
    
    addElement(element: Object) {
        let lastSection = this.doc.sections.slice(-1).pop();
        if (!lastSection) {
            this.addNewSectionWithTitle("");
            lastSection = this.doc.sections.slice(-1).pop();
        }
        lastSection.elements.push(element);
    }
    
    addReferences(references: Object) {
        if (!this.doc.references) {
            this.doc.references = [];
        }
        this.doc.references.push(omit(references, ["type"]));
    }
    
    addDisclaimer(disclaimer: Object) {
        if (this.doc.disclaimer) {
            throw new MigrationError(ConversionIssueCode.MULTIPLE_DISCLAIMER);
        }
        this.doc.disclaimer = omit(disclaimer, ["type"]);
    }

    addFAQ(element: Object) {
        if (this.doc.faq) {
            throw new MigrationError(ConversionIssueCode.MULTIPLE_FAQ);
        }
        this.doc.faq = omit(element, "type");
    }

    lastSection() {
        return this.doc.sections.slice(-1).pop();
    }

    build() {
        return this.doc;
    }
}