const { MessageFactory,  CardFactory } = require("botbuilder-core");
const { ComponentDialog, ChoicePrompt, WaterfallDialog, TextPrompt } = require("botbuilder-dialogs");
const QueryDb = require("../dbManager/QueryDb");

const CHOICE_PROMPT = 'ChoicePrompt';
const MAIN_DIALOG = 'MainDialog';
const PRODUCT_DIALOG = 'ProductDialog';
const TEXT_PROMPT = 'TextPrompt';7
const FIND_PRODUCT = 'FindProduct';
const CATEGORY_PRODUCT = 'CategoryProduct';


class ProductDialog extends ComponentDialog{
    constructor(userState){
        super(PRODUCT_DIALOG);
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(MAIN_DIALOG,[
            this.choiceStep.bind(this),
            this.selectChoice.bind(this)
        ]));
        this.addDialog(new WaterfallDialog( FIND_PRODUCT, [
            this.findProduct.bind(),
            this.findAndShow.bind(),
        ]));

        this.addDialog(new WaterfallDialog( CATEGORY_PRODUCT, [
            this.showCategory.bind(),
            this.showProductByCategory.bind(),
        ]));

        this.initialDialogId = MAIN_DIALOG;
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
            ['Più convenienti', 'Categorie', 'Suggerimenti', 'Cerca']
        );
    }

    async selectChoice(step){
        const choice = step.result.value;

        switch(choice){
            case 'Più convenienti':
                await step.context.sendActivity(MessageFactory.text('sono in più convenienti'));
                return await step.replaceDialog(MAIN_DIALOG);
                break;
            case 'Categorie':
                return await step.replaceDialog(CATEGORY_PRODUCT);
            case 'Suggerimenti':
                await step.context.sendActivity(MessageFactory.text('sono in suggerimenti'));
                return await step.replaceDialog(MAIN_DIALOG);
                break;
            case 'Cerca':
                return await step.replaceDialog(FIND_PRODUCT);
            default:
                await step.context.sendActivity(MessageFactory.text('Operazione non supportata riprova'));
                return await step.replaceDialog(MAIN_DIALOG);
        }
    }

    async findProduct(step){
        return await step.prompt(TEXT_PROMPT, 'Cosa stai cercando?');
    }

     async findAndShow(step){
        const result = step.result;
        await step.context.sendActivity(MessageFactory.text('Stai cercando: ' + result));
        return await step.next;
     }

     async showCategory(step){
        const categories = ['Moda', 'Informatica', 'Musica', 'Meccanica'];
        const buttons = [];
        for(const category of categories ){
            const button = {
                type: 'imBack',
                title: category,
                value: category 
            };
            buttons.push(button);
        }
        
        const menu = CardFactory.heroCard(
            'Menu',
            'Seleziona un opzione:',
            null,
            buttons
        );

        const menuMessage = {attachments: [menu]};
        return await step.context.sendActivity(menuMessage);

    }

     async showProductByCategory(step){
        ConsoleTranscriptLogger.log('Sono in funzione show Product by category');
        const result = step.result;
        await step.context.sendActivity(MessageFactory.text('Hai selezionato la categoria: ' + result));
        return await step.endDialog();
     }
}

module.exports.ProductDialog = ProductDialog;
module.exports.PRODUCT_DIALOG = PRODUCT_DIALOG;