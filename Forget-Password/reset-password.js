import { DynamoDBClient, GetItemCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import bcrypt  from 'bcryptjs'

const dynamoDbClient = new DynamoDBClient({ region: 'ap-south-1' });

const validateOtpInDynamoDB = async(email, otp) => {
    // Fetch the otp from DynamoDB
    const params = {
        TableName: 'OTPTable',
        Key: {
            email: { S: email }
        }
    }

    try {
        // Fetch the otp from table
        const result = dynamoDbClient.send(new GetItemCommand(params));
        const stored_otp = result.item?.otp?.S;
        const expires = result.item?.expires?.N;

        if(!stored_otp || !expires){
            throw new Error('OTP not found');
        }

        // Check if OTP matches and is not expired
        const currentTime = Date.now();

        if(stored_otp != otp){
            throw new error('Invalid OTP');
        }

        if(parseInt(expires) < currentTime){
            throw new error('OTP has expired');
        }

        return true;

    } catch (error) {
        console.error('Error validating OTP', error);
        throw new Error('Invalid or expired OTP');
    }
}


// Function to update password in DynamoDB
const resetPasswordInDynamoDB = async(email, newPassword) => {
    // Hash the new password
    const hashedPassword = bcrypt.hash(newPassword, 10);

    const params = {
        TableName: 'OTPTable',
        Key: {
            email: { S:email }
        },
        UpdateExpression: 'SET password = :newPassword',
        ExpressionAttributeValues: {
            ':newPassword': { S: hashedPassword }
        }
    }

    try {
        await dynamoDbClient.send(new UpdateItemCommand(params));
    } catch (error) {
        console.error("Error Occurred", error)
        throw new error('Error resetting password')
    }
}


export const handler = async(event) => {
    try {
        const {email, newPassword, otp} = JSON.parse(event.body);
        if (!email || !otp || !newPassword) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Email, OTP, and new password are required' }) };
        }

        // Step 1: Validate OTP
        validateOtpInDynamoDB(email, otp);

        // Step 2: Reset Password in DynamoDB
        resetPasswordInDynamoDB(email, newPassword);

        // Step 3: delete OTP from dynamodb table
        const params = {
            TableName: 'OTPTable',
            Key: {
                email: { S: email }
            }
        }

        await dynamoDbClient.send(new DeleteItemCommand(params));

        return { statusCode: 200, body: JSON.stringify({ message: 'Password reset successful' }) };
    } catch (error) {
        console.error('Error Occurred')
        return { statusCode: 500, body: JSON.stringify({ message: error.message || 'Error Occurred' }) }
    }
}
