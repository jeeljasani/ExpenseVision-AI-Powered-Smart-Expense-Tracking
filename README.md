
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

## 🗺️ Architecture Overview
