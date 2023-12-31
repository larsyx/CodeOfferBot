const { MessageFactory, CardFactory, ActivityTypes } = require("botbuilder-core");
const { ComponentDialog, WaterfallDialog, TextPrompt } = require("botbuilder-dialogs");
const CluRequest = require("../clu/CluRequest");
const fs = require('fs');
const QueryDb = require("../dbManager/QueryDb");
const PRODUCTS_CARD = '../adaptiveCard/productsCard.json';
const SHOW_PRODUCT_DIALOG = 'ShowProductDialog';
const SHOW_LIST_WATERFALL = 'showListWaterfall';
const WATERFALL_DIALOG = 'WaterfallDialog';
const TEXT_PROMPT = 'TextPrompt';
const PAGE = 10;

class ShowProductDialog extends ComponentDialog{
    constructor(){
        super(SHOW_PRODUCT_DIALOG);

        this.addDialog(new WaterfallDialog(SHOW_LIST_WATERFALL,[
            this.showList.bind(this),
        ]));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG,[
            this.selectId.bind(this),
            this.showProduct.bind(this),
            this.endStep.bind(this)
        ]));
        
        this.initialDialogId = SHOW_LIST_WATERFALL;
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
        let PAGEN = PAGE;
        
        if(prodotti.length<PAGE)
            PAGEN = prodotti.length;
        
        for(let i=PAGEN-1; i>=0; i--){
            const cardDefinition = createCardSmallProduct(prodotti[i]);
            await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(cardDefinition)] });
        }
        return await step.beginDialog(WATERFALL_DIALOG, prodotti);
    }

    async selectId(step){
        await step.context.sendActivity('Inserisci l\'ID del prodotto per maggiori informazioni:')
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
                }else{
                    const arr = step.options.slice(PAGE);
                    return await step.replaceDialog(SHOW_LIST_WATERFALL, arr );
                }
             default:
                const id = await CluRequest.productSelectId(result); 
                if(id != undefined){
                    const product = await QueryDb.queryProduct(id);
                    if(product[0] == undefined){
                        await step.context.sendActivity('ID inserito non valido');
                    }else{
                        const cardDefinition = createCardProduct(product[0]);
                        await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(cardDefinition)] });
                    } 
                }else
                    await step.context.sendActivity('comando inserito non valido');
        }
        return await step.next();
    }

    async endStep(step){
        return await step.replaceDialog(WATERFALL_DIALOG, step.options); 
    }
}

function createCardSmallProduct(product){
    const cardDefinition = JSON.parse(fs.readFileSync('./adaptiveCard/productsCard.json', 'utf8'));

    cardDefinition.body[0].text = product.Nome;
    cardDefinition.body[1].columns[0].items[0].url = product.Immagine;
    cardDefinition.body[1].columns[1].items[1].text = product.Prezzo + " €";
    cardDefinition.body[1].columns[1].items[3].text = product.PrezzoScontato + " €";
    cardDefinition.body[2].text = "ID: " + product.id;

    return cardDefinition;
}

function createCardProduct(product){
    const cardDefinition = JSON.parse(fs.readFileSync('./adaptiveCard/productCard.json', 'utf8'));
                        
    cardDefinition.body[0].text = product.Nome;
    cardDefinition.body[1].items[0].url = product.Immagine;
    cardDefinition.body[2].items[1].columns[0].items[0].text = "~~" + product.Prezzo + " €~~";
    cardDefinition.body[2].items[1].columns[1].items[0].text = product.PrezzoScontato + " €";
    cardDefinition.body[2].items[1].columns[2].items[0].text = "-"+product.Sconto +"%";
    cardDefinition.body[4].text = product.Descrizione;
    cardDefinition.body[5].actions[0].url = product.link;

    return cardDefinition;
}

module.exports.ShowProductDialog = ShowProductDialog;
module.exports.SHOW_PRODUCT_DIALOG = SHOW_PRODUCT_DIALOG;
