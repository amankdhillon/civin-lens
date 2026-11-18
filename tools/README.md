# Agenda import

Loads meetings and agenda items into Supabase from the files in `data/agendas/`.

## Setup (once)
Needs Node 18 or newer.

    cd tools
    npm install

## Run
Use the SECRET key from Project Settings > API Keys. It bypasses the security rules, so keep it on your computer only. Never put it in the website or in the repository.

  

The import checks every file before writing anything. Running it again updates existing meetings and items, so stages change as the agenda changes.

## Adding a city
Copy `data/agendas/TEMPLATE.json`, fill it in from the body's official agenda, and run the import. Each body needs its row in `bodies` first.

## Daily updates
Once the process works by hand, run the import on a schedule, such as a daily cron job on a server or a scheduled GitHub Action that stores the secret key as a repository secret.
