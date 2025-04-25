import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({});
const dynamoDbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);
const sqsClient = new SQSClient({});

const BUCKET_NAME = 'bill-images-27032003';
const TABLE_NAME = 'BillMetadata';
const QUEUE_URL = process.env.QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/540904581563/bill-textract2';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
};

export const handler = async (event) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        
        // Handle OPTIONS request for CORS
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'CORS preflight request successful' })
            };
        }
        
        // Fix for the JSON parsing issue
        let body;
        if (event.body) {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } else {
            body = event;
        }
        
        const userId = body.userId || 'anonymous';
        const fileName = body.fileName || 'unknown-file';
        const fileType = body.fileType || 'application/octet-stream';
        const fileContent = body.fileData ? Buffer.from(body.fileData, 'base64') : null;
        
        if (!fileContent) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Invalid file data' })
            };
        }
        
        // Generate a unique ID for the bill
        const billId = uuidv4();
        const s3Key = `${billId}-${fileName}`;
        
        console.log('Uploading to S3:', {
            bucket: BUCKET_NAME,
            key: s3Key,
            contentType: fileType,
            size: fileContent.length
        });
        
        // Upload file to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: fileType,
        }));
        
        const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
        const uploadDate = new Date().toISOString();
        
        console.log('Creating initial record in DynamoDB');
        
        // Insert initial entry into DynamoDB with the correct primary key
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                billId: billId,         // Primary key
                userId: userId,
                s3Key: s3Key,
                fileUrl: s3Url,
                filename: fileName,
                fileType: fileType,
                fileSize: fileContent.length,
                uploadDate: uploadDate,
                status: 'PROCESSING'     // Initial status
            }
        }));
        
        console.log('Sending message to SQS queue');

        // Send a message to SQS (bill-textract queue) with the billId
        await sqsClient.send(new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({ 
                billId: billId,
                userId: userId, 
                s3Key: s3Key 
            }),
        }));
        
        console.log('File uploaded and processing initiated');

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'File uploaded successfully and sent to processing queue',
                data: {
                    billId: billId,
                    userId: userId,
                    filename: fileName,
                    status: 'PROCESSING',
                    uploadDate: uploadDate
                }
            })
        };
    } catch (error) {
        console.error('Error processing event:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Error processing request', error: error.message })
        };
    }
};