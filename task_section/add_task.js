import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: 'ap-south-1' })
const dynamo = DynamoDBDocumentClient.from(client)

// Function to add items into dynamodb table
const storeProjectInDynamo = async(department, project, title, description, due_date, priority, est_time, assign_to) => {
    const id = randomUUID();
    
    const params = {
        TableName: 'ETS-tasks',
        Item: {
            id: id,
            department: department,
            project: project,
            title: title,
            description: description,
            due_date: due_date,
            priority: priority,
            est_time: est_time,
            assign_to: assign_to
        }
    }

    try {
        await dynamo.send(new PutCommand(params));
        console.log('Task Added to DynamoDB Successfully');
        return params
    } catch (error) {
        console.error('Error adding task', error)
        throw new Error(error)
    }
}

export const handler = async(event) => {
    try {
        const { department, project, title, description, due_date, priority, est_time, assign_to} = JSON.parse(event.body);
        if( !department || !project || !title || !description || !due_date || !priority || !est_time || !assign_to){
            return {statusCode: 500, body: JSON.stringify({ message: 'All fields are required' })}
        }

        const result = await storeProjectInDynamo(department, project, title, description, due_date, priority, est_time, assign_to);
        return { statusCode: 200, body: JSON.stringify({ message: 'Task created successfully', Task: result }) };

    } catch (error) {
        console.error('Error Occurred: ', error)
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to create task', error: error.message }) };
    }
}
