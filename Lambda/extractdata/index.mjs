import { TextractClient, AnalyzeExpenseCommand } from "@aws-sdk/client-textract";
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const textractClient = new TextractClient({ region: "us-east-1" });
const s3Client = new S3Client({ region: "us-east-1" });
const sqsClient = new SQSClient({ region: "us-east-1" });

const BUCKET_NAME = "bill-images-27032003";
const CATEGORY_DETECTION_QUEUE_URL =process.env.CATEGORY_DETECTION_QUEUE_URL ||
"https://sqs.us-east-1.amazonaws.com/540904581563/category-detection2";

export const handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));
    
    for (const record of event.Records) {
      const messageBody = JSON.parse(record.body);
      console.log("Parsed SQS message:", messageBody);
      
      const billId = messageBody.billId;
      const userId = messageBody.userId;
      const s3Key = messageBody.s3Key;
      const bucketName = BUCKET_NAME;

      if (!billId) {
        console.error("Missing billId in SQS message");
        continue; 
      }

      console.log(`Processing invoice: billId=${billId}, userId=${userId}, S3Key=${s3Key}`);

      const params = {
        Document: {
          S3Object: {
            Bucket: bucketName,
            Name: s3Key,
          },
        },
      };

      const command = new AnalyzeExpenseCommand(params);
      const textractResponse = await textractClient.send(command);

      // Extract structured receipt data
      const extractedData = extractReceiptData(textractResponse);
      
      // Add billId to the extracted data
      extractedData.billId = billId;

      console.log(`Extracted Data: ${JSON.stringify(extractedData)}`);

      // Send extracted data to SQS queue
      await sendToSQS(billId, userId, extractedData);
    }

    return {
      statusCode: 200,
      body: "Messages processed and sent to category-detection queue successfully",
    };
  } catch (error) {
    console.error("Error processing messages:", error);
    return {
      statusCode: 500,
      body: "Error processing messages",
    };
  }
};

// Function to send extracted data to SQS
const sendToSQS = async (billId, userId, extractedData) => {
  try {
    const sqsParams = {
      QueueUrl: CATEGORY_DETECTION_QUEUE_URL,
      MessageBody: JSON.stringify({
        billId, // Include billId in the message
        userId, // Include userId in the message
        extractedData, // Include the extracted receipt data
      }),
    };

    await sqsClient.send(new SendMessageCommand(sqsParams));
    console.log("Message sent to category-detection queue:", JSON.stringify(sqsParams.MessageBody));
  } catch (error) {
    console.error("Error sending message to SQS:", error);
  }
};

// Function to extract structured receipt data
const extractReceiptData = (response) => {
  let storeName = "Not Found";
  let storePhone = "Not Found";
  let purchaseDate = "Not Found";
  let subtotal = "Not Found";
  let totalAmount = "Not Found";
  let discount = "Not Found";
  let accountNumber = "Not Found";
  let cardType = "Not Found";
  let cardNumber = "Not Found";
  let items = [];

  for (const doc of response.ExpenseDocuments || []) {
    for (const summaryField of doc.SummaryFields || []) {
      const fieldType = summaryField.Type?.Text;
      const fieldValue = summaryField.ValueDetection?.Text;

      if (!fieldValue) continue;

      switch (fieldType) {
        case "VENDOR_NAME":
          storeName = fieldValue;
          break;
        case "VENDOR_PHONE":
          storePhone = fieldValue;
          break;
        case "INVOICE_RECEIPT_DATE":
          purchaseDate = fieldValue;
          break;
        case "SUBTOTAL":
          subtotal = fieldValue;
          break;
        case "TOTAL":
          totalAmount = fieldValue;
          break;
        case "DISCOUNT":
          discount = fieldValue;
          break;
        case "ACCOUNT_NUMBER":
          accountNumber = fieldValue;
          break;
        case "PAYMENT_CARD_TYPE":
          cardType = fieldValue;
          break;
        case "PAYMENT_CARD_LAST_FOUR":
          cardNumber = `**** **** **** ${fieldValue}`;
          break;
        default:
          break;
      }
    }

    for (const item of doc.LineItemGroups || []) {
      for (const lineItem of item.LineItems || []) {
        let itemName = "Unknown";
        let itemPrice = "Unknown";

        for (const field of lineItem.LineItemExpenseFields || []) {
          const fieldType = field.Type?.Text;
          const fieldValue = field.ValueDetection?.Text;

          if (!fieldValue) continue;

          if (fieldType === "ITEM") {
            itemName = fieldValue;
          } else if (fieldType === "PRICE") {
            itemPrice = fieldValue;
          }
        }

        items.push({ itemName, itemPrice });
      }
    }
  }

  return {
    storeName,
    storePhone,
    purchaseDate,
    subtotal,
    totalAmount,
    discount,
    accountNumber,
    paymentDetails: {
      cardType,
      cardNumber,
    },
    items,
  };
};