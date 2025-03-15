@echo off
setlocal enabledelayedexpansion

echo Coterate Environment Setup
echo This script will help you set up your environment variables for Coterate.
echo.

REM Check if .env.example exists
if not exist .env.example (
  echo Error: .env.example file not found.
  exit /b 1
)

REM Check if .env.local already exists
if exist .env.local (
  echo Warning: .env.local file already exists.
  set /p overwrite=Do you want to overwrite it? (y/n): 
  if /i not "!overwrite!"=="y" (
    echo Setup cancelled.
    exit /b 0
  )
)

REM Copy .env.example to .env.local
copy .env.example .env.local > nul
echo Created .env.local file from template.
echo.

REM Prompt for API keys
echo Please enter your API keys:
echo.

REM OpenAI API Key
set /p openai_key=OpenAI API Key: 
if "!openai_key!"=="" (
  echo Warning: No OpenAI API key provided. You'll need to add it manually to .env.local
) else (
  REM Create a temporary file with the replacement
  type .env.local | findstr /v "REACT_APP_OPENAI_API_KEY" > temp.env
  echo REACT_APP_OPENAI_API_KEY=!openai_key!>> temp.env
  move /y temp.env .env.local > nul
  echo OpenAI API key added to .env.local
)

REM Stability AI API Key
set /p stability_key=Stability AI API Key: 
if "!stability_key!"=="" (
  echo Warning: No Stability AI API key provided. You'll need to add it manually to .env.local
) else (
  REM Create a temporary file with the replacement
  type .env.local | findstr /v "REACT_APP_STABILITY_API_KEY" > temp.env
  echo REACT_APP_STABILITY_API_KEY=!stability_key!>> temp.env
  move /y temp.env .env.local > nul
  echo Stability AI API key added to .env.local
)

echo.
echo Setup complete!
echo Your environment variables have been configured in .env.local
echo.
echo If you need to modify your API keys in the future, edit the .env.local file directly.
echo Remember: Never commit your .env.local file to version control.

endlocal 