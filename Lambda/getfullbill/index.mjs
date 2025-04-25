import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

// DynamoDB table for bill metadata
const BILLS_TABLE = 'BillMetadata';
const BILL_BUCKET_NAME = 'bill-images-27032003';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
};

export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'CORS preflight request successful' })
    };
  }
  
  try {
    // Extract request body
    let requestBody = {};
    
    if (event.body) {
      try {
        requestBody = JSON.parse(event.body);
      } catch (error) {
        console.error('Error parsing request body:', error);
      }
    }
    
    console.log('Parsed request body:', requestBody);
    
    // Extract billId from request body
    const billId = requestBody.billId;
    const isDataRequest = requestBody.isDataRequest === true;
    
    console.log(`Extracted parameters - billId: ${billId}, isDataRequest: ${isDataRequest}`);
    
    if (!billId) {
      console.error('No billId provided in request body');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: 'Missing billId parameter in request body'
        })
      };
    }
    
    const scanParams = {
      TableName: BILLS_TABLE,
      FilterExpression: 'billId = :billId',
      ExpressionAttributeValues: {
        ':billId': billId
      }
    };
    
    console.log('Scanning for bill with params:', JSON.stringify(scanParams));
    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await docClient.send(scanCommand);
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('Bill not found in DynamoDB');
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: 'Bill not found',
          billId: billId
        })
      };
    }
    
    // Get bill from scan results
    const billItem = scanResult.Items[0];
    console.log('Found bill:', JSON.stringify(billItem, null, 2));
    
    // Generate S3 URL if needed
    if (billItem.s3Key) {
      try {
        const getObjectParams = {
          Bucket: BILL_BUCKET_NAME,
          Key: billItem.s3Key
        };
        
        const command = new GetObjectCommand(getObjectParams);
        billItem.fileUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      } catch (error) {
        console.error('Error generating S3 URL:', error);
      }
    }
    
    if (isDataRequest) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          data: billItem
        })
      };
    } else {
      
      const basicInfo = {
        id: billItem.billId,
        billId: billItem.billId,
        userId: billItem.userId,
        filename: billItem.filename || billItem.fileName || 'Not available',
        fileUrl: billItem.fileUrl,
        fileType: billItem.fileType || 'Not available',
        fileSize: billItem.fileSize || 'Not available',
        uploadDate: billItem.createdAt || billItem.uploadDate,
        status: billItem.status || 'unknown',
        storeName: billItem.storeName || 'Not available'
      };
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          data: basicInfo
        })
      };
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Failed to retrieve bill',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};