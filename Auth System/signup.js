import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamo = DynamoDBDocumentClient.from(client);

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const user_table = process.env.USER_TABLE;
const jwt_secret = process.env.JWT_SECRET;

const signUpFxn = async({name, email, password}) => {

    try {
        // Check if name, email and password are present or not
        if(!name || !email || !password) { return { statusCode: 400, body: JSON.stringify({message: "Name, email and password are required"}) } }

        // Check if user email is already present in DynamoDB
        const existing = await dynamo.send(new GetCommand({ TableName: user_table, Key: {email} }))
        // DynamoDB always returns and item, even on no result fetched
        if(existing.Item) { return { statusCode: 400, body: JSON.stringify({message: "User already exists"}) } }

        // If not, then start with hashing and bycrypting the password
        const hashed_password = await bcrypt.hash(password, 10);

        // Save user to DynamoDB
        const user = { name, email, password: hashed_password };
        await dynamo.send(new PutCommand({ TableName:user_table, Item: user }))

        // Generate JWT token and return
        const token = jwt.sign({email}, jwt_secret, {expiresIn: '4h'})

        return { statusCode: 200, body: JSON.stringify({message: "Sign Up Successful",token}) }

    } catch (error) {
        console.error(error)
        return { statusCode: 500, body: JSON.stringify({message: "Internal server error"}) }
    }

}

export default signUpFxn
