const { ComponentDialog } = require("botbuilder-dialogs");

class ProductDialog extends ComponentDialog{
    constructor(){
        super('ProductDialog');
    }
}

module.exports.ProductDialog = ProductDialog;