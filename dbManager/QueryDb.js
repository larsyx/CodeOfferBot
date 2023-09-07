const fs = require('fs');
const CosmosClient = require('@azure/cosmos').CosmosClient;

const endpoint = 'https://codeofferbotdb.documents.azure.com:443/';
const key = 'C5C92OgMrzGHGq50p5Ow9iQxueV1XwwlgSALylZgrRv6dPDHZxWa47LvgwQy5fHc1ENQmecx0EktACDbKjYeeA==';
const databaseId = 'CodeOfferDb';
const containerId = 'Prodotti';
const partitionKey = {kind: 'Hash', paths: ['/prodottiKey']};

const options = {
    endpoint : endpoint,
    key : key,
    userAgentSuffix: 'CosmosDBJavascriptQuickstart'
};

const client = new CosmosClient(options);

async function queryCategory(categoria) {
    
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
        .fetchAll()

    return results;
}

async function queryMoreConvenient() {
    
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

