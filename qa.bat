@echo off
echo Running QA review...
node qa.js
if %ERRORLEVEL% NEQ 0 (
  echo QA review failed.
  exit /b %ERRORLEVEL%
)
echo Done.