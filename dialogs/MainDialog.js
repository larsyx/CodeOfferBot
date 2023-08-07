const { AttachmentLayoutTypes, CardFactory, MessageFactory, ActivityTypes } = require('botbuilder');
const { TextPrompt, ChoicePrompt, ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
const { ReportDialog } = require('./ReportDialog');
const { ProductDialog } = require('./ProductDialog');
const AdaptiveCard = require('../adaptiveCard.json');

const CHOICE_PROMPT = 'ChoicePrompt';
const WATERFALL_DIALOG = 'WaterfallDialog';
const TEXT_PROMPT = 'TextPrompt';

class MainDialog extends ComponentDialog {
    constructor() {
        super('MainDialog');

        // Define the main dialog and its related components.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ReportDialog());
        this.addDialog(new ProductDialog());
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG,[
            this.welcomeStep.bind(this),
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

    async welcomeStep(step){
        var messagetext = 'Benvenuto nel seguente bot come posso aiutarla\nper iniziare scriva menu\n';
        var message = MessageFactory.text(messagetext);
        return await step.prompt(TEXT_PROMPT, {
            prompt: message
        });
    }

    async optionStep(step){
        const optionSelected = step.result.toLowerCase();
        console.log("ricevuto: " + optionSelected);
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
            return await step.prompt(TEXT_PROMPT, {
                prompt: 'Seleziona un\'opzione dal menu per proseguire!'
            });

        }else if(optionSelected === 'informazioni'){
            const social = CardFactory.heroCard();
        }else if(optionSelected === 'prodotti'){
            return await step.beginDialog(ProductDialog);
        }else if(optionSelected === 'social'){
            const social = CardFactory.heroCard();
        }else if(optionSelected === 'segnalazione'){
            return await step.beginDialog(ReportDialog);
        }else{
            await step.context.sendActivity(MessageFactory.text('Opzione selezionata non supportata riprova\n'))
            console.log("ricevuto: " + optionSelected);
            return await step.replaceDialog(WATERFALL_DIALOG);
        }
        return await step.replaceDialog(this.id);
    } 
    async loopStep(step){
        return await step.replaceDialog(this.id);
    }
}

module.exports.MainDialog = MainDialog;