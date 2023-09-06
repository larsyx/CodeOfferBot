const { MessageFactory,  CardFactory } = require("botbuilder-core");
const { ComponentDialog, ChoicePrompt, WaterfallDialog, TextPrompt } = require("botbuilder-dialogs");
const QueryDb = require("../dbManager/QueryDb");
const { SHOW_PRODUCT_DIALOG, ShowProductDialog } = require("./ShowProductDialog");

const CHOICE_PROMPT = 'ChoicePrompt';
const MAIN_DIALOG = 'MainDialog';
const PRODUCT_DIALOG = 'ProductDialog';
const TEXT_PROMPT = 'TextPrompt';
const FIND_PRODUCT = 'FindProduct';
const CATEGORY_PRODUCT = 'CategoryProduct';
const PRODOTTI_STATE = 'ProdottiState';


class ProductDialog extends ComponentDialog{
    constructor(userState){
        super(PRODUCT_DIALOG);
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ShowProductDialog());
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(MAIN_DIALOG,[
            this.choiceStep.bind(this),
            this.selectChoice.bind(this)
        ]));

        this.addDialog(new WaterfallDialog( FIND_PRODUCT, [
            this.findProduct.bind(this),
            this.findAndShow.bind(this),
        ]));

        this.addDialog(new WaterfallDialog( CATEGORY_PRODUCT, [
            this.showCategory.bind(this),
            this.showProductByCategory.bind(this),
        ]));

        this.addDialog
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
                var prodotti = await QueryDb.queryMoreConvenient();
                return await step.beginDialog(SHOW_PRODUCT_DIALOG, prodotti);
                break;
            case 'Categorie':
                return await step.replaceDialog(CATEGORY_PRODUCT);
            case 'Suggerimenti':
                var prodotti = await QueryDb.queryHints();
                return await step.beginDialog(SHOW_PRODUCT_DIALOG, prodotti);
                break;
            case 'Cerca':
                return await step.replaceDialog(FIND_PRODUCT);
            default:
                await step.context.sendActivity('Operazione non supportata riprova');
                return await step.replaceDialog(MAIN_DIALOG);
        }
    }

    async findProduct(step){
        return await step.prompt(TEXT_PROMPT, 'Cosa stai cercando?');
    }

     async findAndShow(step){
        const result = step.result;
        const prodotti = await QueryDb.queryFind(result);

        return await step.beginDialog(SHOW_PRODUCT_DIALOG, prodotti);
     }

     async showCategory(step){
        const categories = await QueryDb.queryGetCategories();
        const buttons = [];
        for(const category of categories ){
            const button = {
                type: 'imBack',
                title: category.Categoria,
                value: category.Categoria 
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
        await step.context.sendActivity(menuMessage);
        return await step.prompt(TEXT_PROMPT);
    }

     async showProductByCategory(step){
        console.log('Sono in funzione show Product by category');
        const result = step.result;
        await step.context.sendActivity(MessageFactory.text('Hai selezionato la categoria: ' + result));
        const prodotti = await QueryDb.queryCategory(result);
        return await step.beginDialog(SHOW_PRODUCT_DIALOG, prodotti);
     }
}

module.exports.ProductDialog = ProductDialog;
module.exports.PRODUCT_DIALOG = PRODUCT_DIALOG;