const { AttachmentLayoutTypes, CardFactory, MessageFactory, ActivityTypes } = require('botbuilder');
const { TextPrompt, ChoicePrompt, ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
const { REPORT_DIALOG, ReportDialog } = require('./ReportDialog');
const { PRODUCT_DIALOG, ProductDialog } = require('./ProductDialog');
const fs = require('fs');
const SOCIAL_CARD = require('../adaptiveCard/SocialCard.json');
const INFO_CARD = require('../adaptiveCard/infoCard.json');
const PRODUCT_CARD = require("../adaptiveCard/productsCard.json");

const CHOICE_PROMPT = 'ChoicePrompt';
const WATERFALL_DIALOG = 'WaterfallDialog';
const TEXT_PROMPT = 'TextPrompt';
const MAIN_DIALOG = 'MainDialog';

class MainDialog extends ComponentDialog {
    constructor() {
        super(MAIN_DIALOG);

        // Define the main dialog and its related components.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ReportDialog());
        this.addDialog(new ProductDialog());
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG,[
            this.welcomeStep.bind(this),
            this.menuStep.bind(this),
            this.optionStep.bind(this),
            this.loopStep.bind(this)
        ]));

        // The initial child Dialog to run.
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

    async welcomeStep(step){;
        var messagetext = 'Benvenuto nel seguente bot come posso aiutarla\nper iniziare scriva menu\n';

        return await step.prompt(TEXT_PROMPT, {
            prompt: messagetext
        });
    }

    async menuStep(step){
        const optionSelected = step.result.toLowerCase();
        if(optionSelected === 'menu'){
            const menu = CardFactory.heroCard(
                'Menu',
                'Seleziona un opzione:',
                null,
                [
                    {
                        type: 'imBack',
                        title: 'Prodotti',
                        value: 'Prodotti'
                    },
                    {
                        type: 'imBack',
                        title: 'Social',
                        value: 'Social'
                    },
                    {
                        type: 'imBack',
                        title: 'Informazioni',
                        value: 'Informazioni'
                    },
                    {
                        type: 'imBack',
                        title: 'Segnalazione',
                        value: 'Segnalazione'
                    }
                ]
            );

            const menuMessage = {attachments: [menu]};
            await step.context.sendActivity(menuMessage);
            return await step.prompt(TEXT_PROMPT);  
        }else{
            return await step.next(optionSelected);
        }
    }
    async optionStep(step){
        const optionSelected = step.result.toLowerCase();
        console.log("ricevuto: " + optionSelected);
        if(optionSelected === 'informazioni'){
            await step.context.sendActivity({
                attachments: [CardFactory.adaptiveCard(INFO_CARD)]
            });
            return await step.next();
        }else if(optionSelected === 'prodotti'){
            return await step.beginDialog(PRODUCT_DIALOG);
        }else if(optionSelected === 'social'){
            await step.context.sendActivity({
                attachments: [CardFactory.adaptiveCard(SOCIAL_CARD)]
            });
            return await step.next();
        }else if(optionSelected === 'segnalazione'){
            return await step.beginDialog(REPORT_DIALOG);
        }else{
            await step.context.sendActivity(MessageFactory.text('Opzione selezionata non supportata riprova\n'))
            console.log("ricevuto: " + optionSelected);
            return await step.replaceDialog(this.id);
        }
    } 

    async loopStep(step){
        console.log("sono in loop");
        return await step.replaceDialog(this.id);
    }
}

module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;