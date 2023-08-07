const { ComponentDialog } = require("botbuilder-dialogs");

class ReportDialog extends ComponentDialog{
    constructor(){
        super('ReportDialog');
    }
}

module.exports.ReportDialog = ReportDialog;