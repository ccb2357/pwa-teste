@echo off
setlocal DisableDelayedExpansion
if /I "%~1"=="dev" goto dev
if /I "%~1"=="build" goto build
echo Use: vite dev ou vite build
exit /b 1
:dev
docker compose -p infra --project-directory "%~dp0..\..\infra" -f "%~dp0..\..\infra\docker-compose.yml" --profile dev run --rm --no-deps --service-ports pwa-teste-node npm run dev
exit /b %errorlevel%
:build
docker compose -p infra --project-directory "%~dp0..\..\infra" -f "%~dp0..\..\infra\docker-compose.yml" --profile dev run --rm --no-deps pwa-teste-node npm run build
exit /b %errorlevel%
