import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

// DynamoDB table for bill metadata
const BILLS_TABLE = 'BillMetadata';
const BILL_BUCKET_NAME = 'bill-images-27032003';

// CORS headers
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
    // Get user ID from authorizer or query params
    const userId = getUserId(event);
    console.log('User ID extracted:', userId);
    
    if (!userId) {
      console.log('No user ID found in request');
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Unauthorized - Missing user ID' })
      };
    }
    
    // Extract pagination parameters if they exist
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 100;
    const lastEvaluatedKey = event.queryStringParameters?.startKey ? 
                             JSON.parse(decodeURIComponent(event.queryStringParameters.startKey)) : 
                             undefined;
    
    // Query DynamoDB for bills belonging to the user
    let params;
    
    // Check if we have a GSI on userId
    if (hasGSI()) {
      // Use GSI for query
      params = {
        TableName: BILLS_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey
      };
      console.log('Using GSI to query bills');
    } else {
      params = {
        TableName: BILLS_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey
      };
      console.log('Using scan with filter to find bills (consider adding a GSI)');
    }
    
    console.log('DynamoDB params:', JSON.stringify(params, null, 2));
    
    // Execute query or scan
    let result;
    if (params.IndexName) {
      result = await docClient.send(new QueryCommand(params));
    } else {
      result = await docClient.send(new ScanCommand(params));
    }
    
    console.log('DynamoDB result count:', result.Items ? result.Items.length : 0);
    
    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          bills: [],
          count: 0,
          lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null
        })
      };
    }
    
    // Sort bills by upload date (newest first)
    const bills = result.Items.sort((a, b) => {
      
      const dateA = a.uploadDate || a.createdAt || 0;
      const dateB = b.uploadDate || b.createdAt || 0;
      return new Date(dateB) - new Date(dateA);
    });
    
    
    const billsWithUrls = await Promise.all(bills.map(async (bill) => {
      try {
        
        if (bill.s3Key) {
          const getObjectParams = {
            Bucket: BILL_BUCKET_NAME,
            Key: bill.s3Key
          };
          
          const command = new GetObjectCommand(getObjectParams);
          bill.fileUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        }
      } catch (error) {
        console.error(`Error generating S3 URL for bill ${bill.billId}:`, error);
        // Continue without the URL
      }
      
      
      return {
        ...bill,
        id: bill.billId || bill.id, // Make sure ID field is available
        billId: bill.billId || bill.id, // Ensure billId is always set
        status: bill.status || 'unknown',
        storeName: bill.storeName || 'Not available',
        uploadDate: bill.uploadDate || bill.createdAt || 'Unknown date'
      };
    }));
    
    console.log('Returning bills data with count:', billsWithUrls.length);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        bills: billsWithUrls,
        count: billsWithUrls.length,
        lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null
      })
    };
  } catch (error) {
    console.error('Error fetching bills:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Failed to fetch bills',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

function getUserId(event) {
  try {
    console.log('Auth context:', JSON.stringify(event.requestContext?.authorizer, null, 2));
    
    
    if (event.queryStringParameters && event.queryStringParameters.userId) {
      console.log('Found userId in query parameters');
      return event.queryStringParameters.userId;
    }
    
    
    console.log('IMPORTANT: Using test user ID for development');
    return 'b59d054f-ce81-4de9-a142-be2283ddaef6'; // Replace with a valid user ID from your DynamoDB
  
  } catch (error) {
    console.error('Error extracting user ID:', error);
    return 'b59d054f-ce81-4de9-a142-be2283ddaef6'; // Return test user ID even on error
  }
}

function hasGSI() {
  
  return false; // Setting to false for now to use scan
}