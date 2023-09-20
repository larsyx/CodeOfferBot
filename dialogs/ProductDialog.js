const { MessageFactory,  CardFactory } = require("botbuilder-core");
const { ComponentDialog, ChoicePrompt, WaterfallDialog, TextPrompt } = require("botbuilder-dialogs");
const QueryDb = require("../dbManager/QueryDb");
const CluRequest = require("../clu/CluRequest");
const { SHOW_PRODUCT_DIALOG, ShowProductDialog } = require("./ShowProductDialog");

const CHOICE_PROMPT = 'ChoicePrompt';
const MAIN_DIALOG = 'MainDialog';
const PRODUCT_DIALOG = 'ProductDialog';
const TEXT_PROMPT = 'TextPrompt';
const FIND_PRODUCT = 'FindProduct';
const CATEGORY_PRODUCT = 'CategoryProduct';
const PRODOTTI_STATE = 'ProdottiState';


class ProductDialog extends ComponentDialog{
    constructor(){
        super(PRODUCT_DIALOG);
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ShowProductDialog());
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(MAIN_DIALOG,[
            this.choiceStep.bind(this),
            this.selectChoice.bind(this),
            this.loopStep.bind(this)
        ]));

        this.addDialog(new WaterfallDialog( FIND_PRODUCT, [
            this.findProduct.bind(this),
            this.findAndShow.bind(this),
            this.loopStep.bind(this)
        ]));

        this.addDialog(new WaterfallDialog( CATEGORY_PRODUCT, [
            this.showCategory.bind(this),
            this.showProductByCategory.bind(this),
            this.loopStep.bind(this)
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
            ['Più convenienti', 'Categorie', 'Suggerimenti', 'Cerca','Esci']
        );
        
        
    }

    async selectChoice(step){
        const choice = step.result.value;

        switch(choice){
            case 'Più convenienti':
                await step.context.sendActivity(MessageFactory.text('sono in più convenienti'));
                var prodotti = await QueryDb.queryMoreConvenient();
                return await step.beginDialog(SHOW_PRODUCT_DIALOG, prodotti);
            case 'Categorie':
                return await step.replaceDialog(CATEGORY_PRODUCT);
            case 'Suggerimenti':
                var prodotti = await QueryDb.queryHints();
                return await step.beginDialog(SHOW_PRODUCT_DIALOG, prodotti);
            case 'Cerca':
                return await step.replaceDialog(FIND_PRODUCT);
            case 'Esci':
                return await step.endDialog();
            default:
                await step.context.sendActivity('Operazione non supportata riprova');
                return await step.replaceDialog(MAIN_DIALOG);
        }
    }

    async findProduct(step){
        return await step.prompt(TEXT_PROMPT, 'Cosa stai cercando?');
    }

     async findAndShow(step){
        const result = await CluRequest.productAnalysis(step.result);
        if(result){
            const prodotti = await QueryDb.queryFind(result);
            if(prodotti.length > 0)
                return await step.beginDialog(SHOW_PRODUCT_DIALOG, prodotti);
        }
        await step.context.sendActivity('Nessun prodotto trovato');
        return await step.replaceDialog(MAIN_DIALOG);
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
        const result = step.result;
        const prodotti = await QueryDb.queryCategory(result);
        if(prodotti == undefined || prodotti.length==0){
            step.context.sendActivity('Categoria selezionata non ha prodotti disponibili');
            return await step.replaceDialog(CATEGORY_PRODUCT);
        }
        return await step.beginDialog(SHOW_PRODUCT_DIALOG, prodotti);
     }

     async loopStep(step){
        return step.replaceDialog(MAIN_DIALOG);
     }
}

module.exports.ProductDialog = ProductDialog;
module.exports.PRODUCT_DIALOG = PRODUCT_DIALOG;