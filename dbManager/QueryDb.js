const fs = require('fs');
const CosmosClient = require('@azure/cosmos').CosmosClient;
const dotenv = require('dotenv').config();
const { DefaultAzureCredential, ClientSecretCredential, InteractiveBrowserCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const keyVaultName = process.env.KEY_VAULT_NAME;
const vaultUri = `https://${keyVaultName}.vault.azure.net`;

if(dotenv.error)
    throw customAlias.error;

const credential = new InteractiveBrowserCredential({
    tenantId: process.env.TenantId
});

const clientVault = new SecretClient(vaultUri, credential);


const endpoint = process.env.EndPoint;
let key;
const databaseId = process.env.DatabaseId;
const containerId = process.env.ContainerId;
const partitionKey = {kind: 'Hash', paths: ['/prodottiKey']};

let client = null;

async function getClient(){
    if(client)
        return client;

    try {
        const secret = await clientVault.getSecret('CosmosDbKey');
        key = secret.value;
        const options = {
            endpoint : endpoint,
            key : key,
            userAgentSuffix: 'CosmosDBJavascriptQuickstart'
        };
        client = new CosmosClient(options);
        return client;
    } catch (err) {
        console.error(`Error retrieving secret CosmosDbKey': `, err);
        throw err;
    }


}

async function queryCategory(categoria) {
    const client = await getClient();
    const querySpec = {
        query: 'SELECT r.id, r.Nome, r.Immagine, r.Prezzo, r.PrezzoScontato FROM root r WHERE LOWER(r.Categoria) = @Categoria',
        parameters: [
        {
            name: '@Categoria',
            value: categoria.toLowerCase()
        }
        ]
    }
    
    const { resources: results } = await client
        .database(databaseId)
        .container(containerId)
        .items.query(querySpec)
        .fetchAll()
    
    return results;

}

async function queryProduct(id) {
    const client = await getClient();
    const querySpec = {
        query: 'SELECT * FROM root r WHERE r.id = @id',
        parameters: [
        {
            name: '@id',
            value: id
        }
        ]
    }
    
    const { resources: results } = await client
        .database(databaseId)
        .container(containerId)
        .items.query(querySpec)
        .fetchAll()

    return results;
}

async function queryGetCategories() {
    const client = await getClient();
    const querySpec = {
        query: 'SELECT r.Categoria FROM root r GROUP BY r.Categoria',
    }
    
    const { resources: results } = await client
        .database(databaseId)
        .container(containerId)
        .items.query(querySpec)
        .fetchAll()
    
    return results;
}
    
async function queryFind(nome) {
    const client = await getClient();
    const querySpec = {
        query: 'SELECT r.id, r.Nome, r.Immagine, r.Prezzo, r.PrezzoScontato FROM root r WHERE CONTAINS(LOWER(r.Nome), @nome)',
        parameters: [
        {
            name: '@nome',
            value: nome.toLowerCase()
        }
        ]
    }

    const { resources: results } = await client
        .database(databaseId)
        .container(containerId)
        .items.query(querySpec)
        .fetchAll();

        return results;
}

async function queryMoreConvenient() {
    const client = await getClient();
    const querySpec = {
        query: 'SELECT r.id, r.Nome, r.Immagine, r.Prezzo, r.PrezzoScontato FROM root r ORDER BY r.Sconto DESC',
    }
    
    const { resources: results } = await client
        .database(databaseId)
        .container(containerId)
        .items.query(querySpec)
        .fetchAll()
    
    return results;
}

async function queryHints() {
    const client = await getClient();
    const querySpec = {
        query: 'SELECT r.id, r.Nome, r.Immagine, r.Prezzo, r.PrezzoScontato FROM root r ORDER BY r.Popolarità DESC',
    }
    
    const { resources: results } = await client
        .database(databaseId)
        .container(containerId)
        .items.query(querySpec)
        .fetchAll()
    
    return results;
}

module.exports = {
    queryCategory : queryCategory,
    queryProduct : queryProduct,
    queryGetCategories : queryGetCategories,
    queryFind : queryFind,
    queryHints : queryHints,
    queryMoreConvenient : queryMoreConvenient
};

