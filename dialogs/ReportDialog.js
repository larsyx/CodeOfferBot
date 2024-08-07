const { MessageFactory } = require("botbuilder-core");
const { ComponentDialog, TextPrompt, WaterfallDialog, ConfirmPrompt } = require("botbuilder-dialogs");
const axios = require('axios');

const REPORT_DIALOG = 'ReportDialog';
const TEXT_PROMPT = 'TextPrompt';
const WATERFALL_DIALOG = 'WaterfallDialog';
const CONFIRM_PROMPT = 'ConfirmPrompt';
var URL = 'https://reportemailcodeoffer.azurewebsites.net/api/ReportEmailFunction?code=JrWPnYirSaMHp0-_YS_bu8ST1O1KP2A33jvdVGDia8ZPAzFubxLhxQ%3D%3D';

const subject = 'Segnalazione CodeOfferBot';
const to = 'email@email.com';
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

class ReportDialog extends ComponentDialog{
    constructor(){
        super(REPORT_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG,[
            this.emailSender.bind(this),
            this.writeProblem.bind(this),
            this.reviewMail.bind(this),
            this.choiceSelect.bind(this)
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

    async emailSender(step){
        return await step.prompt(TEXT_PROMPT, "inserisci la tua email in modo tale da poter essere ricontattato:");

    }
    async writeProblem(step){
        if(!emailRegex.test(step.result)){
            step.context.sendActivity(MessageFactory.text("Email inserita non valida\n"));
            return step.replaceDialog(WATERFALL_DIALOG);
        }
        
        step.values.sender = step.result;
        return await step.prompt(TEXT_PROMPT, 'Descrivi in modo chiaro e breve il problema riscontrato');
    }

    async reviewMail(step){
        step.values.text = step.result;

        await step.context.sendActivity(`Email: ${step.values.sender}\n`)
        await step.context.sendActivity(`Hai scritto la seguente segnalazione:\n${step.values.text}`);
        return await step.prompt(CONFIRM_PROMPT, 'Vuoi inviare la segnalazione?');
    }
    

    async choiceSelect(step){
        const choice = step.result;
        if(choice){
            URL += '&email='+ step.values.sender+ "&text=\"" + step.values.text+"\"";
            try{

                const response = await axios.get(URL);
                await step.context.sendActivity(MessageFactory.text('Segnalazione inviata con successo'));
            }
            catch(error){
                await step.context.sendActivity(MessageFactory.text(error.response.data));
            }
        }else{
            await step.context.sendActivity(MessageFactory.text('Segnalazione non inviata'));
        }
        return await step.endDialog();
    }
}


module.exports.ReportDialog = ReportDialog;
module.exports.REPORT_DIALOG = REPORT_DIALOG;