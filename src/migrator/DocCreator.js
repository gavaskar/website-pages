const MigrationError = require("./MigrationError");

class DocCreator {
    constructor(args) {
        this.doc = {title: "", body: "", sections: []};
        this.status = "SUCCESS";
    }

    addNewSectionWithTitle(title) {
        this.doc.sections.push({type: "section", title, body: "", elements: []});
    }
    
    addElement(element) {
        if (!element) {
            this.status = "WARNING";
            return;
        }
        
        let lastSection = this.doc.sections.slice(-1).pop();
        if (!lastSection) {
            this.addNewSectionWithTitle("");
            lastSection = this.doc.sections.slice(-1).pop();
        }
        lastSection.elements.push(element);
    }
    
    addReferences(references) {
        if (this.doc.references) {
            throw new MigrationError(MigrationError.Code.MULTIPLE_REFERENCES);
        }
        this.doc.references = references;
    }
    
    addDisclaimer(disclaimer) {
        if (this.doc.disclaimer) {
            throw new MigrationError(MigrationError.Code.MULTIPLE_DISCLAIMER);
        }
        this.doc.disclaimer = disclaimer;
    }

    lastSection() {
        return this.doc.sections.slice(-1).pop();
    }
}

module.exports = DocCreator;