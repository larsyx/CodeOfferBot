const { MessageFactory, CardFactory, ActivityTypes } = require("botbuilder-core");
const { ComponentDialog, WaterfallDialog, TextPrompt } = require("botbuilder-dialogs");
const fs = require('fs');
const QueryDb = require("../dbManager/QueryDb");
const PRODUCTS_CARD = '../adaptiveCard/productsCard.json';
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

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }


    async showList(step){
        const prodotti = step.options;
        const cardDefinition = JSON.parse(fs.readFileSync('./adaptiveCard/productsCard.json', 'utf8'));
        
        for(const prodotto of prodotti){
            cardDefinition.body[0].text = prodotto.Nome;
            cardDefinition.body[1].columns[0].items[0].url = prodotto.Immagine;
            cardDefinition.body[1].columns[1].items[1].text = prodotto.Prezzo + " €";
            cardDefinition.body[1].columns[1].items[3].text = prodotto.PrezzoScontato + " €";
            cardDefinition.body[2].text = "ID: " + prodotto.id;
            
            await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(cardDefinition)] });
        }

        return await step.prompt(TEXT_PROMPT, 'Inserisci l\'ID del prodotto per maggiori informazioni:');
    }

    async showProduct(step){
        const result = step.result;
        const product = await QueryDb.queryProduct(result);
        if(product[0] == undefined){
            await step.context.sendActivity('Id inserito non valido');
        }else{
            const cardDefinition = JSON.parse(fs.readFileSync('./adaptiveCard/productCard.json', 'utf8'));

            cardDefinition.body[0].text = product[0].Nome;
            cardDefinition.body[1].items[0].url = product[0].Immagine;
            cardDefinition.body[2].items[1].columns[0].items[0].text = "~~" + product[0].Prezzo + " €~~";
            cardDefinition.body[2].items[1].columns[1].items[0].text = product[0].PrezzoScontato + " €";
            cardDefinition.body[2].items[1].columns[2].items[0].text = "-"+product[0].Sconto +"%";
            cardDefinition.body[4].text = product.Descrizione;
    
            await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(cardDefinition)] });
        }
        return await step.next();
    }
}

module.exports.ShowProductDialog = ShowProductDialog;
module.exports.SHOW_PRODUCT_DIALOG = SHOW_PRODUCT_DIALOG;
