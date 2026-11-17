# GlowAtHome – Beauty Home Services

A sample Node.js + Express booking app with optional AWS DynamoDB storage.

## Requirements
- Node.js 20 or newer
- npm
- AWS account only if you want DynamoDB persistence

## Run locally
```bash
npm install
npm start
```
Open http://localhost:3000. Without `DYNAMODB_TABLE`, the app uses temporary in-memory demo storage.

## Enable DynamoDB
Create a DynamoDB table named `BeautyBookings` with partition key:
- `bookingId` (String)

Set environment variables:
```bash
export AWS_REGION=ap-southeast-2
export DYNAMODB_TABLE=BeautyBookings
npm start
```
Use an EC2 instance IAM role with `dynamodb:PutItem` and `dynamodb:Scan` permissions for this table. Do not put AWS access keys in the source code or `.env` on EC2.

## EC2 Ubuntu deployment outline
1. Launch Ubuntu EC2 and allow inbound TCP 22 from your IP and TCP 3000 for a lab demo.
2. Attach an IAM role that can write/read the DynamoDB table.
3. SSH into the instance, install Node.js 20, upload/clone this project.
4. Run `npm install`, set `AWS_REGION` and `DYNAMODB_TABLE`, then run `npm start`.
5. Browse `http://EC2-PUBLIC-IP:3000`.

For a production deployment, put the app behind HTTPS (for example, Nginx + TLS or an Application Load Balancer), restrict inbound access, and use a process manager such as systemd or PM2.
