import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: 'ap-south-1' })
const dynamo = DynamoDBDocumentClient.from(client)

// Function to fetch items from dynamodb
const getItemsFromDynamoDB = async() => {
    const params = {
        TableName: 'ETS-tasks'
    }

    try {
        const results = await dynamo.send(new ScanCommand(params));
        console.log('Fetched all tasks from ETS-tasks DynamoDB Table successfully')
        return results.Items
    } catch (error) {
        console.error('Error Occurred: ', error)
        throw new Error
    }
}


export const handler = async(event) => {
    try {
        const tasks = await getItemsFromDynamoDB();
        return { statusCode: 200, body: JSON.stringify({ message: 'Fetched tasks successfully', Tasks: tasks }) };
    } catch (error) {
        console.error('Error Occurred: ', error)
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to fetch tasks', error: error.message }) };
    }
}
