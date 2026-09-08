# Artisan Bridge

You are a Senior Software Architect, Senior Flutter Developer, Python Backend Engineer, AI Engineer, UI/UX Designer, Product Manager, and Smart India Hackathon Mentor.

Your task is to help me build a complete production-quality mobile application for Smart India Hackathon.

Project Title

ArtisanLink – AI Driven Market Linkage & Smart Cataloging Platform for Marginalized Artisans

Problem Statement

Build an AI-powered mobile application that helps marginalized artisans digitally catalog their handmade products, automatically generate product information using AI, translate product details into local languages, recommend prices, and connect artisans directly with buyers.

The application must be modern, scalable, modular, and impressive enough to win Smart India Hackathon.

-------------------------------------------------

OBJECTIVES

The application should solve these problems:

• Artisans struggle to create digital product catalogs.

• Most artisans don't know English.

• They don't know product categories.

• They don't know market pricing.

• Their products are difficult for buyers to discover.

The application should use AI to automate these tasks.

-------------------------------------------------

USERS

1. Artisan

Can:

Register

Login

Upload product image

View AI-generated details

Edit generated details

Save product

Manage products

View buyer interest

Receive notifications

View analytics

2. Buyer

Can:

Browse products

Search

Filter

View artisan profile

Save products

Contact artisan

-------------------------------------------------

TECH STACK

Frontend

Flutter

Backend

Python Flask

Database

PostgreSQL

ORM

SQLAlchemy

AI

Google Gemini API

Storage

Firebase Storage

Authentication

Firebase Authentication

Maps

Google Maps API

Notifications

Firebase Cloud Messaging

Deployment

Render

-------------------------------------------------

APPLICATION FLOW

Artisan Login

↓

Dashboard

↓

Upload Product Image

↓

Image sent to Flask API

↓

Gemini Vision analyzes image

↓

Generate

Product Name

Description

Category

Craft Type

Materials

Tags

Suggested Price

↓

Translate into

English

Hindi

Kannada

Tamil

↓

Show editable result

↓

Save into Database

↓

Buyer can discover product

-------------------------------------------------

AI FEATURES

Image Recognition

Smart Description Generation

Category Prediction

Craft Identification

Tag Generation

SEO Product Title

Price Recommendation

Language Translation

Buyer Recommendation

Related Product Recommendation

-------------------------------------------------

PRICE SUGGESTION

AI should estimate price using

Craft Type

Material

Complexity

Size

Labor

Location

Historical Data

Return price range

Example

₹450 - ₹650

-------------------------------------------------

DATABASE TABLES

Users

Products

Categories

Tags

Translations

BuyerInterest

Notifications

Analytics

-------------------------------------------------

API ENDPOINTS

POST /auth/login

POST /auth/register

POST /upload-image

POST /generate-ai-catalog

POST /save-product

GET /products

GET /products/{id}

PUT /products/{id}

DELETE /products/{id}

GET /buyer/recommendations

-------------------------------------------------

FLUTTER SCREENS

Splash Screen

Onboarding

Login

Register

Artisan Dashboard

Upload Product

AI Processing Screen

AI Result Screen

Edit Product

My Products

Buyer Home

Search

Category

Product Details

Artisan Profile

Notifications

Settings

-------------------------------------------------

UI STYLE

Minimal

Modern

Premium

Material 3

Beautiful animations

Rounded Cards

Gradient Buttons

Dark & Light Mode

Responsive

Professional

-------------------------------------------------

PROJECT STRUCTURE

frontend/

flutter project

backend/

Flask

routes/

models/

services/

database/

uploads/

config/

-------------------------------------------------

CODING RULES

Use clean architecture.

Use repository pattern.

Separate UI, business logic and data.

Write reusable widgets.

Use Provider or Riverpod for state management.

Use SQLAlchemy ORM.

Write modular Flask APIs.

Store secrets in .env.

Follow REST standards.

Write proper comments.

Handle all exceptions.

-------------------------------------------------

WHAT I EXPECT

I DO NOT want the entire project at once.

Instead:

1. First design complete architecture.

2. Then folder structure.

3. Then backend.

4. Then database.

5. Then AI integration.

6. Then Flutter UI.

7. Then API integration.

8. Then testing.

9. Then deployment.

At every step:

Explain why.

Generate complete code.

Explain code.

Tell me where each file belongs.

Tell me how to run it.

Tell me how to test it.

Wait for my confirmation before moving to the next step.

Never skip explanations.

Act as my technical mentor throughout the project.

The goal is to build a Smart India Hackathon winning prototype with production-quality architecture.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://art-genie-link.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/05154aa1-8f0d-4aee-a85a-20471c6f6c02).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
