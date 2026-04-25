@echo off
echo Running QA review...
if not exist qa-reports mkdir qa-reports
node qa.js
if %ERRORLEVEL% NEQ 0 (
  echo QA review failed.
  exit /b %ERRORLEVEL%
)
echo Done.