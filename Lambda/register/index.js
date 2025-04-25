const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize the DynamoDB client
const client = new DynamoDBClient();
const dynamoDB = DynamoDBDocumentClient.from(client);
const usersTable = 'Users';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

exports.handler = async (event) => {
  try {
    // More robust parsing logic
    let requestBody = JSON.parse(event.body);
    console.log("Event:", JSON.stringify(event));
    if (!event) {
      console.log("No body found in event");
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Request body is missing' })
      };
    }
    
    // Validate required fields
    if (!requestBody.email || !requestBody.password || !requestBody.name) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Missing required fields: email, password, and name are required' })
      };
    }
    
    // Check if user exists
    const checkParams = {
      TableName: usersTable,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': requestBody.email }
    };
    
    const existingUsers = await dynamoDB.send(new ScanCommand(checkParams));
    
    if (existingUsers.Items && existingUsers.Items.length > 0) {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'User with this email already exists' })
      };
    }
    
    // Create new user
    const userId = generateUUID();
    const timestamp = new Date().toISOString();
    
    const newUser = {
      userId: userId,
      email: requestBody.email,
      password: requestBody.password,
      name: requestBody.name,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Save to DynamoDB
    await dynamoDB.send(new PutCommand({
      TableName: usersTable,
      Item: newUser
    }));
    
    // Return success without password
    const userResponse = {
      userId: newUser.userId,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt
    };
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User registered successfully',
        user: userResponse
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error registering user',
        error: error.message
      })
    };
  }
};