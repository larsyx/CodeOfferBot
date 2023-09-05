// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory, CardFactory, ActionTypes } = require('botbuilder');

class CodeBot extends ActivityHandler {
    constructor(conversationState, userState, dialog) {
        super();
        if(!conversationState) throw new Error('Mancato parametro, conversationalState');
        if(!userState) throw new Error('Mancato parametro, userState');
        if(!dialog) throw new Error('Mancato parametro, dialog');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');
        
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {

            await this.dialog.run(context, this.dialogState);
            // By calling next() you ensure that the next BotHandler is run.
            
            await this.conversationState.saveChanges(context);
            await this.userState.saveChanges(context);
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Ciao benvenuto in CodeOfferBot!';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(welcomeText);
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async run(context){
        await super.run(context);

        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }

}

module.exports.CodeBot = CodeBot;
