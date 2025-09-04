import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamo = DynamoDBDocumentClient.from(client);

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const user_table = process.env.USER_TABLE || 'ETS-users';
const jwt_secret = process.env.JWT_SECRET || 'ipageum';

const signUpFxn = async({name, email, password}) => {

    try {
        // Check if name, email and password are present or not
        if(!name || !email || !password) { return { statusCode: 400, body: JSON.stringify({message: "Name, email and password are required"}) } }

        console.log({'name': name, 'email': email, 'password': password})

        // Check if user email is already present in DynamoDB
        const existing = await dynamo.send(new GetCommand({ TableName: user_table, Key: {email} }))
        // DynamoDB always returns and item, even on no result fetched
        if(existing.Item) { return { statusCode: 400, body: JSON.stringify({message: "User already exists"}) } }

        // If not, then start with hashing and bycrypting the password
        const hashed_password = await bcrypt.hash(password, 10);

        // Save user to DynamoDB
        const timestamp = new Date().toISOString();
        const user = { name, email, password: hashed_password, timestamp };

        console.log("Saving user:", { name, email, password: hashed_password, user: user });

        await dynamo.send(new PutCommand({ TableName:user_table, Item: user }))

        // Generate JWT token and return
        const token = jwt.sign({email}, jwt_secret, {expiresIn: '4h'})

        return { statusCode: 200, body: JSON.stringify({message: "Sign Up Successful",token}) }

    } catch (error) {
        console.error(error)
        return { statusCode: 500, body: JSON.stringify({message: "Internal server error", error}) }
    }

}

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

export const handler = async(event) => {
  try {
      console.log("event:",event);
      console.log("user_table",user_table);

      const path = event.routeKey
      console.log(path);
      
      const body = event.body ? JSON.parse(event.body) : {}   // without express, we need to manually convert

      if(path === 'POST /signup'){
          return await signUpFxn(body)
      }else if(path === 'POST /login'){
          return await loginFxn(body)
      }else{
          return { statusCode: 404, body: JSON.stringify({message: "Invalid path"}) }
      }
  } catch (error) {
      console.error(error)
      return { statusCode: 500, body: JSON.stringify({message: "Internal server error"}) }
  }
}
