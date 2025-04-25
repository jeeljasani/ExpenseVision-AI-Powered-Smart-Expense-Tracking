import { DynamoDBClient, ScanCommand, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const CATEGORY_TABLE = "category";
const BILL_METADATA_TABLE = "BillMetadata";

// OpenAI API configuration - REPLACE WITH YOUR VALUES
const OPENAI_API_KEY = "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export const handler = async (event) => {
    try {
        console.log("Received event:", JSON.stringify(event, null, 2));
        
        for (const record of event.Records) {
            const message = JSON.parse(record.body);
            console.log("Parsed SQS message:", message);
            
            const { billId, userId, extractedData } = message;

            if (!billId) {
                throw new Error("billId is required in the message");
            }
            
            if (!userId) {
                throw new Error("userId is required in the message");
            }

            console.log(`Processing data for billId: ${billId}, userId: ${userId}`);
            console.log("Extracted Data:", JSON.stringify(extractedData, null, 2));

            const getItemCommand = new GetItemCommand({
                TableName: BILL_METADATA_TABLE,
                Key: {
                    billId: { S: billId }
                }
            });
            
            try {
                const existingItem = await dynamoDBClient.send(getItemCommand);
                console.log("Existing item check result:", JSON.stringify(existingItem, null, 2));
            } catch (getError) {
                console.warn("Error checking for existing item:", getError);
                // Continue processing even if the check fails
            }

            // Fetch category names from DynamoDB
            const categoryCommand = new ScanCommand({
                TableName: CATEGORY_TABLE,
                ProjectionExpression: "categoryName",
            });

            const categoryResponse = await dynamoDBClient.send(categoryCommand);
            const categoryNames = categoryResponse.Items?.map(item => item.categoryName?.S).filter(Boolean) || [];

            console.log("Fetched Categories:", categoryNames);

            const categoriesToUse = categoryNames.length > 0 ? 
                categoryNames : 
                ["Grocery", "Dairy", "Bakery", "Meat", "Produce", "Frozen", "Cleaning", "Personal Care", "Other"];

            // Send data to ChatGPT to categorize items
            const categorizedData = await categorizeItemsWithGPT(extractedData, categoriesToUse);

            console.log("Categorized Data:", JSON.stringify(categorizedData, null, 2));

            // Store data in DynamoDB
            await storeMergedDataInDynamoDB(billId, userId, extractedData, categorizedData);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Processing completed successfully" }),
        };
    } catch (error) {
        console.error("Error processing message:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: "Error processing message",
                details: error.message 
            }),
        };
    }
};

const categorizeItemsWithGPT = async (extractedData, categoryNames) => {
    try {
        
        if (!OPENAI_API_KEY || OPENAI_API_KEY === "your-openai-api-key") {
            console.warn("OpenAI API key not configured, using default categorization");
            return { 
                updatedItems: (extractedData.items || []).map(item => ({
                    ...item,
                    category: "Grocery" // Default category
                }))
            };
        }

        const prompt = `Given the following list of grocery items and these categories: ${categoryNames.join(", ")},
        assign each item to the most appropriate category.
        
        Items:
        ${JSON.stringify(extractedData.items || [], null, 2)}
        
        Return a JSON array with each item having these properties: itemName, itemPrice, and category.`;

        const response = await axios.post(OPENAI_API_URL, {
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: prompt }],
            max_tokens: 500,
            temperature: 0.3,
        }, {
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        // Parse the response and ensure it has the expected structure
        const content = response.data.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content in ChatGPT response");
        }

        let parsedData;
        try {
            // Extract JSON if it's wrapped in text or code blocks
            const jsonMatch = content.match(/\[.*\]/s) || content.match(/\{.*\}/s);
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
            } else {
                parsedData = JSON.parse(content);
            }

            if (Array.isArray(parsedData)) {
                return { updatedItems: parsedData };
            } else if (parsedData.items && Array.isArray(parsedData.items)) {
                return { updatedItems: parsedData.items };
            } else {
                throw new Error("Unexpected data structure from ChatGPT");
            }
        } catch (parseError) {
            console.error("Failed to parse ChatGPT response:", content);
            throw new Error("Invalid JSON response from ChatGPT");
        }
    } catch (error) {
        console.error("Error categorizing items with ChatGPT:", error);
        // Return original items if categorization fails
        return { 
            updatedItems: (extractedData.items || []).map(item => ({
                ...item,
                category: "Grocery" // Default category
            }))
        };
    }
};

const storeMergedDataInDynamoDB = async (billId, userId, extractedData, categorizedData) => {
    try {
        if (!billId) {
            throw new Error("billId is required");
        }
        if (!userId) {
            throw new Error("userId is required");
        }

        console.log("Storing data in DynamoDB for billId:", billId);

        // Prepare DynamoDB item
        const item = {
            billId: { S: billId },
            userId: { S: userId },
            storeName: { S: extractedData.storeName || "Not Found" },
            storePhone: { S: extractedData.storePhone || "Not Found" },
            purchaseDate: { S: extractedData.purchaseDate || "Not Found" },
            subtotal: { S: extractedData.subtotal || "0.00" },
            totalAmount: { S: extractedData.totalAmount || "0.00" },
            discount: { S: extractedData.discount || "0.00" },
            accountNumber: { S: extractedData.accountNumber || "Not Found" },
            paymentDetails: { 
                M: {
                    cardType: { S: extractedData.paymentDetails?.cardType || "Not Found" },
                    cardNumber: { S: extractedData.paymentDetails?.cardNumber || "Not Found" },
                }
            },
            items: { 
                L: (extractedData.items || []).map(item => ({
                    M: {
                        itemName: { S: item.itemName || "Unknown Item" },
                        itemPrice: { S: item.itemPrice || "0.00" }
                    }
                }))
            },
            updatedItems: { 
                L: (categorizedData.updatedItems || []).map(item => ({
                    M: { 
                        itemName: { S: item.itemName || "Unknown Item" }, 
                        itemPrice: { S: item.itemPrice || "0.00" }, 
                        category: { S: item.category || "Grocery" } 
                    }
                }))
            },
            createdAt: { S: new Date().toISOString() },
            updatedAt: { S: new Date().toISOString() },
            status: { S: "COMPLETED" } 
        };

        console.log("Putting item in DynamoDB:", JSON.stringify(item, null, 2));

        const putCommand = new PutItemCommand({
            TableName: BILL_METADATA_TABLE,
            Item: item
        });

        await dynamoDBClient.send(putCommand);
        console.log("Successfully stored data in DynamoDB for billId:", billId);
    } catch (error) {
        console.error("Error storing data in DynamoDB:", error);
        throw error; 
    }
};