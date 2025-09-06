const nodemailer = require('nodemailer');
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
const crypto = require('crypto');

// Initialize DynamoDB client
const dynamoDbClient = new DynamoDBClient({ region: 'ap-south-1' });

// const otpStore = {};    // Storing OTP's locally

// Create Transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
})

// Function to store OTP in dynamodb table
const storeOtpInDynamoDB = async(email, otp) => {
    const params = {
        TableName: 'OTPTable',
        Item: {
            email: {S: email},
            otp: {S: otp},
            expires: { N: (Date.now() + 5 * 60 * 1000).toString() }     // Expires in 5 minutes
        }
    }

    // Put in DynamoDB
    try {
        await dynamoDbClient.send(new PutItemCommand(params))
    } catch (error) {
        console.error('Error Occurred')
        throw new Error('Error storing OTP');
    }
}

export const handler = async(event) => {
    try {
        
        const { email } = JSON.parse(event.body);
        if(!email) return { statusCode: 400, body: JSON.stringify({message: 'Email is required'})}

        // Generate 6 digit OTP by crypto
        const otp = crypto.randomInt(100000, 999999).toString();

        // Save OTP In DynamoDB
        storeOtpInDynamoDB(email, otp);

        // Describe structure of Email
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: `Your Password Reset OTP`,
            text: `Your OTP for password reset is: ${otp}. It expires in 5 minutes.`
        }

        // Send OTP Mail
        await transporter.sendEmail(mailOptions);

        return { statusCode: 200, body: JSON.stringify({ message: 'OTP sent successfully' }) }

    } catch (error) {
        console.error("Error Occurred", error);
        return { statusCode: 500, body: 'Failed to send OTP' }
    }
}
