
# 💸 ExpenseVision: AI-Powered Smart Expense Tracking

ExpenseVision is an end-to-end cloud-native application that simplifies and automates personal expense tracking using modern serverless architecture and generative AI. Built entirely on AWS, it enables users to securely upload bills, extract expense data using AI, categorize it intelligently with GPT, and view insightful summaries—all through a seamless web interface.

## ✨ Features
- **🔐 Secure Authentication** – User sign-up and login flows with secure data storage in DynamoDB
- **📤 Smart Bill Upload** – Users can upload bill images via an intuitive UI; images are stored in Amazon S3
- **🤖 AI-Powered Extraction** – Amazon Textract extracts structured data from uploaded bills
- **🧠 GPT-Based Categorization** – Extracted expenses are categorized using a custom GPT prompt workflow
- **📊 Expense Dashboard** – React frontend displays weekly/monthly categorized data fetched from DynamoDB
- **☁️ Fully Serverless & Scalable** – Designed using AWS Lambda, S3, DynamoDB, SQS, and CloudFormation

## 🙋‍♂️ User Story
As a user managing personal finances,
I want to upload my bills and automatically track expenses by category,  
So that I can monitor spending patterns and improve budgeting habits.


## 🧱 Tech Stack
| Category              | Services/Tools Used                     |
|-----------------------|-----------------------------------------|
| Frontend              | React.js                                |
| Backend               | AWS Lambda, Amazon Textract, GPT API    |
| Database              | Amazon DynamoDB                         |
| Storage               | Amazon S3                               |
| Queueing              | Amazon SQS                              |
| Infrastructure as Code| AWS CloudFormation                      |
| Authentication        | Custom login/signup logic (DynamoDB)    |
| Deployment            | Fully deployed on AWS                   |

## 🗺️ Architecture Overview
![diagram-export-4-19-2025-2_08_21-AM](https://github.com/user-attachments/assets/85e36344-faaa-473e-bc3e-71f333eaec5d)

## 🏗️ Detailed Architecture Overview
The system is designed with a fully serverless backend and scalable architecture using core AWS services:

### 🔐 1. Authentication & User Management
- Register & Login handled via AWS Lambda functions
- User data securely stored and verified using Amazon DynamoDB

### 🖼️ 2. Bill Upload & Storage
- React frontend (hosted via EC2 in a VPC) for bill image uploads
- Images stored in Amazon S3
- Metadata (S3 URL, user info) written to DynamoDB

### 📤 3. Queue-Based Event Processing
Upload events trigger the Bill Upload Lambda which:
- Stores image in S3
- Stores URL in DynamoDB
- Sends message to SQS Queue

### 📄 4. Data Extraction
- Extract Data Lambda processes messages from SQS queue
- Uses Amazon Textract to extract structured data
- Saves extracted data to DynamoDB
- Triggers next queue for categorization

### 🧠 5. AI-Based Categorization
- Category Detection Lambda processes messages
- Sends data to OpenAI GPT API for intelligent categorization
- Stores categorized data back in DynamoDB

### 📊 6. Data Retrieval & Frontend
Users can view:
- All bills
- Categorized expenses
- Weekly/monthly summaries

Frontend makes API calls to:
- Get Bills Lambda function
- Get Full Bill Lambda function

## 🔄 ExpenseVision Workflow

### 🛡️ User Authentication
- Users register and log in securely through Lambda functions that verify credentials against user data stored in DynamoDB.

### 📤 Bill Upload
- Users upload bill images through the React frontend.
- The Bill Upload Lambda function:
  - Stores the uploaded image in S3
  - Records metadata in DynamoDB
  - Sends a message to the processing queue

### 📄 Data Extraction
- The Extract Data Lambda:
  - Picks up messages from the bill-textract2 SQS queue
  - Uses Amazon Textract to extract text and data from bill images
  - Stores the extracted data in DynamoDB
  - Triggers the next processing step via SQS

### 🤖 AI Categorization
- The Category Detection Lambda:
  - Reads messages from the category-detection2 SQS queue
  - Sends the extracted expense data to GPT API for intelligent categorization
  - Stores categorized data back in DynamoDB

### 📊 Data Retrieval & Visualization
- The frontend dashboard:
  - Retrieves categorized expense data through Get Bills and Get Full Bill Lambda functions
  - Displays bills, categorized expenses, and weekly/monthly summaries
  - Presents data in an intuitive format for expense monitoring and budget analysis


## 📅 Future Improvements
- **Multi-user accounts** with role-based access
- **Visualized analytics** with charts for monthly trends
- **Email notifications** for budget threshold alerts
- **OCR alternatives integration** for better accuracy
- **Mobile responsive** dashboard version

## 🧠 Learnings & Takeaways
This project demonstrates the power of combining:
- Serverless computing
- AI/ML services
- Modern frontend frameworks

To build real-world cloud-native applications that solve everyday problems in a smart and scalable way.
