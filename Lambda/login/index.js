const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize the DynamoDB client
const client = new DynamoDBClient();
const dynamoDB = DynamoDBDocumentClient.from(client);
const usersTable = 'Users';

// Simple token generator
function generateToken(userId, email) {
  return Buffer.from(JSON.stringify({
    userId: userId,
    email: email,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  })).toString('base64');
}

exports.handler = async (event) => {
  try {
    // Parse the request body with robust error handling
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
    if (!requestBody.email || !requestBody.password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Missing required fields: email and password are required' })
      };
    }
    
    // Check if user exists
    const checkParams = {
      TableName: usersTable,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': requestBody.email }
    };
    
    const usersResult = await dynamoDB.send(new ScanCommand(checkParams));
    
    if (!usersResult.Items || usersResult.Items.length === 0) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Invalid email or password' })
      };
    }
    
    const user = usersResult.Items[0];
    
    // Verify password (in a real app, use proper password comparison with bcrypt)
    if (user.password !== requestBody.password) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Invalid email or password' })
      };
    }
    
    // Generate token
    const token = generateToken(user.userId, user.email);
    
    // Update last login time
    const timestamp = new Date().toISOString();
    await dynamoDB.send(new UpdateCommand({
      TableName: usersTable,
      Key: { userId: user.userId },
      UpdateExpression: 'set lastLogin = :lastLogin',
      ExpressionAttributeValues: { ':lastLogin': timestamp }
    }));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Login successful',
        token: token,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email
        }
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
        message: 'Error processing login',
        error: error.message
      })
    };
  }
};