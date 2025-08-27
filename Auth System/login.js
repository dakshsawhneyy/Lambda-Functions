import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamo = DynamoDBDocumentClient.from(client);

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const user_table = process.env.USER_TABLE;
const jwt_secret = process.env.JWT_SECRET;

const loginFxn = async({email,password}) => {

    try {
        // Check if email and password are present or not
        if(!email || !password) { return { statusCode: 400, body: JSON.stringify({message: "Email and password are required"}) } }

        // Fetch user details from user_table
        const user = await dynamo.send(new GetCommand({ TableName: user_table, Key: {email}}))
        // DynamoDB always returns and item, even on no result fetched
        if(!user.Item) { return { statusCode: 400, body: JSON.stringify({message: "User does not exist"}) } }

        // Compare Password
        const validPassword = await bcrypt.compare(password, user.Item.password)
        if(!validPassword) { return { statusCode: 400, body: JSON.stringify({message: "Invalid password"}) } }

        // Generate new token
        const token = jwt.sign({email}, jwt_secret, {expiresIn: '4h'})
        
        return { statusCode: 200, body: JSON.stringify({message: "Login Successful", token}) }
    } catch (error) {
        console.error(error)
        return { statusCode: 500, body: JSON.stringify({message: "Internal server error"}) }
    }
    
}

export default loginFxn
