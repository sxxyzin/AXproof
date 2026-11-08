@echo off
chcp 65001 >nul
title AX Proof
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [AX Proof] Node.js 가 필요합니다. https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [AX Proof] 처음 실행이라 필요한 패키지를 설치합니다...
  call npm install --no-audit --no-fund
)

call node scripts\prepare-env.js

start "" "http://localhost:3000/"
echo [AX Proof] 서버를 시작합니다. 이 창을 닫으면 서버가 꺼집니다.
node server.js
pause
