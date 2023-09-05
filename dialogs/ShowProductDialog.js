const { MessageFactory } = require("botbuilder-core");
const { ComponentDialog, WaterfallDialog, TextPrompt } = require("botbuilder-dialogs");
const SHOW_PRODUCT_DIALOG = 'ShowProductDialog';
const WATERFALL_DIALOG = 'WaterfallDialog';
const PRODOTTI_STATE = 'ProdottiState';
const TEXT_PROMPT = 'TextPrompt';

class ShowProductDialog extends ComponentDialog{
    constructor(){
        super(SHOW_PRODUCT_DIALOG);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG,[
            this.showList.bind(this),
            this.showProduct.bind(this)
        ]));
        
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        console.log('sono in run');
        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }


    async showList(step){
        const prodotti = step.options;
        for(const prodotto of prodotti){
            step.context.sendActivity(`Scrivo: ${prodotto.id}, ${prodotto.Nome}`);
        }

        return await step.endDialog();
    }

    async showProduct(step){
        console.log('sono in show');
    }
}

module.exports.ShowProductDialog = ShowProductDialog;
module.exports.SHOW_PRODUCT_DIALOG = SHOW_PRODUCT_DIALOG;
