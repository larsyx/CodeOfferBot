const { MessageFactory } = require("botbuilder-core");
const { ComponentDialog, TextPrompt, WaterfallDialog, ConfirmPrompt } = require("botbuilder-dialogs");

const REPORT_DIALOG = 'ReportDialog';
const TEXT_PROMPT = 'TextPrompt';
const WATERFALL_DIALOG = 'WaterfallDialog';
const CONFIRM_PROMPT = 'ConfirmPrompt';

const subject = 'Segnalazione CodeOfferBot';
const to = 'email@email.com';
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
var text, sender, user,pass;

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
        sender = step.result;
        if(!emailRegex.test(sender)){
            step.context.sendActivity(MessageFactory.text("Email inserita non valida\n"));
            return step.replaceDialog(WATERFALL_DIALOG);
        }
        console.log("sender: " + sender);
        return await step.prompt(TEXT_PROMPT, 'Descrivi in modo chiaro e breve il problema riscontrato');
    }

    async reviewMail(step){
        text = step.result;
        console.log( 'testo scritto:' + text);
        step.context.sendActivity(MessageFactory.text("Hai scritto la seguente segnalazione\n" + text ));
        return await step.prompt(CONFIRM_PROMPT, 'Vuoi inviare la segnalazione?');
        
    }

    async choiceSelect(step){
        const choice = step.result;
        if(choice){
            step.context.sendActivity(MessageFactory.text('Segnalazione inviata con successo'));
        }else{
            step.context.sendActivity(MessageFactory.text('Segnalazione non inviata'));
        }
        return await step.endDialog();
    }
}


module.exports.ReportDialog = ReportDialog;
module.exports.REPORT_DIALOG = REPORT_DIALOG;