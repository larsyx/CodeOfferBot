const { MessageFactory, CardFactory, ActivityTypes } = require("botbuilder-core");
const { ComponentDialog, WaterfallDialog, TextPrompt } = require("botbuilder-dialogs");
const fs = require('fs');
const QueryDb = require("../dbManager/QueryDb");
const PRODUCTS_CARD = '../adaptiveCard/productsCard.json';
const SHOW_PRODUCT_DIALOG = 'ShowProductDialog';
const WATERFALL_DIALOG = 'WaterfallDialog';
const TEXT_PROMPT = 'TextPrompt';
const PAGE = 10;

class ShowProductDialog extends ComponentDialog{
    constructor(){
        super(SHOW_PRODUCT_DIALOG);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG,[
            this.showList.bind(this),
            this.showProduct.bind(this),
            this.loopStep.bind(this)
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
        let PAGEN = PAGE;
        
        if(prodotti.length<PAGE)
            PAGEN = prodotti.length;
        
        for(let i=PAGEN-1; i>=0; i--){
            cardDefinition.body[0].text = prodotti[i].Nome;
            cardDefinition.body[1].columns[0].items[0].url = prodotti[i].Immagine;
            cardDefinition.body[1].columns[1].items[1].text = prodotti[i].Prezzo + " €";
            cardDefinition.body[1].columns[1].items[3].text = prodotti[i].PrezzoScontato + " €";
            cardDefinition.body[2].text = "ID: " + prodotti[i].id;
            
            await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(cardDefinition)] });
        }
        step.context.sendActivity('Inserisci l\'ID del prodotto per maggiori informazioni:')
        return await step.prompt(TEXT_PROMPT, 'Scrivi continua per visualizzare altri prodotti, esci per uscire:');       
    }

    async showProduct(step){
        const result = step.result.toLowerCase();
        
        switch(result){
            case 'exit':
            case 'esci':
                return await step.endDialog();
            case 'continua':
            case 'avanti':
                if(step.options.length<=PAGE){
                    await step.context.sendActivity('Non ci sono più prodotti da visualizzare. Fai una nuova ricerca');
                    return await step.endDialog();
                }else 
                    return await step.replaceDialog(WATERFALL_DIALOG, step.options.slice(PAGE));
             default:
                if(!isNaN(result)){
                    const product = await QueryDb.queryProduct(result);
                    if(product[0] == undefined){
                        await step.context.sendActivity('ID inserito non valido');
                    }else{
                        const cardDefinition = JSON.parse(fs.readFileSync('./adaptiveCard/productCard.json', 'utf8'));

                        cardDefinition.body[0].text = product[0].Nome;
                        cardDefinition.body[1].items[0].url = product[0].Immagine;
                        cardDefinition.body[2].items[1].columns[0].items[0].text = "~~" + product[0].Prezzo + " €~~";
                        cardDefinition.body[2].items[1].columns[1].items[0].text = product[0].PrezzoScontato + " €";
                        cardDefinition.body[2].items[1].columns[2].items[0].text = "-"+product[0].Sconto +"%";
                        cardDefinition.body[4].text = product[0].Descrizione;
                        cardDefinition.body[5].actions[0].url = product[0].link;
                        await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(cardDefinition)] });
                    } 
                }else
                    await step.context.sendActivity('comando inserito non valido');
        }
        return await step.prompt(TEXT_PROMPT,'Invia qualsiasi cosa per continuare');

    }

    async loopStep(step){
        return await step.replaceDialog(WATERFALL_DIALOG, step.options); 
    }
}

module.exports.ShowProductDialog = ShowProductDialog;
module.exports.SHOW_PRODUCT_DIALOG = SHOW_PRODUCT_DIALOG;
