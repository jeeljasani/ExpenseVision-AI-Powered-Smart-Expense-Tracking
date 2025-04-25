💸 ExpenseVision: AI-Powered Smart Expense Tracking
ExpenseVision is an end-to-end cloud-native application that simplifies and automates personal expense tracking using modern serverless architecture and generative AI. Built entirely on AWS, it enables users to securely upload bills, extract expense data using AI, categorize it intelligently with GPT, and view insightful summaries—all through a seamless web interface.

✨ Features
🔐 Secure Authentication – User sign-up and login flows with secure data storage in DynamoDB

📤 Smart Bill Upload – Users can upload bill images via an intuitive UI; images are stored in Amazon S3

🤖 AI-Powered Extraction – Amazon Textract extracts structured data from uploaded bills

🧠 GPT-Based Categorization – Extracted expenses are categorized using a custom GPT prompt workflow

📊 Expense Dashboard – React frontend displays weekly/monthly categorized data fetched from DynamoDB

☁️ Fully Serverless & Scalable – Designed using AWS Lambda, S3, DynamoDB, SQS, and CloudFormation

🙋‍♂️ User Story
As a user managing personal finances,
I want to upload my bills and automatically track expenses by category,
So that I can monitor spending patterns and improve budgeting habits.

🗺️ Architecture Overview
plaintext
Copy
Edit
[ User ] 
   ↓
[ React Frontend (Login + Upload) ]
   ↓
[ API Gateway ]
   ↓
[ Lambda: UploadHandler ] 
   → Store image in S3  
   → Store image metadata in DynamoDB  
   → Push message to SQS  
   ↓
[ Lambda: ExtractData ]
   → Triggered by SQS  
   → Use Amazon Textract to extract text  
   → Store extracted data in DynamoDB  
   → Push message to next SQS  
   ↓
[ Lambda: CategorizeExpense ]
   → Sends extracted data to GPT  
   → Categorizes and stores final data in DynamoDB  
   ↓
[ React Frontend (Dashboard) ]
   → Fetch categorized data for weekly/monthly summaries
🧱 Tech Stack

Category	Services/Tools Used
Frontend	React.js, HTML/CSS
Backend	AWS Lambda, Amazon Textract, GPT API (via AWS Lambda)
Database	Amazon DynamoDB
Storage	Amazon S3
Queueing	Amazon SQS
Infrastructure as Code	AWS CloudFormation
Authentication	Custom login/signup logic backed by DynamoDB
Deployment	Fully deployed on AWS
🚀 Getting Started
Prerequisites
AWS Account with admin-level access

Node.js and npm installed (for React frontend)

AWS CLI configured

Deployment Steps
Clone the repository

bash
Copy
Edit
git clone https://github.com/your-username/expensevision.git
cd expensevision
Deploy Backend

bash
Copy
Edit
aws cloudformation deploy \
  --template-file backend-template.yaml \
  --stack-name expensevision-backend \
  --capabilities CAPABILITY_NAMED_IAM
Start Frontend

bash
Copy
Edit
cd frontend
npm install
npm start
📈 Sample Use Flow
User signs up and logs in.

User uploads a bill image.

Lambda stores the image in S3 and metadata in DynamoDB.

Queue triggers Textract to extract text.

Extracted data is sent to GPT for category classification.

Categorized data is stored and displayed on dashboard.

📅 Future Improvements
📦 Multi-user accounts with role-based access

📉 Visualized analytics with charts for monthly trends

🔔 Email notifications for budget threshold alerts

🧾 Integration with OCR alternatives for better accuracy

📲 Mobile responsive version of dashboard

🧠 Learnings & Takeaways
This project demonstrates the power of combining serverless computing, AI/ML services, and modern frontend frameworks to build real-world cloud-native applications that solve everyday problems in a smart and scalable way.

