const { ComponentDialog, ChoicePrompt, WaterfallDialog } = require("botbuilder-dialogs");
const CHOICE_PROMPT = 'ChoicePrompt';
const WATERFALL_DIALOG = 'WaterfallDialog';
const PRODUCT_DIALOG = 'ProductDialog';

class ProductDialog extends ComponentDialog{
    constructor(userState){
        super(PRODUCT_DIALOG);
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG,[
            this.choiceStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
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

    async choiceStep(step){
        return await step.prompt(CHOICE_PROMPT, 
            'Seleziona un opzione:',
            ['opzione1', 'opzione2', 'opzione3']
        );

    }
}

module.exports.ProductDialog = ProductDialog;
module.exports.PRODUCT_DIALOG = PRODUCT_DIALOG;