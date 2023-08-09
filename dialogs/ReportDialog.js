const { ComponentDialog } = require("botbuilder-dialogs");

class ReportDialog extends ComponentDialog{
    constructor(){
        super('ReportDialog');
        
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }
}

module.exports.ReportDialog = ReportDialog;