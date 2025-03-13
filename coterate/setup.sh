#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js before continuing."
    exit 1
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    echo "Installing dependencies using npm..."
    npm install
    
    echo "Starting the application..."
    npm start
# Check if yarn is installed
elif command -v yarn &> /dev/null; then
    echo "Installing dependencies using yarn..."
    yarn install
    
    echo "Starting the application..."
    yarn start
else
    echo "Neither npm nor yarn is installed. Please install one of them before continuing."
    exit 1
fi 